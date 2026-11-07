import type { MapPoint } from './map';
export function shouldSyncAvailability(last: { point: MapPoint; at: number } | null, point: MapPoint, now: number, force = false) {
  if (force || !last || !Number.isFinite(last.at) || now < last.at || now - last.at >= 90000) return true;
  const rad = Math.PI / 180, a = Math.sin((point.latitude - last.point.latitude) * rad / 2) ** 2 + Math.cos(point.latitude * rad) * Math.cos(last.point.latitude * rad) * Math.sin((point.longitude - last.point.longitude) * rad / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a))) >= 100;
}
