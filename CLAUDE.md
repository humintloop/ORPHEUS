# ORPHEUS

Production adversarial evaluation for LLM APIs and AI agents.
Forked from ELICIT (humintloop/ELICIT) which stays as the offline training tool.

## What this is
- ELICIT tests local WebGPU models (training/education)
- ORPHEUS tests production API endpoints and AI agents (operational)

## Stack
Vite + React, JSX, no TypeScript, no Tailwind.
Inline styles using the C design token object (see src/App.jsx).
Fonts: Space Grotesk (sans), Geist Mono (mono), Rajdhani (wordmark).

## Design tokens (C object)
Dark navy base (#0A0C16), amber primary (#C87844), teal secondary (#00CFC4).
All colors, fonts, and spacing come from C. Never hardcode values outside it.

## What we're building first
API target mode — a fetch-based adapter that replaces the WebLLM engine.
Accepts: endpoint URL, API key (memory only, never persisted), model ID.
Same probe library, same heuristics, same findings as ELICIT.
OpenAI-compatible message format. Must support OpenAI, Anthropic, and generic endpoints.

## Key conventions
- Components in src/components/
- Data/mappings in src/data/
- No TypeScript
- Commit messages: "feat:", "fix:", "refactor:" prefixes
- API key never touches localStorage or any storage
