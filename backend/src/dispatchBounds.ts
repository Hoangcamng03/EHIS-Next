// Bounding rectangles for a 5km spherical circle, then exact Haversine filtering.
// Split longitude at the antimeridian; no new client-provided dispatch fields.
export function dispatchBounds(point: { latitude: number; longitude: number }) {
  if (!Number.isFinite(point.latitude) || Math.abs(point.latitude) > 85 || !Number.isFinite(point.longitude) || Math.abs(point.longitude) > 180) throw new Error('Invalid location');
  const angular = 5001 / 6371000, latitudeDelta = angular * 180 / Math.PI;
  const longitudeDelta = Math.asin(Math.sin(angular) / Math.cos(point.latitude * Math.PI / 180)) * 180 / Math.PI;
  const south = Math.max(-85, point.latitude - latitudeDelta), north = Math.min(85, point.latitude + latitudeDelta);
  const west = point.longitude - longitudeDelta, east = point.longitude + longitudeDelta;
  const ranges = west < -180 ? [[-180, east], [west + 360, 180]] : east > 180 ? [[west, 180], [-180, east - 360]] : [[west, east]];
  return ranges.map(([minimum, maximum]) => ({ south, north, west: minimum, east: maximum }));
}
