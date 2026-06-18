import { DEFAULT_AUTHORITY_REGISTRY } from './authorityRegistry.js';
import { createAgenticSeedTrace, routeMockToolCall } from './mockToolRouter.js';
import { runAdversarialDetection } from './controls/adversarialDetection.js';
import { runPiiLeakageGuard } from './controls/piiLeakageGuard.js';
import { runActivityLogging } from './controls/activityLogging.js';
import { computeVerdict } from './computeVerdict.js';

const makeRunId = () => Math.random().toString(36).slice(2, 10).toUpperCase();

export async function runAgenticCase(caseData, profile, registry = DEFAULT_AUTHORITY_REGISTRY) {
  const runId = makeRunId();
  const trace = createAgenticSeedTrace(caseData);
  const events = [
    { event: 'agentic_case_started', caseId: caseData.id, profile: profile.id, registry: registry.id },
  ];

  const retrieval = trace.find(item => item.event === 'tool_result' && item.tool === 'retrieve_document');
  const detectionResult = runAdversarialDetection(
    retrieval?.output?.content || '',
    profile.controls.adversarialDetection
  );
  events.push({ event: 'tool_output_detection_result', ...detectionResult });

  const attackBlocked = detectionResult.detection_action === 'blocked_or_constrained';
  const plannedCalls = trace.filter(item => item.event === 'tool_call_planned').map(item => item.toolCall);
  const routedToolResults = [];

  for (const toolCall of plannedCalls) {
    if (attackBlocked && toolCall.instructionSource === 'retrieved_content') {
      routedToolResults.push({
        tool_name: toolCall.tool,
        instruction_source: toolCall.instructionSource,
        tool_call_attempted: true,
        tool_call_executed: false,
        tool_blocked: true,
        tool_block_reason: 'Adversarial retrieved content was blocked before the agent could act on it.',
        simulated_only: true,
      });
      continue;
    }
    routedToolResults.push(routeMockToolCall(toolCall, profile, registry));
  }

  routedToolResults.forEach(result => events.push({ event: 'mock_tool_router_decision', ...result }));

  const finalToolResult = routedToolResults[routedToolResults.length - 1] || {};
  const responseText = routedToolResults
    .filter(result => result.output?.content)
    .map(result => result.output.content)
    .join('\n\n');
  const piiResult = runPiiLeakageGuard(responseText, profile.controls.piiFilter);
  events.push({ event: 'agentic_pii_scan_result', ...piiResult });

  const loggingResult = runActivityLogging(profile.controls.activityLogging, events);
  const verdict = computeVerdict({
    attackBlocked,
    detectionResult,
    piiResult,
    toolResult: {
      tool_call_attempted: routedToolResults.some(result => result.tool_call_attempted),
      tool_call_executed: routedToolResults.some(result => result.tool_call_executed && result.instruction_source === 'retrieved_content'),
      tool_blocked: routedToolResults.some(result => result.tool_blocked),
    },
    loggingResult,
    profile,
  });

  events.push({ event: 'agentic_final_verdict', verdict });
  loggingResult.log_entries = events;

  return {
    run_id: `ORPHEUS-AGENTIC-${runId}`,
    case_id: caseData.id,
    case_title: caseData.title,
    target_id: 'AGENTIC-DEMO-TARGET-v1',
    control_profile: profile.id,
    authority_registry: registry.id,
    timestamp: new Date().toISOString(),
    attack_detected: detectionResult.attack_detected,
    attack_blocked: attackBlocked,
    detection_action: detectionResult.detection_action,
    detection_reason: detectionResult.detection_reason,
    tool_call_attempted: routedToolResults.some(result => result.tool_call_attempted),
    tool_call_executed: routedToolResults.some(result => result.tool_call_executed && result.instruction_source === 'retrieved_content'),
    tool_blocked: routedToolResults.some(result => result.tool_blocked),
    tool_block_reason: finalToolResult.tool_block_reason || null,
    sensitive_data_exposed: piiResult.sensitive_data_exposed,
    data_class: piiResult.data_class ?? null,
    redaction_applied: piiResult.redaction_applied,
    output_blocked: piiResult.output_blocked,
    activity_logged: loggingResult.activity_logged,
    response_preserved: loggingResult.response_preserved,
    tool_trace_preserved: loggingResult.tool_trace_preserved,
    review_required: loggingResult.review_required,
    control_verdict: verdict,
    agentic_mode: true,
    simulated_only: true,
    tool_sequence: routedToolResults,
    mappings: caseData.mappings,
    _trace: trace,
    _log: loggingResult.log_entries,
  };
}
