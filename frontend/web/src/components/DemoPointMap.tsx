'use client';
import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
export function DemoPointMap({ latitude, longitude }: { latitude: number; longitude: number }) {
  const root = useRef<HTMLDivElement>(null), move = useRef<((lat: number, lon: number) => void) | null>(null), retry = useRef<(() => void) | null>(null);
  const latest = useRef({ latitude, longitude }), [message, setMessage] = useState('Đang tải nền bản đồ…');
  useEffect(() => { latest.current = { latitude, longitude }; const timer = setTimeout(() => move.current?.(latitude, longitude), 400); return () => clearTimeout(timer); }, [latitude, longitude]);
  useEffect(() => {
    let cancelled = false, cleanup: (() => void) | undefined;
    import('leaflet').then(L => {
      if (cancelled || !root.current) return;
      const p = latest.current, map = L.map(root.current, { scrollWheelZoom: false }).setView([p.latitude, p.longitude], 15);
      const pin = L.circleMarker([p.latitude, p.longitude], { radius: 9, color: '#a7202d', fillColor: '#a7202d', fillOpacity: .85 }).addTo(map).bindTooltip('Điểm bệnh nhân giả');
      const failed = new Set<HTMLImageElement>(), layer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, referrerPolicy: 'strict-origin-when-cross-origin', attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(map);
      layer.on('tileerror', e => { failed.add(e.tile); if (!cancelled) setMessage('Nền bản đồ chưa tải đủ. Tọa độ bên dưới vẫn là điểm đã chọn.'); });
      layer.on('tileunload', e => { failed.delete(e.tile); });
      layer.on('load', () => { if (!cancelled) setMessage(failed.size ? 'Nền bản đồ chưa tải đủ. Bạn vẫn có thể gửi tọa độ đã xác nhận.' : 'Điểm đỏ là vị trí bệnh nhân giả.'); });
      move.current = (lat, lon) => { pin.setLatLng([lat, lon]); map.setView([lat, lon], map.getZoom()); };
      retry.current = () => { failed.clear(); setMessage('Đang thử tải lại nền bản đồ…'); layer.redraw(); };
      const resize = new ResizeObserver(() => map.invalidateSize()); resize.observe(root.current);
      cleanup = () => { move.current = null; retry.current = null; resize.disconnect(); map.remove(); };
    }).catch(() => { if (!cancelled) setMessage('Chưa tải được bản đồ. Kiểm tra Internet; tọa độ đã chọn không thay đổi.'); });
    return () => { cancelled = true; cleanup?.(); };
  }, []);
  return <div><div ref={root} role="region" aria-label="Bản đồ vị trí bệnh nhân giả" style={{ height: 260, width: '100%', background: '#e7ece8', borderRadius: 12 }} /><p role="status" className="hint">{message}</p><button type="button" className="secondary" onClick={() => retry.current?.()}>Thử tải lại bản đồ</button></div>;
}
