import { memo, useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import '../lib/map-controls.css';
import type { MapPoint } from '../lib/map';
import type { RoadRoute } from '../lib/directions';

type Data = { origin: MapPoint | null; destination: MapPoint; route: RoadRoute | null };
export const PersistentRouteMap = memo(function PersistentRouteMap({
  origin,
  destination,
  route,
}: Data) {
  const container = useRef<HTMLDivElement>(null),
    latest = useRef<Data>({ origin, destination, route });
  const render = useRef<((data: Data) => void) | null>(null),
    [error, setError] = useState('');
  const retry = useRef<(() => void) | null>(null);
  const [initializationFailed, setInitializationFailed] = useState(false);
  useEffect(() => {
    latest.current = { origin, destination, route };
    render.current?.(latest.current);
  }, [origin, destination, route]);
  useEffect(() => {
    let cancelled = false,
      cleanup: (() => void) | undefined;
    import('leaflet')
      .then((L) => {
        if (cancelled || !container.current) return;
        const map = L.map(container.current, { scrollWheelZoom: false });
        const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>',
          referrerPolicy: 'strict-origin-when-cross-origin',
        }).addTo(map);
        const failed = new Set<HTMLImageElement>();
        tiles.on('tileerror', (event) => {
          failed.add(event.tile);
          if (!cancelled)
            setError('Một phần nền bản đồ chưa tải được. Tuyến và tọa độ không thay đổi.');
        });
        tiles.on('tileunload', (event) => {
          failed.delete(event.tile);
        });
        tiles.on('load', () => {
          if (!cancelled)
            setError(
              failed.size ? 'Một phần nền bản đồ chưa tải được. Thử tải lại khi có mạng.' : '',
            );
        });
        retry.current = () => {
          failed.clear();
          setError('Đang thử tải lại nền bản đồ…');
          tiles.redraw();
        };
        let a: import('leaflet').Marker | undefined,
          b: import('leaflet').Marker | undefined,
          line: import('leaflet').Polyline | undefined,
          target = '',
          hadRoute = false;
        function pin(point: MapPoint, label: string, color: string, tooltip: string) {
          return L.marker([point.latitude, point.longitude], {
            icon: L.divIcon({
              className: '',
              html: `<div style="width:28px;height:28px;margin:7px;border:3px solid white;border-radius:50%;background:${color};color:white;text-align:center;font:bold 14px/28px Arial;box-shadow:0 1px 6px #333">${label}</div>`,
              iconSize: [48, 48],
              iconAnchor: [24, 24],
            }),
          })
            .addTo(map)
            .bindTooltip(tooltip);
        }
        render.current = (data) => {
          const nextTarget = `${data.destination.latitude},${data.destination.longitude}`,
            bounds: [number, number][] = [[data.destination.latitude, data.destination.longitude]];
          if (b) b.setLatLng(bounds[0]);
          else b = pin(data.destination, 'B', '#ca3b32', 'Bệnh nhân');
          if (data.origin) {
            const point: [number, number] = [data.origin.latitude, data.origin.longitude];
            if (a) a.setLatLng(point);
            else a = pin(data.origin, 'A', '#1677c8', 'TNV');
            bounds.push(point);
          }
          if (data.route) {
            const points = data.route.coordinates.map(([lon, lat]): [number, number] => [lat, lon]);
            if (line) line.setLatLngs(points);
            else
              line = L.polyline(points, { color: '#1677c8', weight: 6, opacity: 0.85 }).addTo(map);
            bounds.push(...points);
          } else if (line) {
            map.removeLayer(line);
            line = undefined;
          }
          if (!target || target !== nextTarget || (!hadRoute && data.route))
            map.fitBounds(L.latLngBounds(bounds), { padding: [35, 45], maxZoom: 17 });
          target = nextTarget;
          hadRoute = !!data.route;
        };
        render.current(latest.current);
        const resize = new ResizeObserver(() => map.invalidateSize());
        resize.observe(container.current);
        cleanup = () => {
          render.current = null;
          retry.current = null;
          resize.disconnect();
          map.remove();
        };
      })
      .catch(() => {
        if (!cancelled) {
          setInitializationFailed(true);
          setError(
            'Chưa khởi tạo được bản đồ. Hãy tải lại ứng dụng; ca đang xử lý sẽ được khôi phục từ máy chủ.',
          );
        }
      });
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);
  return (
    <div style={{ width: '100%', minWidth: 0 }}>
      <p style={{ fontSize: 13 }}>A: TNV · B: Bệnh nhân · Tuyến ô tô tham khảo</p>
      <div
        ref={container}
        className="ehis-route-map"
        role="region"
        aria-label="Bản đồ tuyến đường TNV đến bệnh nhân"
        style={{ width: '100%', height: 350, border: '1px solid #b8cbc1', borderRadius: 12 }}
      />
      {!!error && (
        <div>
          <p role="status">{error}</p>
          <button
            type="button"
            style={{ minHeight: 48, padding: 12, width: '100%' }}
            onClick={() => (initializationFailed ? window.location.reload() : retry.current?.())}
          >
            {initializationFailed ? 'Tải lại ứng dụng để mở bản đồ' : 'Thử tải lại nền bản đồ'}
          </button>
        </div>
      )}
    </div>
  );
});
