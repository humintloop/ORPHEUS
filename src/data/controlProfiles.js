// Control profiles are functional objects, not UI labels.
// Each profile defines which controls are active and at what enforcement level.
// When a profile is selected, the harness uses these settings to configure execution.

export const CONTROL_PROFILES = {
  baseline: {
    id: 'baseline',
    label: 'Baseline Profile',
    description: 'Minimal or no controls. Demonstrates the exposed failure path.',
    color: 'red',
    controls: {
      adversarialDetection: 'off',
      piiFilter: 'off',
      toolAuthorization: 'off',
      activityLogging: 'minimal',
    },
    expectedVerdict: 'CONTROL_FAILED',
  },

  partial: {
    id: 'partial',
    label: 'Partial Control Profile',
    description: 'Some controls active. Demonstrates realistic incomplete coverage.',
    color: 'copper',
    controls: {
      adversarialDetection: 'detect_only',
      piiFilter: 'block_or_redact',
      toolAuthorization: 'off',
      activityLogging: 'full',
    },
    expectedVerdict: 'PARTIAL_CONTROL_FAILURE',
  },

  reference: {
    id: 'reference',
    label: 'Reference Control Profile',
    description: 'Key controls active. Attack detected, unsafe action blocked.',
    color: 'signal',
    controls: {
      adversarialDetection: 'block_or_constrain',
      piiFilter: 'block_or_redact',
      toolAuthorization: 'enforce',
      activityLogging: 'full',
    },
    expectedVerdict: 'CONTROL_HELD',
  },

  custom: {
    id: 'custom',
    label: 'Custom Profile',
    description: 'Configure controls manually.',
    color: 'void',
    controls: {
      adversarialDetection: 'off',
      piiFilter: 'off',
      toolAuthorization: 'off',
      activityLogging: 'minimal',
    },
    expectedVerdict: null,
    isEditable: true,
  },
};

export const CONTROL_OPTIONS = {
  adversarialDetection: ['off', 'detect_only', 'block_or_constrain'],
  piiFilter: ['off', 'block_or_redact'],
  toolAuthorization: ['off', 'enforce'],
  activityLogging: ['off', 'minimal', 'full'],
};
