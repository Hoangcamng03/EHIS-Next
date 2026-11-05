type VolunteerState = { verificationStatus?: string; isAvailable?: boolean; activeIncidentId?: string | null; lastSeenAt?: { toMillis(): number } | null };
export function availabilityState(volunteer: VolunteerState | undefined, verified: boolean, paused: boolean, now: number) {
  let lastSeenMs: number | null = null;
  try { const value = volunteer?.lastSeenAt?.toMillis(); if (typeof value === 'number' && Number.isFinite(value)) lastSeenMs = value; } catch { /* Invalid snapshots never imply readiness. */ }
  const fresh = lastSeenMs !== null && now - lastSeenMs <= 300000 && lastSeenMs <= now + 60000;
  const kind = !verified ? 'unknown' : volunteer?.verificationStatus !== 'approved' ? 'unapproved' : volunteer.activeIncidentId ? 'assigned' : paused ? 'disconnected' : !volunteer.isAvailable ? 'off' : !fresh ? 'stale' : 'ready';
  return { kind, ready: kind === 'ready', lastSeenMs, ageSeconds: lastSeenMs === null ? null : Math.max(0, Math.floor((now - lastSeenMs) / 1000)) };
}
