import { ChevronRight, FlaskConical, ShieldCheck } from 'lucide-react';
import ControlProfileSelector from './ControlProfileSelector';
import ControlResultsPanel from './ControlResultsPanel';
import EvidenceContractPanel from './EvidenceContractPanel';

const VERDICT_TONE = {
  CONTROL_HELD: 'signal',
  PARTIAL_CONTROL_FAILURE: 'copper',
  CONTROL_FAILED: 'red',
  INCONCLUSIVE: 'text3',
};

export default function HarnessHome({
  C, cases, profiles, selectedCaseId, onSelectCase, selectedProfileId, onSelectProfile,
  customControls, onCustomChange, onRun, running, contract, comparisonHistory, onBackToLab,
}) {
  const selectedCase = cases.find(item => item.id === selectedCaseId) || cases[0];
  const activeProfile = profiles[selectedProfileId] || profiles.baseline;
  const profileColor = C[activeProfile.color] || C.copper;

  return (
    <main style={{ width: '100%', maxWidth: 1180, margin: '0 auto', padding: '36px 24px 72px', display: 'flex', flexDirection: 'column', gap: 28 }}>
      <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(280px, .9fr)', gap: 22 }} className="harness-grid">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.text3, fontSize: 11, letterSpacing: 1.8, textTransform: 'uppercase', marginBottom: 10 }}>
            <ShieldCheck size={14} /> Phase 1 Control Validation Harness
          </div>
          <h1 style={{ margin: 0, color: C.copper, fontSize: 34, lineHeight: 1.1, fontWeight: 900, letterSpacing: .4 }}>Run the same attack against different control postures.</h1>
          <p style={{ margin: '12px 0 0', color: C.text2, fontSize: 14, lineHeight: 1.65, maxWidth: 650 }}>
            The demo target is deterministic: one vulnerable response path, four control hooks, and a structured Evidence Contract after every run. Change the profile, rerun the case, and compare what held.
          </p>
        </div>
        <div style={{ background: `${profileColor}12`, border: `1px solid ${profileColor}55`, borderLeft: `3px solid ${profileColor}`, borderRadius: 5, padding: 16 }}>
          <div style={{ color: C.text3, fontSize: 10.5, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>Current Run</div>
          <div style={{ color: profileColor, fontSize: 16, fontWeight: 900 }}>{activeProfile.label}</div>
          <div style={{ color: C.text2, fontSize: 13, lineHeight: 1.5, marginTop: 6 }}>{selectedCase?.title}</div>
          {contract?.control_verdict && (
            <div style={{ marginTop: 12, color: C[VERDICT_TONE[contract.control_verdict]] || C.text3, fontSize: 12, fontWeight: 900, fontFamily: C.mono }}>
              LAST VERDICT: {contract.control_verdict}
            </div>
          )}
        </div>
      </section>

      <div style={{ background: C.signalBg, border: `1px solid ${C.signal}44`, borderLeft: `3px solid ${C.signal}`, borderRadius: 5, padding: '12px 14px', color: C.text2, fontSize: 13, lineHeight: 1.55 }}>
        <strong style={{ color: C.signal }}>Demo target simulator:</strong> this Phase 1 path runs seeded, fake evidence only. No external endpoint is called and no real tool action executes.
      </div>

      <section style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, .85fr) minmax(0, 1.15fr)', gap: 18 }} className="harness-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <PanelTitle C={C} icon={<FlaskConical size={14} />} label="Casebook" />
          <div style={{ display: 'grid', gap: 8 }}>
            {cases.map(item => {
              const active = item.id === selectedCaseId;
              return (
                <button key={item.id} onClick={() => onSelectCase(item.id)} style={{
                  textAlign: 'left', padding: '13px 14px', borderRadius: 5, cursor: 'pointer',
                  background: active ? C.copperBg : C.panel,
                  border: `1px solid ${active ? C.copper : C.border}`,
                  borderLeft: `3px solid ${active ? C.copper : 'transparent'}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 5 }}>
                    <span style={{ color: active ? C.copper : C.text1, fontSize: 12, fontWeight: 900, fontFamily: C.mono }}>{item.id}</span>
                    <span style={{ color: C.text3, fontSize: 11 }}>{item.family}</span>
                  </div>
                  <div style={{ color: C.text1, fontSize: 14, fontWeight: 800, marginBottom: 4 }}>{item.title}</div>
                  <div style={{ color: C.text2, fontSize: 12, lineHeight: 1.45 }}>{item.description}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <PanelTitle C={C} label="Control Profile" />
          <ControlProfileSelector
            C={C}
            profiles={profiles}
            selectedId={selectedProfileId}
            onSelect={onSelectProfile}
            customControls={customControls}
            onCustomChange={onCustomChange}
          />
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={onRun} disabled={running} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 18px', borderRadius: 4,
              border: `1px solid ${C.copper}`, background: running ? C.surface : C.copper,
              color: running ? C.text3 : C.ink, cursor: running ? 'wait' : 'pointer',
              fontSize: 13, fontWeight: 900, letterSpacing: 1.2, fontFamily: C.mono,
            }}>
              {running ? 'RUNNING HARNESS...' : 'RUN DEMO TARGET'} <ChevronRight size={14} />
            </button>
            <button onClick={onBackToLab} style={{
              display: 'inline-flex', alignItems: 'center', gap: 7, padding: '12px 15px', borderRadius: 4,
              border: `1px solid ${C.borderHi}`, background: 'transparent', color: C.text2, cursor: 'pointer',
              fontSize: 12, fontWeight: 800, letterSpacing: .8, fontFamily: C.mono,
            }}>
              OPEN MODEL LAB
            </button>
          </div>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, .95fr) minmax(0, 1.05fr)', gap: 18 }} className="harness-grid">
        <div>
          <PanelTitle C={C} label="Control Results" />
          <ControlResultsPanel C={C} contract={contract} profiles={profiles} comparisonHistory={comparisonHistory} />
        </div>
        <div>
          <EvidenceContractPanel C={C} contract={contract} />
        </div>
      </section>
    </main>
  );
}

function PanelTitle({ C, icon, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.text3, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 800, marginBottom: 10 }}>
      {icon}{label}
    </div>
  );
}
