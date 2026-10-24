// Reject weak/stale device fixes before assigning a patient destination.
export function confirmedPoint(position: { coords: { latitude: number; longitude: number; accuracy: number }; timestamp: number }, now: number) {
  const { latitude, longitude, accuracy } = position.coords;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 85 || Math.abs(longitude) > 180 || !Number.isFinite(accuracy) || accuracy < 0 || accuracy > 100 || !Number.isFinite(position.timestamp) || now - position.timestamp > 15000 || position.timestamp > now + 5000) throw Error('location');
  return { latitude, longitude };
}
