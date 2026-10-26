export type SignalAlert = { incidentId: string; status: string; reportRevision: number; expiresAt?: number };
export type SignalEvent = { incidentId: string; kind: 'request' | 'update' };

export function activeOffer(alert: SignalAlert, now: number) {
  return alert.status === 'offered' && Number.isFinite(alert.expiresAt) && alert.expiresAt! > now;
}

// Fail closed when an invitation deadline is missing, invalid or already past.
export function invitationState(alert: SignalAlert, now: number) {
  return alert.status === 'offered' && !activeOffer(alert, now) ? 'expired' : alert.status;
}

// Called only on a confirmed server snapshot while the dashboard is active.
// Metadata/reconnect snapshots and repeated revisions must never restart the bell.
export function collectSignalEvents(seen: Map<string, number>, alerts: SignalAlert[], now: number): SignalEvent[] {
  const events: SignalEvent[] = [];
  for (const alert of alerts) {
    const offered = activeOffer(alert, now);
    if (!offered && !['accepted', 'arrived'].includes(alert.status)) continue;
    const before = seen.get(alert.incidentId);
    const revision = Math.max(0, alert.reportRevision || 0);
    seen.set(alert.incidentId, Math.max(before ?? 0, revision));
    if (offered && before === undefined) events.push({ incidentId: alert.incidentId, kind: 'request' });
    else if (before !== undefined && revision > before) events.push({ incidentId: alert.incidentId, kind: 'update' });
  }
  if (seen.size > 100) {
    const live = new Set(alerts.map(alert => alert.incidentId));
    for (const id of seen.keys()) if (!live.has(id)) seen.delete(id);
  }
  return events;
}
