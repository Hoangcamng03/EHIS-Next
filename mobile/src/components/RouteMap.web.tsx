import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import type { MapPoint } from '../lib/map';
import type { RoadRoute } from '../lib/directions';

export function RouteMap({ origin, destination, route }: { origin: MapPoint | null; destination: MapPoint; route: RoadRoute | null }) {
  const container = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    import('leaflet').then(L => {
      if (cancelled || !container.current) return;
      const map = L.map(container.current, { scrollWheelZoom: false });
      const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>',
        referrerPolicy: 'strict-origin-when-cross-origin',
      }).addTo(map);
      tiles.on('tileerror', () => { if (!cancelled) setError('Một phần bản đồ chưa tải được. Kiểm tra Internet hoặc mở Google Maps.'); });
      const bounds: [number, number][] = [[destination.latitude, destination.longitude]];
      function pin(point: MapPoint, label: string, color: string, tooltip: string) {
        L.marker([point.latitude, point.longitude], { icon: L.divIcon({ className: '', html: `<div style="border:3px solid white;border-radius:50%;background:${color};color:white;text-align:center;font:bold 14px/28px Arial;box-shadow:0 1px 6px #333">${label}</div>`, iconSize: [34, 34], iconAnchor: [17, 17] }) }).addTo(map).bindTooltip(tooltip);
      }
      pin(destination, 'B', '#ca3b32', 'Bệnh nhân');
      if (origin) { pin(origin, 'A', '#1677c8', 'TNV'); bounds.push([origin.latitude, origin.longitude]); }
      if (route) { const points = route.coordinates.map(([lon, lat]): [number, number] => [lat, lon]); L.polyline(points, { color: '#1677c8', weight: 6, opacity: 0.85 }).addTo(map); bounds.push(...points); }
      map.fitBounds(L.latLngBounds(bounds), { padding: [35, 45], maxZoom: 17 });
      const resize = new ResizeObserver(() => map.invalidateSize()); resize.observe(container.current);
      cleanup = () => { resize.disconnect(); map.remove(); };
    }).catch(() => { if (!cancelled) setError('Chưa tải được bản đồ. Có thể mở Google Maps bên dưới.'); });
    return () => { cancelled = true; cleanup?.(); };
  }, [origin, destination, route]);
  return <div style={{ width: '100%', minWidth: 0 }}>
    <p style={{ fontSize: 12 }}>A: TNV · B: Bệnh nhân · Tuyến ô tô tham khảo</p>
    <div ref={container} role="region" aria-label="Bản đồ tuyến đường TNV đến bệnh nhân" style={{ width: '100%', height: 350, border: '1px solid #b8cbc1', borderRadius: 12 }} />
    {!!error && <p role="alert">{error}</p>}
  </div>;
}
