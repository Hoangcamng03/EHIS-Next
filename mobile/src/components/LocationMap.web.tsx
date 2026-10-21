import { mapLinks, MapPoint } from '../lib/map';

export function LocationMap({ point, title }: { point: MapPoint; title: string }) {
  const links = mapLinks(point);
  return <section style={{ width: '100%', minWidth: 0 }}>
    <p style={{ margin: '8px 0', fontWeight: 700 }}>{title}</p>
    <iframe title={title} src={links.embed} referrerPolicy="no-referrer" style={{ width: '100%', height: 280, border: '1px solid #b8cbc1', borderRadius: 12 }} />
    <p style={{ fontSize: 12, lineHeight: 1.6 }}>{point.latitude}, {point.longitude} · <a href={links.full} target="_blank" rel="noreferrer">Mở bản đồ lớn</a><br />© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a> · Bản đồ cần Internet.</p>
  </section>;
}
