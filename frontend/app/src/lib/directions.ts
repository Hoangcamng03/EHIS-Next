import type { MapPoint } from './map';

export type RoadRoute = { distance: number; duration: number; coordinates: [number, number][]; steps: { instruction: string; distance: number }[] };
export function validPoint(value: unknown): value is MapPoint {
  const point = value as MapPoint | undefined;
  return !!point && Number.isFinite(point.latitude) && Math.abs(point.latitude) <= 85 && Number.isFinite(point.longitude) && Math.abs(point.longitude) <= 180;
}
export function googleDirections(destination: MapPoint, origin?: MapPoint) {
  if (!validPoint(destination) || (origin && !validPoint(origin))) throw new Error('invalid-location');
  const params = new URLSearchParams({ api: '1', destination: `${destination.latitude},${destination.longitude}`, travelmode: 'driving' });
  if (origin) params.set('origin', `${origin.latitude},${origin.longitude}`);
  else params.set('dir_action', 'navigate');
  return `https://www.google.com/maps/dir/?${params}`;
}
export function routeUrl(origin: MapPoint, destination: MapPoint) {
  if (!validPoint(origin) || !validPoint(destination)) throw new Error('invalid-location');
  return `https://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson&steps=true&alternatives=false`;
}
const turns: Record<string, string> = { left: 'Rẽ trái', right: 'Rẽ phải', straight: 'Đi thẳng', 'slight left': 'Chếch trái', 'slight right': 'Chếch phải', 'sharp left': 'Rẽ ngoặt trái', 'sharp right': 'Rẽ ngoặt phải', uturn: 'Quay đầu' };
export function parseRoute(data: unknown): RoadRoute {
  const body = data as { code?: string; routes?: { distance: number; duration: number; geometry: { coordinates: [number, number][] }; legs: { steps: { distance: number; name: string; maneuver: { type: string; modifier?: string; exit?: number } }[] }[] }[] };
  const route = body?.routes?.[0];
  if (body?.code !== 'Ok' || !route || !Number.isFinite(route.distance) || route.distance < 0 || !Number.isFinite(route.duration) || route.duration < 0 ||
    !Array.isArray(route.geometry?.coordinates) || route.geometry.coordinates.length < 2 || route.geometry.coordinates.length > 20000 ||
    !route.geometry.coordinates.every(pair => Array.isArray(pair) && pair.length === 2 && validPoint({ latitude: pair[1], longitude: pair[0] })) || !Array.isArray(route.legs)) throw new Error('no-route');
  const steps = route.legs.flatMap(leg => {
    if (!Array.isArray(leg.steps)) throw new Error('no-route');
    return leg.steps.map(step => {
      if (!Number.isFinite(step.distance) || step.distance < 0 || !step.maneuver || typeof step.maneuver.type !== 'string' || typeof step.name !== 'string') throw new Error('no-route');
      const maneuver = step.maneuver;
      const action = maneuver.type === 'depart' ? 'Bắt đầu' : maneuver.type === 'arrive' ? 'Đến điểm đích trên đường' : ['roundabout', 'rotary'].includes(maneuver.type) ? `Vào vòng xoay${maneuver.exit ? `, ra lối ${maneuver.exit}` : ''}` : turns[maneuver.modifier || ''] || 'Tiếp tục';
      return { instruction: `${action}${step.name ? ` · ${step.name.slice(0, 150)}` : ''}`, distance: step.distance };
    });
  });
  return { distance: route.distance, duration: route.duration, coordinates: route.geometry.coordinates, steps };
}
export async function loadRoute(origin: MapPoint, destination: MapPoint, signal: AbortSignal): Promise<RoadRoute> {
  const response = await fetch(routeUrl(origin, destination), { signal, headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error('route-unavailable');
  return parseRoute(await response.json());
}
