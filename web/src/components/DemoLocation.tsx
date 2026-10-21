'use client';

export function parseDemoLocation(latitude: string, longitude: string) {
  if (!latitude.trim() || !longitude.trim()) return null;
  const lat = Number(latitude), lon = Number(longitude);
  return Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 85 && Math.abs(lon) <= 180 ? { latitude: lat, longitude: lon } : null;
}
export function DemoLocation({ latitude, longitude, onLatitude, onLongitude, disabled }: {
  latitude: string; longitude: string; onLatitude(value: string): void; onLongitude(value: string): void; disabled: boolean;
}) {
  const point = parseDemoLocation(latitude, longitude);
  const bbox = point && [Math.max(-180, point.longitude - 0.008), Math.max(-85, point.latitude - 0.006), Math.min(180, point.longitude + 0.008), Math.min(85, point.latitude + 0.006)].join(',');
  return <fieldset disabled={disabled}>
    <legend>Vị trí bệnh nhân giả · chỉ thử nghiệm local</legend>
    <p className="hint">Mặc định ở trung tâm TP.HCM, gần vị trí TNV mẫu. Có thể nhập nơi khác. Cần có TNV sẵn sàng trong bán kính 5 km để nhận lời mời.</p>
    <label className="phone-label">Vĩ độ bệnh nhân giả<input type="number" step="any" min="-85" max="85" value={latitude} onChange={event => onLatitude(event.target.value)} /></label>
    <label className="phone-label">Kinh độ bệnh nhân giả<input type="number" step="any" min="-180" max="180" value={longitude} onChange={event => onLongitude(event.target.value)} /></label>
    {point ? <>
      <iframe title="Bản đồ vị trí bệnh nhân giả" src={`https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox!)}&layer=mapnik&marker=${point.latitude},${point.longitude}`} referrerPolicy="no-referrer" style={{ width: '100%', height: 280, border: '1px solid #b8cbc1', borderRadius: 12 }} />
      <p className="hint">Điểm cần hỗ trợ: {point.latitude}, {point.longitude}. © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a> · Bản đồ cần Internet.</p>
    </> : <p role="alert" className="error">Nhập tọa độ hợp lệ: vĩ độ -85 đến 85, kinh độ -180 đến 180.</p>}
  </fieldset>;
}
