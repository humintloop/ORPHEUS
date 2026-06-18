import { CONTROL_OPTIONS } from '../data/controlProfiles';

const CONTROL_LABELS = {
  adversarialDetection: 'Adversarial Detection',
  piiFilter: 'PII Filter',
  toolAuthorization: 'Tool Authorization',
  activityLogging: 'Activity Logging',
};

const VALUE_LABELS = {
  off: 'OFF',
  detect_only: 'DETECT',
  block_or_constrain: 'ENFORCE',
  block_or_redact: 'ENFORCE',
  enforce: 'ENFORCE',
  minimal: 'MINIMAL',
  full: 'FULL',
};

function cycle(options, current) {
  const idx = options.indexOf(current);
  return options[(idx + 1) % options.length];
}

export default function ControlProfileSelector({ C, profiles, selectedId, onSelect, customControls, onCustomChange }) {
  const profileList = Object.values(profiles);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
        {profileList.map(profile => {
          const active = selectedId === profile.id;
          const color = C[profile.color] || C.copper;
          const controls = profile.id === 'custom' ? customControls : profile.controls;
          return (
            <button key={profile.id} onClick={() => onSelect(profile.id)} style={{
              textAlign: 'left', padding: '14px 15px', borderRadius: 5, cursor: 'pointer',
              background: active ? `${color}14` : C.surface,
              border: `1px solid ${active ? color : C.border}`,
              borderLeft: `3px solid ${active ? color : 'transparent'}`,
              transition: 'border-color .15s, background .15s',
            }}>
              <div style={{ fontSize: 13, color: active ? color : C.text1, fontWeight: 800, letterSpacing: .3, marginBottom: 4 }}>
                {profile.label}
              </div>
              <div style={{ fontSize: 12, color: C.text2, lineHeight: 1.45, marginBottom: 10 }}>
                {profile.description}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {Object.entries(controls).map(([key, value]) => (
                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: C.mono, fontSize: 10.5 }}>
                    <span style={{ color: C.text3 }}>{CONTROL_LABELS[key]}</span>
                    <span style={{ color: value === 'off' ? C.text3 : color, fontWeight: 700 }}>
                      {VALUE_LABELS[value] || String(value).toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {selectedId === 'custom' && (
        <div style={{ background: C.panel, border: `1px solid ${C.void}44`, borderLeft: `3px solid ${C.void}`, borderRadius: 4, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, color: C.void, letterSpacing: 1.2, fontWeight: 800, marginBottom: 10, textTransform: 'uppercase' }}>
            Custom control configuration
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
            {Object.entries(CONTROL_OPTIONS).map(([key, options]) => (
              <button key={key} onClick={() => onCustomChange({ ...customControls, [key]: cycle(options, customControls[key]) })} style={{
                textAlign: 'left', padding: '9px 11px', borderRadius: 3, cursor: 'pointer',
                background: C.surface, border: `1px solid ${C.borderHi}`,
              }}>
                <div style={{ fontSize: 10, color: C.text3, letterSpacing: 1, marginBottom: 3 }}>{CONTROL_LABELS[key]}</div>
                <div style={{ fontSize: 12, color: C.void, fontWeight: 800, fontFamily: C.mono }}>
                  {VALUE_LABELS[customControls[key]] || String(customControls[key]).toUpperCase()}
                </div>
              </button>
            ))}
          </div>
          <div style={{ fontSize: 11, color: C.text3, marginTop: 8 }}>Click a setting to cycle through its values.</div>
        </div>
      )}
    </div>
  );
}
