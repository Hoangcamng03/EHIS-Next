// Rolling history is stored on the backend-only card, bounded to six entries.
// Retried/duplicate requests return before this check and consume no extra slot.
export function nextCardRequests(value: unknown, now: number) {
  const history = Array.isArray(value)
    ? value.filter(
        (time): time is number =>
          typeof time === 'number' && Number.isFinite(time) && time > now - 3600000 && time <= now,
      )
    : [];
  if (history.length >= 6) return null;
  return [...history, now];
}
