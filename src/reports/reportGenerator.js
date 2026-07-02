import { ASSURANCE_PROFILE, CONTROL_SET, CONTROL_SET_VERSION, FRAMEWORK_MAPPING_VERSION, FRAMEWORK_REFERENCES, getMappedControls } from '../data/frameworkMappings';
import { getMitigationMapping, MITIGATION_SET_VERSION } from '../data/mitigationMappings';

const truncate = (value = '', max = 1800) => {
  const text = String(value || '');
  return text.length > max ? `${text.slice(0, max)}…` : text;
};

const list = (items = []) => items.length ? items.map(item => `- ${item}`).join('\n') : '- None recorded';

const section = (title, value) => {
  const text = String(value || '').trim();
  return text ? `### ${title}\n${text}\n\n` : '';
};

const controlList = (ids = []) => {
  const controls = getMappedControls(ids);
  return controls.length
    ? controls.map(c => `- ${c.id} — ${c.name}: ${c.objective}`).join('\n')
    : '- None mapped';
};

const mitigationReferenceList = (items = []) => items.length
  ? items.map(item => `- ${item.source}: ${item.id} — ${item.name}`).join('\n')
  : '- None mapped';

const frameworkList = (finding = {}) => {
  const lines = [];
  if (finding.techniqueId) lines.push(`- MITRE ATLAS: ${finding.techniqueId} — ${finding.techniqueName || FRAMEWORK_REFERENCES.mitre_atlas[finding.techniqueId] || 'Mapped technique'}`);
  if (finding.owasp) lines.push(`- OWASP LLM Top 10: ${finding.owasp} — ${FRAMEWORK_REFERENCES.owasp[finding.owasp] || 'Mapped risk category'}`);
  (finding.nistAiRmf || finding.nist_ai_rmf || []).forEach(fn => lines.push(`- NIST AI RMF: ${fn}`));
  (finding.iso42001Relevance || finding.iso_42001_relevance || []).forEach(clause => lines.push(`- ISO/IEC 42001 relevance: ${clause} — ${FRAMEWORK_REFERENCES.iso_42001[clause] || 'Relevant AI management system performance-evaluation evidence'}`));
  (finding.euAiActRelevance || finding.eu_ai_act_relevance || []).forEach(article => lines.push(`- EU AI Act readiness relevance (${finding.euAiActScope || finding.eu_ai_act_scope || ASSURANCE_PROFILE.eu_ai_act_scope.default_status}): ${article} — ${FRAMEWORK_REFERENCES.eu_ai_act[article] || 'Relevant obligation if system is in scope'}`));
  return lines.length ? lines.join('\n') : '- None mapped';
};

const runModeLabel = (finding = {}) => {
  if (finding.assessmentMode === 'quick') return 'Quick Endpoint Test';
  if (finding.targetModeLabel) return finding.targetModeLabel;
  if (finding.targetMode === 'api' || /api target|fetch/i.test(finding.victimRuntime || '')) return 'API Endpoint';
  if (finding.targetMode === 'local' || /webgpu|webllm|browser-hosted/i.test(finding.victimRuntime || '')) return 'Local Model Lab';
  if (finding.simulated_only || finding.simulatedOnly) return 'Demo Harness';
  return 'Not recorded';
};

const evidenceBoundary = (finding = {}) => finding.evidenceBoundary
  || (['API Endpoint', 'Quick Endpoint Test'].includes(runModeLabel(finding))
    ? 'Authenticated browser fetch to configured endpoint; API key was held in memory only and not persisted by ORPHEUS.'
    : runModeLabel(finding) === 'Local Model Lab'
      ? 'Local browser WebGPU runtime; no external inference calls after model download.'
      : 'Evidence boundary not recorded.');

const summarizeRunModes = (findings = []) => {
  const labels = [...new Set(findings.map(runModeLabel).filter(label => label !== 'Not recorded'))];
  if (labels.length === 0) return 'No run source was recorded for the active findings.';
  if (labels.length === 1 && labels[0] === 'API Endpoint') {
    return 'This report summarizes adversarial probes sent from ORPHEUS to configured API endpoints. Evidence records are local browser records unless separately exported into an enterprise evidence system.';
  }
  if (labels.length === 1 && labels[0] === 'Quick Endpoint Test') {
    return 'This report summarizes a fast adversarial smoke test sent from ORPHEUS to a configured API endpoint. Evidence records are local browser records unless separately exported into an enterprise evidence system.';
  }
  if (labels.length === 1 && labels[0] === 'Local Model Lab') {
    return 'This report summarizes local browser-model evaluations. Local lab results are useful for training and exploration, but do not by themselves validate a production endpoint or deployed agent boundary.';
  }
  if (labels.length === 1 && labels[0] === 'Demo Harness') {
    return 'This report summarizes seeded demo harness evidence. Demo harness evidence is for training and control walkthroughs only; it does not come from a live endpoint.';
  }
  return `This report summarizes mixed evidence sources: ${labels.join(', ')}. Interpret each finding according to its recorded run source and evidence boundary.`;
};

export function buildFindingMarkdown(finding) {
  const controls = finding.selectedControlIds || finding.mappedControls || finding.mapped_controls || [];
  const mitigation = getMitigationMapping(finding.techniqueId);
  const officialMitigations = finding.officialMitigations || finding.official_mitigations || mitigation.official_mitigations || [];
  const recommendedMitigations = finding.recommendedMitigations || finding.recommended_mitigations || mitigation.recommended_mitigations;
  const retestGuidance = finding.retestGuidance || finding.retest_guidance || mitigation.retest_guidance;
  const readinessGaps = finding.readinessGaps || finding.readiness_gaps || [];
  const evidenceRequirements = finding.evidenceRequirements || finding.evidence_requirements || [];
  const responseExcerpt = truncate(finding.evidenceExcerpt || finding.responseExcerpt || finding.response || '', 1000);
  const fullResponse = truncate(finding.responseFull || finding.response || '', 2500);
  const showFullResponse = fullResponse && fullResponse !== responseExcerpt;
  return `## Finding: ${finding.payloadName || finding.caseName || 'Untitled Evaluation Case'}

**Run ID:** ${finding.runId || finding.id || 'Not recorded'}<br>
**Finding ID:** ${finding.findingId || finding.id || 'Not recorded'}<br>
**Case File:** ${finding.caseFileId || 'Not recorded'}<br>
**System Under Test:** ${finding.systemUnderTest || 'Not recorded'}<br>
**Verdict:** ${finding.verdict || 'Unknown'}<br>
**Review Status:** ${finding.reviewStatus || 'Not recorded'}<br>
**Reviewer Decision:** ${finding.reviewerDecision || 'UNREVIEWED'}<br>
**Reviewer Reviewed At:** ${finding.reviewerReviewedAt || finding.reviewer_reviewed_at || 'Not recorded'}<br>
**Verdict Source:** ${finding.finalVerdictSource || 'Not recorded'}<br>
**Control Effectiveness:** ${finding.effectivenessAssessment || 'NOT ASSESSED'}<br>
**System Prompt Hash:** ${finding.promptHash || 'Not recorded'}<br>
**Test Case:** ${finding.caseId || finding.payloadId || 'custom'}<br>
**Case Version:** ${finding.caseVersion || finding.case_version || 'Not recorded'}<br>
**Technique:** ${finding.techniqueId || 'Unmapped'} — ${finding.techniqueName || ''}<br>
**OWASP:** ${finding.owasp || 'Unmapped'}<br>
**Victim Model:** ${finding.victimModel || 'Not recorded'}<br>
**Run Source:** ${runModeLabel(finding)}<br>
**Runtime:** ${finding.victimRuntime || 'Not recorded'}<br>
**Endpoint Origin:** ${finding.targetEndpointOrigin || 'Not recorded'}<br>
**Timestamp:** ${finding.timestamp || 'Not recorded'}

${section('Evidence Boundary', evidenceBoundary(finding))}
${section('Case Description', finding.caseDescription || finding.description)}
${section('Objective', finding.objective)}
${section('Expected Secure Behavior', finding.expectedSecureBehavior || finding.expected_secure_behavior)}
${section('Failure Mode', finding.failureMode || finding.failure_mode)}
${section('Success / Failure Criteria', finding.successCriteria || finding.success_criteria)}
${section('Control Gap Statement', finding.controlGapStatement || 'Control gap statement not completed — finding is not audit-ready.')}
### Response Excerpt
> ${responseExcerpt.replace(/\n/g, '\n> ')}

### Evaluation Rationale
- Heuristic Verdict: ${finding.heuristicVerdict || 'Not recorded'}${finding.heuristicLabel ? ` (${finding.heuristicLabel})` : ''}
- Heuristic Rationale: ${finding.evalReason || 'Not recorded'}
- LLM Judge Verdict: ${finding.judgeVerdict || 'Not used'}
- LLM Judge Rationale: ${finding.judgeRationale || finding.judgeReason || 'Not used or not recorded'}
- Evaluation Disagreement: ${finding.evaluationDisagreement ? 'Yes — manual review required' : 'No material disagreement recorded'}
- Evaluation Note: ${finding.evaluationNote || 'None'}
- Reviewer Notes: ${finding.reviewerNotes || finding.notes || 'None recorded'}

### Evidence Requirements
${list(evidenceRequirements)}

### Impacted Controls
${controlList(controls)}

### Framework Relevance
${frameworkList(finding)}

### Framework Readiness Gaps
${list(readinessGaps)}

### Official Mitigation References
${mitigationReferenceList(officialMitigations)}

### ORPHEUS Recommended Actions
${list(recommendedMitigations)}

### Retest Guidance
${list(retestGuidance)}

### Prompt Payload
\`\`\`text
${truncate(finding.payload || '', 1800)}
\`\`\`

${showFullResponse ? `### Stored Full Response
\`\`\`text
${fullResponse}
\`\`\`
` : ''}
`;
}

export function generateAssessmentReport(findings = [], metadata = {}) {
  const date = new Date().toISOString();
  const activeFindings = findings.filter(f => (f.reviewerDecision || f.reviewer_decision) !== 'FALSE_POSITIVE');
  const successful = activeFindings.filter(f => ['SUCCESS', 'PARTIAL'].includes(f.verdict)).length;
  const falsePositive = findings.length - activeFindings.length;
  const controlIds = [...new Set(activeFindings.flatMap(f => f.mappedControls || f.mapped_controls || []))];
  const controls = controlIds.map(id => CONTROL_SET[id]).filter(Boolean);

  return `# LLM Adversarial Evaluation Report

Generated: ${date}  
Assessment ID: ${metadata.assessmentId || `assessment-${date.slice(0, 10)}`}  
Assurance Profile: ${metadata.assuranceProfile || ASSURANCE_PROFILE.label}<br>
Control Set Version: ${CONTROL_SET_VERSION}<br>
Framework Mapping Version: ${FRAMEWORK_MAPPING_VERSION}<br>
Mitigation Set Version: ${MITIGATION_SET_VERSION}

## Executive Summary

${summarizeRunModes(activeFindings)}

ORPHEUS treats findings as **evidence indicators**: a successful or partial adversarial result indicates a potential control weakness that should be reviewed, reproduced, remediated, and retested. Framework mappings are provided for traceability and do not constitute legal, audit, or certification conclusions.

- Findings logged: ${findings.length}
- Successful or partial findings, excluding reviewer-marked false positives: ${successful}
- Reviewer-marked false positives: ${falsePositive}
- Unique impacted controls: ${controlIds.length}

## Framework Readiness Lens

This report uses the **${ASSURANCE_PROFILE.label}** profile for AI-enabled SaaS, cybersecurity, edge, cloud, or critical digital infrastructure providers. ISO/IEC 42001 references focus on Clause 9 performance-evaluation evidence: monitoring and measurement, internal audit, and management review. EU AI Act references are high-risk readiness indicators only; classification depends on the specific AI system, intended purpose, jurisdiction, and whether it is used as a safety component in critical digital infrastructure or another high-risk category.

Profile scope note: ${ASSURANCE_PROFILE.scope_note}

EU AI Act scope status: ${ASSURANCE_PROFILE.eu_ai_act_scope.default_status}. ${ASSURANCE_PROFILE.eu_ai_act_scope.note}

## Scope and Methodology

The evaluation workflow is:

1. Select an authorized target mode: API Endpoint, Local Model Lab, or seeded Demo Harness.
2. Configure the target system prompt, model identifier, and probe family.
3. Run a structured adversarial evaluation case.
4. Capture the target response, heuristic result, and any configured judge or reviewer signal.
5. Log an evidence record with response excerpts, evaluator outputs, reviewer disposition, control mapping, and framework relevance.

## Impacted Control Summary

${controls.length ? controls.map(c => `- ${c.id} — ${c.name} (${c.domain})`).join('\n') : '- No mapped controls recorded'}

## Active Findings

${activeFindings.length ? activeFindings.map(buildFindingMarkdown).join('\n---\n\n') : 'No active findings logged.'}

## Limitations

- API Endpoint mode tests the configured endpoint behavior under the supplied prompt and probes. It does not test the provider infrastructure itself.
- Demo Harness evidence uses seeded fake data and simulated tool behavior only.
- Local Model Lab behavior does not by itself prove exploitability against a deployed production system.
- Results can vary by model, provider, runtime, quantization, prompt, temperature, context, and provider-side filtering.
- Browser-stored evidence records are not immutable audit trails unless exported into a controlled evidence system.
- Local browser inference is constrained by hardware, WebGPU support, cache storage, browser profile state, and tab lifecycle behavior.
- First-run model downloads and local judge-mode model swaps can temporarily pause the page while model artifacts download, compile, or reload.
- The heuristic evaluator is triage-oriented; \`REVIEW\` or \`PARTIAL\` should not be treated as a final pass/fail conclusion.
- Official mitigation references preserve source IDs and names from MITRE ATLAS. ORPHEUS recommended actions and retest guidance are project-defined implementation guidance.
- LLM-as-judge mode can introduce evaluator bias or prompt-injection risk; judge outputs should be treated as supporting evidence, not ground truth.
- Material disagreement between heuristic and judge results is intentionally preserved as a manual-review signal.
- ISO/IEC 42001 and EU AI Act references are relevance mappings only and depend on system role, risk classification, management-system scope, and jurisdictional scope.
`;
}

export function downloadMarkdown(filename, markdown) {
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const escapeHtml = (value = '') => String(value || '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

export function generateAuditBriefHtml(findings = [], metadata = {}) {
  const generatedAt = new Date().toISOString();
  const activeFindings = findings.filter(f => (f.reviewerDecision || f.reviewer_decision) !== 'FALSE_POSITIVE');
  const controls = [...new Set(activeFindings.flatMap(f => f.selectedControlIds || f.mappedControls || f.mapped_controls || []))]
    .map(id => CONTROL_SET[id]).filter(Boolean);
  const rows = activeFindings.map(finding => {
    const controlsText = (finding.selectedControlIds || finding.mappedControls || finding.mapped_controls || [])
      .map(id => CONTROL_SET[id] ? `${id} ${CONTROL_SET[id].name}` : id)
      .join('; ');
    const frameworks = frameworkList(finding).replaceAll('\n', '<br>');
    return `<section class="finding">
      <div class="finding-head">
        <div><span>FINDING</span><strong>${escapeHtml(finding.findingId || finding.id)}</strong></div>
        <div><span>VERDICT</span><strong>${escapeHtml(finding.verdict || 'REVIEW')}</strong></div>
        <div><span>EFFECTIVENESS</span><strong>${escapeHtml(finding.effectivenessAssessment || 'NOT ASSESSED')}</strong></div>
      </div>
      <h2>${escapeHtml(finding.payloadName || 'Untitled finding')}</h2>
      <div class="grid">
        <p><b>Analyst</b>${escapeHtml(finding.analyst || 'Not recorded')}</p>
        <p><b>System Under Test</b>${escapeHtml(finding.systemUnderTest || 'Not recorded')}</p>
        <p><b>Case ID</b>${escapeHtml(finding.caseFileId || finding.caseId || 'Not recorded')}</p>
        <p><b>Model</b>${escapeHtml(finding.victimModel || 'Not recorded')}</p>
        <p><b>Run Source</b>${escapeHtml(runModeLabel(finding))}</p>
        <p><b>Evidence Boundary</b>${escapeHtml(evidenceBoundary(finding))}</p>
        <p><b>System Prompt Hash</b>${escapeHtml(finding.promptHash || 'Not recorded')}</p>
        <p><b>Controls</b>${escapeHtml(controlsText || 'Not recorded')}</p>
      </div>
      <h3>Control Gap Statement</h3>
      <p class="${finding.controlGapStatement ? '' : 'warning'}">${escapeHtml(finding.controlGapStatement || 'Control gap statement not completed — finding is not audit-ready.')}</p>
      <h3>Evidence Summary</h3>
      <pre>${escapeHtml(truncate(finding.responseFull || finding.response || '', 1800))}</pre>
      <h3>Framework Implications</h3>
      <p>${frameworks}</p>
      <h3>Retest Criteria</h3>
      <p>${escapeHtml((finding.retestGuidance || finding.retest_guidance || []).join(' ') || 'Rerun the same case and compare against this evidence record.')}</p>
    </section>`;
  }).join('\n');

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>ORPHEUS Audit Brief</title>
<style>
body{margin:0;background:#0A0C16;color:#E6D6C8;font-family:"JetBrains Mono",ui-monospace,monospace;line-height:1.55}
.banner{background:#C87844;color:#0A0C16;padding:10px 24px;font-weight:900;letter-spacing:2px;text-align:center}
main{max-width:1100px;margin:0 auto;padding:28px 22px 60px}
h1{color:#C87844;letter-spacing:4px;margin:0 0 8px}
h2{color:#E6D6C8;margin:14px 0 8px}
h3{color:#C87844;font-size:13px;letter-spacing:1.5px;text-transform:uppercase;margin:18px 0 6px}
.meta,.finding{border:1px solid #1C2238;background:#0D111D;border-radius:4px;padding:16px;margin:14px 0}
.finding{border-left:3px solid #C87844}
.finding-head,.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:8px}
.finding-head div,.grid p{background:#0A0C16;border:1px solid #1C2238;padding:8px;margin:0}
span,b{display:block;color:#68738A;font-size:11px;text-transform:uppercase;letter-spacing:1px}
strong{color:#E6D6C8}
pre{white-space:pre-wrap;background:#0A0C16;border:1px solid #1C2238;padding:12px;max-height:360px;overflow:auto}
.warning{color:#DC4838;border:1px solid rgba(220,72,56,.45);background:rgba(220,72,56,.10);padding:10px}
.foot{color:#68738A;font-size:12px;margin-top:24px}
</style>
</head>
<body>
<div class="banner">UNCLASSIFIED // AI ASSURANCE WORKPAPER // ORPHEUS EVIDENCE</div>
<main>
  <h1>ORPHEUS AUDIT BRIEF</h1>
  <div class="meta">
    <p><b>Generated</b>${escapeHtml(generatedAt)}</p>
    <p><b>Assurance Profile</b>${escapeHtml(metadata.assuranceProfile || ASSURANCE_PROFILE.label)}</p>
    <p><b>Findings</b>${activeFindings.length}</p>
    <p><b>Impacted Controls</b>${controls.map(c => escapeHtml(`${c.id} ${c.name}`)).join('<br>') || 'None recorded'}</p>
  </div>
  ${rows || '<p>No active findings recorded.</p>'}
  <p class="foot">Framework mappings are traceability aids and do not constitute legal, audit, or certification conclusions. Evidence records are browser-local unless exported into a controlled evidence system; interpret each finding according to its run source.</p>
</main>
</body>
</html>`;
}

export function downloadHtml(filename, html) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
