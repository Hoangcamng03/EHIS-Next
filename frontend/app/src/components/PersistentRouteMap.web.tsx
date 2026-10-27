import { memo, useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import type { MapPoint } from '../lib/map';
import type { RoadRoute } from '../lib/directions';

type Data = { origin: MapPoint | null; destination: MapPoint; route: RoadRoute | null };
export const PersistentRouteMap = memo(function PersistentRouteMap({ origin, destination, route }: Data) {
  const container = useRef<HTMLDivElement>(null), latest = useRef<Data>({ origin, destination, route });
  const render = useRef<((data: Data) => void) | null>(null), [error, setError] = useState('');
  useEffect(() => { latest.current = { origin, destination, route }; render.current?.(latest.current); }, [origin, destination, route]);
  useEffect(() => {
    let cancelled = false, cleanup: (() => void) | undefined;
    import('leaflet').then(L => {
      if (cancelled || !container.current) return;
      const map = L.map(container.current, { scrollWheelZoom: false });
      const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>', referrerPolicy: 'strict-origin-when-cross-origin' }).addTo(map);
      tiles.on('tileerror', () => { if (!cancelled) setError('Một phần bản đồ chưa tải được. Kiểm tra Internet hoặc mở Google Maps.'); });
      let a: import('leaflet').Marker | undefined, b: import('leaflet').Marker | undefined, line: import('leaflet').Polyline | undefined, target = '', hadRoute = false;
      function pin(point: MapPoint, label: string, color: string, tooltip: string) {
        return L.marker([point.latitude, point.longitude], { icon: L.divIcon({ className: '', html: `<div style="border:3px solid white;border-radius:50%;background:${color};color:white;text-align:center;font:bold 14px/28px Arial;box-shadow:0 1px 6px #333">${label}</div>`, iconSize: [34, 34], iconAnchor: [17, 17] }) }).addTo(map).bindTooltip(tooltip);
      }
      render.current = data => {
        const nextTarget = `${data.destination.latitude},${data.destination.longitude}`, bounds: [number, number][] = [[data.destination.latitude, data.destination.longitude]];
        if (b) b.setLatLng(bounds[0]); else b = pin(data.destination, 'B', '#ca3b32', 'Bệnh nhân');
        if (data.origin) { const point: [number, number] = [data.origin.latitude, data.origin.longitude]; if (a) a.setLatLng(point); else a = pin(data.origin, 'A', '#1677c8', 'TNV'); bounds.push(point); }
        if (data.route) { const points = data.route.coordinates.map(([lon, lat]): [number, number] => [lat, lon]); if (line) line.setLatLngs(points); else line = L.polyline(points, { color: '#1677c8', weight: 6, opacity: 0.85 }).addTo(map); bounds.push(...points); }
        else if (line) { map.removeLayer(line); line = undefined; }
        if (!target || target !== nextTarget || (!hadRoute && data.route)) map.fitBounds(L.latLngBounds(bounds), { padding: [35, 45], maxZoom: 17 });
        target = nextTarget; hadRoute = !!data.route;
      };
      render.current(latest.current);
      const resize = new ResizeObserver(() => map.invalidateSize()); resize.observe(container.current);
      cleanup = () => { render.current = null; resize.disconnect(); map.remove(); };
    }).catch(() => { if (!cancelled) setError('Chưa tải được bản đồ. Có thể mở Google Maps bên dưới.'); });
    return () => { cancelled = true; cleanup?.(); };
  }, []);
  return <div style={{ width: '100%', minWidth: 0 }}><p style={{ fontSize: 12 }}>A: TNV · B: Bệnh nhân · Tuyến ô tô tham khảo</p><div ref={container} role="region" aria-label="Bản đồ tuyến đường TNV đến bệnh nhân" style={{ width: '100%', height: 350, border: '1px solid #b8cbc1', borderRadius: 12 }} />{!!error && <p role="alert">{error}</p>}</div>;
});
