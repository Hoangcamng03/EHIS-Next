'use client';
import { useEffect, useRef, useState } from 'react';
import type { Map as LeafletMap, CircleMarker } from 'leaflet';
type Point = { latitude: number; longitude: number };
export function PatientPointPicker({
  value,
  onChange,
  disabled = false,
}: {
  value: Point | null;
  onChange: (point: Point) => void;
  disabled?: boolean;
}) {
  const container = useRef<HTMLDivElement>(null),
    map = useRef<LeafletMap | null>(null);
  const marker = useRef<CircleMarker | null>(null),
    callback = useRef(onChange),
    blocked = useRef(disabled);
  const tilesReady = useRef(false);
  const [mapError, setMapError] = useState('');
  const [error, setError] = useState(''),
    [lat, setLat] = useState(''),
    [lon, setLon] = useState('');
  useEffect(() => {
    callback.current = onChange;
    blocked.current = disabled;
  }, [onChange, disabled]);
  useEffect(() => {
    let disposed = false;
    import('leaflet')
      .then((L) => {
        if (disposed || !container.current) return;
        const instance = L.map(container.current).setView([16.05, 108.2], 5);
        map.current = instance;
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        })
          .on('tileload', () => {
            if (!disposed) {
              tilesReady.current = true;
              setMapError('');
            }
          })
          .on('tileerror', () => {
            if (!disposed && !tilesReady.current)
              setMapError(
                'Chưa tải được nền bản đồ. Không chọn điểm trên bản đồ trống; có thể nhập tọa độ đã được người tại chỗ xác nhận.',
              );
          })
          .addTo(instance);
        instance.on('click', (event) => {
          if (!blocked.current && tilesReady.current)
            callback.current({ latitude: event.latlng.lat, longitude: event.latlng.lng });
        });
      })
      .catch(() => setError('Chưa tải được bản đồ. Có thể nhập tọa độ do người tại chỗ cung cấp.'));
    return () => {
      disposed = true;
      map.current?.remove();
      map.current = null;
      marker.current = null;
    };
  }, []);
  useEffect(() => {
    let cancelled = false;
    if (!value) {
      marker.current?.remove();
      marker.current = null;
      return;
    }
    if (value)
      import('leaflet').then((L) => {
        if (cancelled || !map.current) return;
        marker.current?.remove();
        marker.current = L.circleMarker([value.latitude, value.longitude], {
          radius: 10,
          color: '#b4232b',
          fillOpacity: 0.8,
        }).addTo(map.current);
        map.current.setView([value.latitude, value.longitude], Math.max(map.current.getZoom(), 15));
      });
    return () => {
      cancelled = true;
    };
  }, [value]);
  function enterPoint() {
    const latitude = Number(lat),
      longitude = Number(lon);
    if (
      !lat.trim() ||
      !lon.trim() ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      Math.abs(latitude) > 85 ||
      Math.abs(longitude) > 180
    ) {
      setError('Kiểm tra vĩ độ và kinh độ.');
      return;
    }
    setError('');
    onChange({ latitude, longitude });
  }
  return (
    <div className="point-picker">
      <p>Phóng to và chạm nơi bệnh nhân đang ở. Chưa có điểm mặc định.</p>
      <div
        ref={container}
        aria-label="Chọn vị trí bệnh nhân"
        style={{ height: 260, borderRadius: 12, border: '1px solid #5f7c70', zIndex: 0 }}
      />
      {mapError && (
        <p className="error" role="alert">
          {mapError}
        </p>
      )}
      <details>
        <summary>Nhập tọa độ được chia sẻ</summary>
        <label>
          Vĩ độ
          <input
            inputMode="decimal"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            disabled={disabled}
          />
        </label>
        <label>
          Kinh độ
          <input
            inputMode="decimal"
            value={lon}
            onChange={(e) => setLon(e.target.value)}
            disabled={disabled}
          />
        </label>
        <button type="button" className="secondary" disabled={disabled} onClick={enterPoint}>
          Đặt điểm trên bản đồ
        </button>
      </details>
      {value && (
        <p role="status">
          Điểm bệnh nhân: {value.latitude.toFixed(5)}, {value.longitude.toFixed(5)}. Kiểm tra lại
          trước khi gửi.
        </p>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
