import { HIGH_RISK_TOOLS } from '../demoTarget.js';

export function runToolAuthorizationGate(toolCall, mode) {
  if (!toolCall) {
    return {
      tool_call_attempted: false,
      tool_call_executed: false,
      tool_allowed: true,
      authorization_required: false,
      authorization_present: false,
      tool_blocked: false,
      tool_block_reason: null,
    };
  }

  const isHighRisk = HIGH_RISK_TOOLS.includes(toolCall.tool);
  const fromUntrustedSource = toolCall.instructionSource === 'retrieved_content';
  const authorizationRequired = isHighRisk || fromUntrustedSource;
  const authorizationPresent = mode === 'enforce';
  const blocked = authorizationRequired && authorizationPresent;

  return {
    tool_call_attempted: true,
    tool_call_executed: !blocked,
    tool_allowed: !isHighRisk,
    authorization_required: authorizationRequired,
    authorization_present: authorizationPresent,
    tool_blocked: blocked,
    tool_block_reason: blocked
      ? `High-risk tool '${toolCall.tool}' called from untrusted source '${toolCall.instructionSource}'. Authorization enforced.`
      : null,
  };
}
