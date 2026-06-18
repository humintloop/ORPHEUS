export function runActivityLogging(mode, events) {
  if (mode === 'minimal' || mode === 'off') {
    return {
      activity_logged: mode !== 'off',
      prompt_preserved: false,
      response_preserved: false,
      tool_trace_preserved: false,
      authorization_decision_logged: false,
      review_required: false,
      log_entries: mode === 'off' ? [] : events.slice(0, 1),
    };
  }

  return {
    activity_logged: true,
    prompt_preserved: true,
    response_preserved: true,
    tool_trace_preserved: true,
    authorization_decision_logged: true,
    review_required: true,
    log_entries: events,
  };
}
