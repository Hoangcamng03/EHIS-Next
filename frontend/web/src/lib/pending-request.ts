export type PendingRequest = {
  requestId: string;
  location: { latitude: number; longitude: number };
  locationSource?: 'reporter_gps' | 'patient_pin';
  patientAddress?: string;
  destinationConfirmed?: boolean;
};

// Session storage is not trusted input. Discard damaged/partial drafts rather
// than trapping the reporter in a retry of an invalid request.
export function readPendingRequest(value: unknown): PendingRequest | null {
  if (!value || typeof value !== 'object') return null;
  const data = value as Partial<PendingRequest>;
  if (typeof data.requestId !== 'string' || !/^[A-Za-z0-9_-]{6,128}$/.test(data.requestId))
    return null;
  const point = data.location;
  if (
    !point ||
    typeof point.latitude !== 'number' ||
    typeof point.longitude !== 'number' ||
    !Number.isFinite(point.latitude) ||
    !Number.isFinite(point.longitude) ||
    Math.abs(point.latitude) > 85 ||
    Math.abs(point.longitude) > 180
  )
    return null;
  if (
    data.locationSource !== undefined &&
    !['reporter_gps', 'patient_pin'].includes(data.locationSource)
  )
    return null;
  if (
    data.locationSource === 'patient_pin' &&
    (data.destinationConfirmed !== true ||
      typeof data.patientAddress !== 'string' ||
      data.patientAddress.trim().length < 5 ||
      data.patientAddress.length > 240)
  )
    return null;
  return {
    requestId: data.requestId,
    location: { latitude: point.latitude, longitude: point.longitude },
    ...(data.locationSource ? { locationSource: data.locationSource } : {}),
    ...(data.locationSource === 'patient_pin'
      ? { patientAddress: data.patientAddress, destinationConfirmed: true }
      : {}),
  };
}

export function isDefinitiveRequestRejection(error: unknown) {
  const code = (error as { code?: string })?.code;
  return [
    'invalid-argument',
    'not-found',
    'already-exists',
    'permission-denied',
    'unauthenticated',
    'failed-precondition',
    'resource-exhausted',
  ].some((value) => code === `functions/${value}`);
}
