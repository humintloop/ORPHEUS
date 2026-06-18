import { Check, Copy, Download, FileJson } from 'lucide-react';
import { useMemo, useState } from 'react';

const FIELD_GROUPS = [
  ['Run', ['run_id', 'case_id', 'target_id', 'control_profile', 'timestamp']],
  ['Detection', ['attack_detected', 'attack_blocked', 'detection_action']],
  ['Tool Authorization', ['tool_call_attempted', 'tool_call_executed', 'tool_blocked']],
  ['Data Protection', ['sensitive_data_exposed', 'redaction_applied', 'output_blocked']],
  ['Evidence', ['activity_logged', 'response_preserved', 'tool_trace_preserved', 'review_required']],
];

const VALUE_COLOR = { true: 'signal', false: 'text3' };

function formatLabel(key) {
  return key.replaceAll('_', ' ').replace(/\b\w/g, char => char.toUpperCase());
}

function downloadJson(contract) {
  const blob = new Blob([JSON.stringify(contract, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${contract.run_id || 'orpheus-evidence-contract'}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export default function EvidenceContractPanel({ C, contract }) {
  const [copied, setCopied] = useState(false);
  const json = useMemo(() => contract ? JSON.stringify(contract, null, 2) : '', [contract]);

  if (!contract) {
    return (
      <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 5, padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.text3, fontSize: 12, fontWeight: 800, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 8 }}>
          <FileJson size={14} /> Evidence Contract
        </div>
        <div style={{ color: C.text2, fontSize: 13, lineHeight: 1.55 }}>
          Run a demo case to generate structured control evidence. The contract will appear here as fields and exportable JSON.
        </div>
      </div>
    );
  }

  const copyJson = async () => {
    await navigator.clipboard?.writeText(json);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.copper, fontSize: 12, fontWeight: 900, letterSpacing: 1.5, textTransform: 'uppercase' }}>
            <FileJson size={14} /> Evidence Contract
          </div>
          <div style={{ color: C.text3, fontSize: 12, marginTop: 3, fontFamily: C.mono }}>{contract.run_id}</div>
        </div>
        <button onClick={copyJson} style={actionBtn(C)}>
          {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'COPIED' : 'COPY JSON'}
        </button>
        <button onClick={() => downloadJson(contract)} style={actionBtn(C)}>
          <Download size={13} /> DOWNLOAD
        </button>
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        {FIELD_GROUPS.map(([group, keys]) => (
          <div key={group} style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 5, padding: '12px 14px' }}>
            <div style={{ color: C.text3, fontSize: 10.5, fontWeight: 800, letterSpacing: 1.3, textTransform: 'uppercase', marginBottom: 9 }}>{group}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 7 }}>
              {keys.map(key => {
                const value = contract[key];
                const valueColor = typeof value === 'boolean' ? C[VALUE_COLOR[String(value)]] : C.text1;
                return (
                  <div key={key} style={{ minWidth: 0 }}>
                    <div style={{ color: C.text3, fontSize: 10, marginBottom: 2 }}>{formatLabel(key)}</div>
                    <div style={{ color: valueColor, fontSize: 12, fontWeight: 800, fontFamily: C.mono, overflowWrap: 'anywhere' }}>
                      {typeof value === 'boolean' ? String(value).toUpperCase() : value ?? 'NULL'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <pre style={{ margin: 0, maxHeight: 360, overflow: 'auto', padding: 14, background: C.ink, border: `1px solid ${C.borderHi}`, borderRadius: 5, color: C.text2, fontSize: 11.5, lineHeight: 1.55, fontFamily: C.mono, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{json}</pre>
    </div>
  );
}

function actionBtn(C) {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 12px',
    background: C.surface, color: C.text2, border: `1px solid ${C.borderHi}`,
    borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 800, letterSpacing: .8,
  };
}
