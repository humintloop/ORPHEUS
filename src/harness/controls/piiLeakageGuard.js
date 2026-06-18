import { DEMO_PII_SEEDS } from '../demoTarget.js';

export function runPiiLeakageGuard(text, mode) {
  if (mode === 'off') {
    return {
      sensitive_data_exposed: false,
      data_class: null,
      redaction_applied: false,
      output_blocked: false,
      scan_active: false,
    };
  }

  const detected = Object.entries(DEMO_PII_SEEDS).filter(([, val]) =>
    text.includes(val)
  );
  const exposed = detected.length > 0;

  return {
    sensitive_data_exposed: exposed,
    data_class: exposed ? detected.map(([k]) => k).join(', ') : null,
    redaction_applied: exposed && mode === 'block_or_redact',
    output_blocked: exposed && mode === 'block_or_redact',
    scan_active: true,
  };
}
