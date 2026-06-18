import { FileText, FlaskConical } from 'lucide-react';

export default function Header({
  C,
  brandBase,
  brandVersion,
  modelReady,
  modelConfigOpen,
  loadedModel,
  loadedModelId,
  guideStep,
  setModelConfigOpen,
  victimModelId,
  setVictimModelId,
  modelStatus,
  running,
  victimModels,
  loadModel,
  judging,
  loadProgress,
  selectedVictimModel,
  advancedMode,
  setAdvancedMode,
  activeTab,
  setActiveTab,
  findingsCount,
}) {
  return (
    <header className="app-header">
      <div className="brand-lockup">
        <img src={`${brandBase}brand/orpheus-icon.svg?v=${brandVersion}`} alt="ORPHEUS icon" className="brand-icon" />
        <div className="brand-word" aria-label="ORPHEUS Adversarial Assurance Lab">
          <div className="brand-title">ORPHEUS</div>
          <div className="brand-subtitle">ADVERSARIAL ASSURANCE LAB</div>
        </div>
        <span className="brand-context">Local-first adversarial assurance lab</span>
      </div>

      <div className="header-divider" style={{ width: 1, height: 24, background: C.border }} />

      <div className="model-bar">
        {modelReady && !modelConfigOpen ? (
          <>
            <span style={{ fontSize: 13, color: C.text2, letterSpacing: 1 }}>TARGET</span>
            <span style={{
              fontSize: 13,
              color: C.text1,
              background: C.surface,
              border: `1px solid ${guideStep === 'target' ? C.copper : C.border}`,
              padding: '4px 8px',
              borderRadius: 2,
            }}>
              {loadedModel?.name || loadedModelId} · READY
            </span>
            <button
              onClick={() => setModelConfigOpen(true)}
              style={{
                padding: '5px 10px', fontSize: 12, fontWeight: 700, letterSpacing: 1,
                background: guideStep === 'target' ? C.copperBg : 'transparent',
                border: `1px solid ${guideStep === 'target' ? C.copper : C.border}`,
                color: guideStep === 'target' ? C.copper : C.text3,
                cursor: 'pointer', borderRadius: 2,
                boxShadow: guideStep === 'target' ? '0 0 0 1px rgba(200,120,68,.18)' : 'none',
              }}
            >
              CHANGE
            </button>
          </>
        ) : (
          <>
            <span style={{ fontSize: 13, color: C.text2, letterSpacing: 1 }}>TARGET MODEL</span>
            <select
              value={victimModelId}
              onChange={e => setVictimModelId(e.target.value)}
              disabled={modelStatus === 'loading' || running}
              style={{
                background: C.surface, border: `1px solid ${guideStep === 'target' ? C.copper : C.border}`,
                color: C.text1, fontSize: 15, padding: '4px 8px',
                borderRadius: 2, cursor: 'pointer',
              }}
            >
              {victimModels.map(m => (
                <option key={m.id} value={m.id}>{m.quickStart ? 'Quick Start - ' : ''}{m.name} ({m.size})</option>
              ))}
            </select>

            <button
              onClick={() => loadModel(victimModelId)}
              disabled={modelStatus === 'loading' || modelStatus === 'ready' && loadedModelId === victimModelId}
              style={{
                padding: '5px 12px', fontSize: 14, fontWeight: 700, letterSpacing: 1,
                background: modelStatus === 'ready' && loadedModelId === victimModelId ? C.copperBg : C.surface,
                border: `1px solid ${guideStep === 'target' ? C.copper : modelStatus === 'ready' && loadedModelId === victimModelId ? C.copper : C.borderHi}`,
                color: modelStatus === 'ready' && loadedModelId === victimModelId ? C.copper : C.text2,
                cursor: 'pointer', borderRadius: 2,
                opacity: modelStatus === 'loading' ? 0.5 : 1,
                boxShadow: guideStep === 'target' ? '0 0 0 1px rgba(200,120,68,.18)' : 'none',
              }}
            >
              {modelStatus === 'loading' ? 'LOADING...' : modelStatus === 'ready' && loadedModelId === victimModelId ? '● LOADED' : 'LOAD →'}
            </button>
          </>
        )}

        {(modelStatus === 'loading' || judging) && (
          <span style={{ fontSize: 13, color: C.copper, letterSpacing: 0.5, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {loadProgress}
          </span>
        )}
        {modelStatus !== 'loading' && !modelReady && (
          <span style={{ fontSize: 12, color: selectedVictimModel?.quickStart ? C.signal : C.copper, letterSpacing: .2, maxWidth: 330, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selectedVictimModel?.quickStart ? 'New? Start here: smallest first download.' : `First load downloads ${selectedVictimModel?.size || 'the model'} into this browser.`}
          </span>
        )}
        <button
          onClick={() => setAdvancedMode(p => !p)}
          style={{
            marginLeft: 'auto',
            padding: '5px 10px',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 1,
            background: advancedMode ? C.copperBg : 'transparent',
            border: `1px solid ${advancedMode ? C.copper + '60' : C.border}`,
            color: advancedMode ? C.copper : C.text3,
            cursor: 'pointer',
            borderRadius: 2,
          }}
        >
          {advancedMode ? 'ADVANCED ON' : 'ADVANCED'}
        </button>
      </div>

      <div className="tab-nav">
        {[['lab', 'LAB', <FlaskConical size={11} />], ['findings', `FINDINGS (${findingsCount})`, <FileText size={11} />]].map(([tab, label, icon]) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 12px', fontSize: 14, fontWeight: 700, letterSpacing: 1,
            background: activeTab === tab ? C.copperBg : 'transparent',
            border: `1px solid ${activeTab === tab ? C.copper : C.border}`,
            color: activeTab === tab ? C.copper : C.text2, cursor: 'pointer',
            borderRadius: 2,
          }}>
            {icon}{label}
          </button>
        ))}
      </div>
    </header>
  );
}
