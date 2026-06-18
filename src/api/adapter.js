// Fetch-based replacement for the WebLLM MLCEngine when running in API target mode.
// `endpoint` must be the full request URL (e.g. "https://api.openai.com/v1/chat/completions"
// or "https://api.anthropic.com/v1/messages") — it is used exactly as given, nothing is appended.
// The API key is held only as an instance field; it is never written to storage.

export const PROVIDERS = { OPENAI: 'openai', ANTHROPIC: 'anthropic', GENERIC: 'generic' };

export function detectProvider(endpoint = '') {
  const host = endpoint.toLowerCase();
  if (host.includes('api.anthropic.com')) return PROVIDERS.ANTHROPIC;
  if (host.includes('api.openai.com')) return PROVIDERS.OPENAI;
  return PROVIDERS.GENERIC;
}

// The endpoint is used exactly as entered — callers are expected to supply the full
// request URL (e.g. "https://api.openai.com/v1/chat/completions" or
// "https://api.anthropic.com/v1/messages"). No path is appended or rewritten.
function buildUrl(endpoint) {
  return endpoint.trim();
}

function buildHeaders(apiKey, provider) {
  if (provider === PROVIDERS.ANTHROPIC) {
    return {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    };
  }
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };
}

// Anthropic takes system prompt as a top-level field, not as a message.
function splitSystemMessages(messages) {
  const system = messages.filter(m => m.role === 'system').map(m => m.content).join('\n\n');
  const rest = messages.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content }));
  return { system, rest };
}

function buildBody({ provider, modelId, messages, temperature, max_tokens, stream }) {
  if (provider === PROVIDERS.ANTHROPIC) {
    const { system, rest } = splitSystemMessages(messages);
    return {
      model: modelId,
      system: system || undefined,
      messages: rest,
      temperature,
      max_tokens: max_tokens || 1024,
      stream,
    };
  }
  return { model: modelId, messages, temperature, max_tokens, stream };
}

async function readErrorMessage(response) {
  try {
    const body = await response.json();
    return body?.error?.message || body?.message || `${response.status} ${response.statusText}`;
  } catch {
    return `${response.status} ${response.statusText}`;
  }
}

async function* parseSSE(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) return;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const data = trimmed.slice(5).trim();
      if (data === '[DONE]') return;
      yield JSON.parse(data);
    }
  }
}

// Normalizes provider-specific stream events into the WebLLM/OpenAI delta shape
// the rest of the app already consumes: chunk.choices[0].delta.content
async function* streamChunks(response, provider) {
  for await (const event of parseSSE(response)) {
    if (provider !== PROVIDERS.ANTHROPIC) {
      yield event;
      continue;
    }
    if (event.type === 'error') throw new Error(event.error?.message || 'Anthropic API error');
    if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
      yield { choices: [{ delta: { content: event.delta.text } }] };
    }
  }
}

export class APITargetAdapter {
  constructor({ endpoint, apiKey, modelId }) {
    this.endpoint = endpoint;
    this.apiKey = apiKey;
    this.modelId = modelId;
    this.provider = detectProvider(endpoint);
    this.chat = { completions: { create: (opts) => this._create(opts) } };
  }

  async _create({ messages, temperature, max_tokens, stream = true }) {
    const url = buildUrl(this.endpoint);
    const headers = buildHeaders(this.apiKey, this.provider);
    const body = buildBody({ provider: this.provider, modelId: this.modelId, messages, temperature, max_tokens, stream });

    const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    if (!response.ok) throw new Error(await readErrorMessage(response));

    if (!stream) {
      const data = await response.json();
      if (this.provider === PROVIDERS.ANTHROPIC) {
        const text = (data.content || []).map(block => block.text || '').join('');
        return { choices: [{ message: { content: text } }] };
      }
      return data;
    }

    return streamChunks(response, this.provider);
  }

  // No-ops kept so this adapter can drop in for engineRef.current (MLCEngine) interchangeably.
  async reload(modelId) { this.modelId = modelId; }
  async unload() {}
}
