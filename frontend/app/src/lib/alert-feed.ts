export type AlertRecord = { incidentId: string; status: string; reportRevision: number; locationRevision?: number; distanceMeters: number; answers: { responsiveness: string; breathing: string; bleeding: string } | null; offerExpiresAt?: { toMillis(): number } };
const terminal = (status: string) => ['closed', 'completed', 'cancelled', 'expired'].includes(status);
export function mergeAlertFeed(recent: AlertRecord[], activeId: string | null, pinned: AlertRecord | null) {
  const values = new Map(recent.map(alert => [alert.incidentId, alert]));
  if (activeId && pinned?.incidentId === activeId) {
    const current = values.get(activeId);
    // Different listeners can arrive in either order. Never revive a closed case.
    if (!current || (!terminal(current.status) && (terminal(pinned.status) || pinned.reportRevision > current.reportRevision || (pinned.reportRevision === current.reportRevision && (pinned.status === 'arrived' || current.status !== 'arrived'))))) values.set(activeId, pinned);
  }
  return [...values.values()];
}
