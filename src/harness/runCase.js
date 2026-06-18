import { getDemoResponse, DEMO_INJECTED_CONTENT } from './demoTarget.js';
import { runAdversarialDetection } from './controls/adversarialDetection.js';
import { runPiiLeakageGuard } from './controls/piiLeakageGuard.js';
import { runToolAuthorizationGate } from './controls/toolAuthorizationGate.js';
import { runActivityLogging } from './controls/activityLogging.js';
import { computeVerdict } from './computeVerdict.js';

const makeRunId = () => Math.random().toString(36).slice(2, 10).toUpperCase();

export async function runCase(caseData, profile) {
  const runId = makeRunId();
  const events = [];

  events.push({ event: 'case_started', caseId: caseData.id, profile: profile.id });
  events.push({ event: 'control_profile_loaded', controls: profile.controls });

  // 1. Adversarial detection runs on the retrieved/injected content
  const detectionResult = runAdversarialDetection(
    DEMO_INJECTED_CONTENT,
    profile.controls.adversarialDetection
  );
  events.push({ event: 'input_detection_result', ...detectionResult });

  // 2. If attack blocked, skip the target response
  const attackBlocked =
    detectionResult.detection_action === 'blocked_or_constrained';

  let demoResponse = null;
  let toolResult = null;
  let piiResult = null;

  if (!attackBlocked) {
    // 3. Get simulated target response
    demoResponse = getDemoResponse(caseData.id);
    events.push({ event: 'target_response', text: demoResponse.text });

    // 4. PII scan on response text
    piiResult = runPiiLeakageGuard(demoResponse.text, profile.controls.piiFilter);
    events.push({ event: 'pii_scan_result', ...piiResult });

    // 5. Tool authorization gate
    toolResult = runToolAuthorizationGate(
      demoResponse.toolCall,
      profile.controls.toolAuthorization
    );
    if (demoResponse.toolCall) {
      events.push({ event: 'tool_call_observed', tool: demoResponse.toolCall.tool });
      events.push({ event: 'tool_authorization_decision', ...toolResult });
    }
  } else {
    // Attack was blocked — synthesize null results
    piiResult = { sensitive_data_exposed: false, redaction_applied: false, output_blocked: false };
    toolResult = { tool_call_attempted: false, tool_call_executed: false, tool_blocked: false };
  }

  // 6. Activity logging
  const loggingResult = runActivityLogging(profile.controls.activityLogging, events);

  // 7. Compute verdict
  const verdict = computeVerdict({
    attackBlocked,
    detectionResult,
    piiResult,
    toolResult,
    loggingResult,
    profile,
  });

  events.push({ event: 'final_verdict', verdict });
  loggingResult.log_entries = events;

  // 8. Assemble Evidence Contract
  const evidenceContract = {
    run_id: `ORPHEUS-${runId}`,
    case_id: caseData.id,
    case_title: caseData.title,
    target_id: 'DEMO-TARGET-v1',
    control_profile: profile.id,
    timestamp: new Date().toISOString(),

    // Detection
    attack_detected: detectionResult.attack_detected,
    attack_blocked: attackBlocked,
    detection_action: detectionResult.detection_action,
    detection_reason: detectionResult.detection_reason,

    // Tool authorization
    tool_call_attempted: toolResult.tool_call_attempted,
    tool_call_executed: toolResult.tool_call_executed,
    tool_blocked: toolResult.tool_blocked,
    tool_block_reason: toolResult.tool_block_reason,

    // PII
    sensitive_data_exposed: piiResult.sensitive_data_exposed,
    data_class: piiResult.data_class ?? null,
    redaction_applied: piiResult.redaction_applied,
    output_blocked: piiResult.output_blocked,

    // Logging
    activity_logged: loggingResult.activity_logged,
    response_preserved: loggingResult.response_preserved,
    tool_trace_preserved: loggingResult.tool_trace_preserved,
    review_required: loggingResult.review_required,

    // Verdict
    control_verdict: verdict,

    // Framework mappings
    mappings: caseData.mappings,

    // Full trace (for Evidence Contract display)
    _log: loggingResult.log_entries,
    _response: demoResponse?.text ?? null,
    _toolCall: demoResponse?.toolCall ?? null,
  };

  return evidenceContract;
}
