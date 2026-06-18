import { GitBranch, ShieldAlert, Wrench } from 'lucide-react';

const TONE = {
  executed: 'signal',
  blocked: 'copper',
  failed: 'red',
};

export default function AgenticTracePanel({ C, contract }) {
  if (!contract?.agentic_mode) {
    return (
      <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 5, padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.text3, fontSize: 12, fontWeight: 800, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 8 }}>
          <GitBranch size={14} /> Agentic Trace
        </div>
        <div style={{ color: C.text2, fontSize: 13, lineHeight: 1.55 }}>
          Switch to Agentic Mock Router and run a case to inspect planned tool calls, authorization decisions, and simulated tool outputs.
        </div>
      </div>
    );
  }

  const sequence = contract.tool_sequence || [];
  const trace = contract._trace || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.copper, fontSize: 12, fontWeight: 900, letterSpacing: 1.5, textTransform: 'uppercase' }}>
        <GitBranch size={14} /> Agentic Mock Tool Trace
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        {sequence.map((item, index) => {
          const tone = item.tool_blocked ? 'blocked' : item.tool_call_executed ? 'executed' : 'failed';
          const color = C[TONE[tone]] || C.text3;
          return (
            <div key={`${item.tool_name}-${index}`} style={{ background: C.panel, border: `1px solid ${color}55`, borderLeft: `3px solid ${color}`, borderRadius: 5, padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                <Wrench size={14} color={color} />
                <span style={{ color, fontSize: 13, fontWeight: 900, fontFamily: C.mono }}>{item.tool_name}</span>
                <span style={{ color: C.text3, fontSize: 11, fontFamily: C.mono }}>{item.tool_risk || 'unknown'} risk</span>
                <span style={{ marginLeft: 'auto', color, fontSize: 11, fontWeight: 900, letterSpacing: .8 }}>{item.tool_blocked ? 'BLOCKED' : 'EXECUTED'}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, marginBottom: item.tool_block_reason || item.output?.content ? 8 : 0 }}>
                <Metric C={C} label="Source" value={item.instruction_source} />
                <Metric C={C} label="Approval Required" value={item.authorization_required ? 'YES' : 'NO'} color={item.authorization_required ? C.copper : C.text2} />
                <Metric C={C} label="Approval Present" value={item.authorization_present ? 'YES' : 'NO'} color={item.authorization_present ? C.signal : C.text3} />
              </div>
              {item.tool_block_reason && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', color: C.text2, fontSize: 12, lineHeight: 1.45 }}>
                  <ShieldAlert size={13} color={color} style={{ flexShrink: 0, marginTop: 2 }} /> {item.tool_block_reason}
                </div>
              )}
              {item.output?.content && (
                <pre style={{ margin: 0, color: C.text2, background: C.ink, border: `1px solid ${C.border}`, borderRadius: 4, padding: 10, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontSize: 11.5, lineHeight: 1.45, fontFamily: C.mono }}>{item.output.content}</pre>
              )}
            </div>
          );
        })}
      </div>

      {trace.length > 0 && (
        <details style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 5, padding: '10px 12px' }}>
          <summary style={{ cursor: 'pointer', color: C.text3, fontSize: 11, fontWeight: 900, letterSpacing: 1.2, textTransform: 'uppercase' }}>Raw seed trace</summary>
          <pre style={{ margin: '10px 0 0', maxHeight: 220, overflow: 'auto', color: C.text2, fontSize: 11, lineHeight: 1.45, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{JSON.stringify(trace, null, 2)}</pre>
        </details>
      )}
    </div>
  );
}

function Metric({ C, label, value, color }) {
  return (
    <div>
      <div style={{ color: C.text3, fontSize: 10, marginBottom: 2 }}>{label}</div>
      <div style={{ color: color || C.text1, fontSize: 12, fontWeight: 800, fontFamily: C.mono }}>{value || 'NULL'}</div>
    </div>
  );
}
