export type MapPoint = { latitude: number; longitude: number };
export function parsePoint(latitude: string, longitude: string): MapPoint | null {
  if (!latitude.trim() || !longitude.trim()) return null;
  const lat = Number(latitude), lon = Number(longitude);
  return Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 85 && Math.abs(lon) <= 180 ? { latitude: lat, longitude: lon } : null;
}
export function mapLinks(point: MapPoint) {
  const { latitude: lat, longitude: lon } = point;
  const bbox = [Math.max(-180, lon - 0.008), Math.max(-85, lat - 0.006), Math.min(180, lon + 0.008), Math.min(85, lat + 0.006)].join(',');
  return {
    embed: `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat},${lon}`,
    full: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=17/${lat}/${lon}`,
  };
}
