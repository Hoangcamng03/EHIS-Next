export type Point = { latitude: number; longitude: number };
export type LocationFix = { point: Point; accuracy: number; timestamp: number };
export function metersBetween(a: Point, b: Point) {
  const r = Math.PI / 180, dLat = (b.latitude - a.latitude) * r, dLon = (b.longitude - a.longitude) * r;
  const v = Math.sin(dLat / 2) ** 2 + Math.cos(a.latitude * r) * Math.cos(b.latitude * r) * Math.sin(dLon / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(v), Math.sqrt(Math.max(0, 1 - v)));
}
export function usableFix(fix: LocationFix, now: number) {
  return Number.isFinite(fix.point.latitude) && Math.abs(fix.point.latitude) <= 85 && Number.isFinite(fix.point.longitude) && Math.abs(fix.point.longitude) <= 180 &&
    Number.isFinite(fix.accuracy) && fix.accuracy >= 0 && fix.accuracy <= 100 && Number.isFinite(fix.timestamp) && now - fix.timestamp <= 15000 && fix.timestamp <= now + 5000;
}
export type RouteAttempt = { origin: Point; destination: Point; at: number };
export function shouldRefreshRoute(last: RouteAttempt | null, origin: Point, destination: Point, now: number) {
  if (!last || last.destination.latitude !== destination.latitude || last.destination.longitude !== destination.longitude) return true;
  const elapsed = now - last.at;
  return elapsed >= 15000 && (metersBetween(last.origin, origin) >= 20 || elapsed >= 60000);
}
