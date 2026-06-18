const VERDICT_COLOR_KEY = {
  CONTROL_HELD: 'signal',
  PARTIAL_CONTROL_FAILURE: 'copper',
  CONTROL_FAILED: 'red',
  INCONCLUSIVE: 'text3',
};

const VERDICT_LABEL = {
  CONTROL_HELD: 'CONTROL HELD',
  PARTIAL_CONTROL_FAILURE: 'PARTIAL CONTROL FAILURE',
  CONTROL_FAILED: 'CONTROL FAILED',
  INCONCLUSIVE: 'INCONCLUSIVE',
};

function detectionRow(contract) {
  if (contract.detection_action === 'not_configured') return { status: 'NOT CONFIGURED', tone: 'muted', detail: 'Adversarial input detection is off for this profile.' };
  if (contract.detection_action === 'blocked_or_constrained') return { status: 'BLOCKED', tone: 'held', detail: contract.detection_reason };
  if (contract.detection_action === 'detected_only') return { status: 'DETECTED', tone: 'partial', detail: contract.detection_reason };
  return { status: 'NOT DETECTED', tone: 'failed', detail: 'No injection signal matched in the retrieved content.' };
}

function piiRow(contract) {
  if (contract.output_blocked) return { status: 'BLOCKED', tone: 'held', detail: `Redacted: ${contract.data_class}` };
  if (contract.sensitive_data_exposed) return { status: 'EXPOSED', tone: 'failed', detail: `Exposed: ${contract.data_class}` };
  return { status: 'CLEAN', tone: 'held', detail: 'No seeded sensitive data found in the response.' };
}

function toolRow(contract) {
  if (!contract.tool_call_attempted) return { status: 'NOT CONFIGURED', tone: 'muted', detail: 'No tool call was attempted for this case.' };
  if (contract.tool_blocked) return { status: 'ENFORCED', tone: 'held', detail: contract.tool_block_reason };
  return { status: 'BYPASSED', tone: 'failed', detail: 'Tool call executed without authorization.' };
}

function loggingRow(contract) {
  const count = contract._log?.length || 0;
  if (!contract.activity_logged) return { status: 'OFF', tone: 'failed', detail: '0 events captured.' };
  if (!contract.review_required) return { status: 'MINIMAL', tone: 'partial', detail: `${count} event captured.` };
  return { status: 'FULL', tone: 'held', detail: `${count} events captured.` };
}

const TONE_COLOR_KEY = { held: 'signal', partial: 'copper', failed: 'red', muted: 'text3' };

function ToneTag({ C, tone, status }) {
  const color = C[TONE_COLOR_KEY[tone]] || C.text3;
  return (
    <span style={{ fontSize: 11, color, fontWeight: 800, letterSpacing: .5, border: `1px solid ${color}55`, background: `${color}18`, padding: '3px 8px', borderRadius: 2 }}>
      {status}
    </span>
  );
}

export default function ControlResultsPanel({ C, contract, profiles, comparisonHistory }) {
  if (!contract) return null;
  const rows = [
    ['Adversarial Input Detection', detectionRow(contract)],
    ['PII Leakage Prevention', piiRow(contract)],
    ['Tool-Use Authorization', toolRow(contract)],
    ['Activity Logging', loggingRow(contract)],
  ];
  const verdictColor = C[VERDICT_COLOR_KEY[contract.control_verdict]] || C.text3;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ padding: '14px 16px', borderRadius: 5, background: `${verdictColor}14`, border: `1px solid ${verdictColor}55`, borderLeft: `3px solid ${verdictColor}` }}>
        <div style={{ fontSize: 10, color: C.text3, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 6 }}>Control Verdict</div>
        <div style={{ fontSize: 22, color: verdictColor, fontWeight: 900, letterSpacing: .5 }}>
          {VERDICT_LABEL[contract.control_verdict] || contract.control_verdict}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {rows.map(([label, row]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: C.panel, border: `1px solid ${C.border}`, borderRadius: 4 }}>
            <div style={{ flex: '1 1 220px', fontSize: 13, color: C.text1, fontWeight: 600 }}>{label}</div>
            <ToneTag C={C} tone={row.tone} status={row.status} />
            <div style={{ flex: '2 1 260px', fontSize: 12, color: C.text2, lineHeight: 1.4 }}>{row.detail}</div>
          </div>
        ))}
      </div>

      {comparisonHistory && Object.keys(comparisonHistory).length > 0 && (
        <div>
          <div style={{ fontSize: 11, color: C.text3, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 8 }}>
            Profile comparison — last verdict for this case
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {Object.values(profiles).map(profile => {
              const verdict = comparisonHistory[profile.id];
              const color = verdict ? (C[VERDICT_COLOR_KEY[verdict]] || C.text3) : C.borderHi;
              return (
                <div key={profile.id} style={{
                  padding: '8px 12px', borderRadius: 4, background: C.surface,
                  border: `1px solid ${verdict ? color + '55' : C.border}`, borderLeft: `3px solid ${color}`,
                  minWidth: 150,
                }}>
                  <div style={{ fontSize: 11, color: C.text2, fontWeight: 700, marginBottom: 3 }}>{profile.label}</div>
                  <div style={{ fontSize: 11, color, fontWeight: 800, letterSpacing: .5 }}>
                    {verdict ? (VERDICT_LABEL[verdict] || verdict) : 'NOT RUN YET'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
