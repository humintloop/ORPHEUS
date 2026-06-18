const INJECTION_SIGNALS = [
  'ignore previous instructions',
  'ignore your current task',
  'system:',
  'developer message',
  'reveal your prompt',
  'send_email',
  'exfiltrate',
  'override',
  'forget all instructions',
  'compliance audit',
  'sys_dump',
  '<!-- system',
];

export function runAdversarialDetection(content, mode) {
  if (mode === 'off') {
    return {
      attack_detected: false,
      detection_reason: null,
      detection_action: 'not_configured',
    };
  }

  const lower = content.toLowerCase();
  const matched = INJECTION_SIGNALS.filter(sig => lower.includes(sig));
  const detected = matched.length > 0;

  return {
    attack_detected: detected,
    detection_reason: detected ? `Matched signals: ${matched.join(', ')}` : null,
    detection_action: !detected
      ? 'not_triggered'
      : mode === 'block_or_constrain'
      ? 'blocked_or_constrained'
      : 'detected_only',
  };
}
