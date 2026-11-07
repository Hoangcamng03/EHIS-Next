export function volunteerReadiness(value: { verificationStatus?: string; isAvailable?: boolean; activeIncidentId?: string | null; lastSeenAt?: { toMillis(): number }; location?: { latitude: number; longitude: number } }, now: number) {
  const at = value.lastSeenAt?.toMillis?.();
  const lastSeenAtMs = typeof at === 'number' && Number.isFinite(at) ? at : null;
  const validPoint = !!value.location && Number.isFinite(value.location.latitude) && Math.abs(value.location.latitude) <= 85 && Number.isFinite(value.location.longitude) && Math.abs(value.location.longitude) <= 180;
  const locationFresh = validPoint && lastSeenAtMs !== null && now - lastSeenAtMs <= 300000 && lastSeenAtMs <= now + 60000;
  return { lastSeenAtMs, locationFresh, readyForDispatch: value.verificationStatus === 'approved' && value.isAvailable === true && !value.activeIncidentId && locationFresh };
}
