import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { doc, onSnapshot } from 'firebase/firestore';
import { Text } from './AppText';
import { Button } from './ActionButton';
import { ToggleRow } from './ToggleRow';
import { InfoDisclosure } from './InfoDisclosure';
import { firebaseClient, isLocalEmulator } from '../lib/firebase';
import { googleDirections, loadRoute, validPoint, type RoadRoute } from '../lib/directions';
import { shouldRefreshRoute, usableFix, type RouteAttempt } from '../lib/live-location';
import { useLiveLocation } from '../lib/use-live-location';
import type { MapPoint } from '../lib/map';
import { RouteMap } from './RouteMap';
import { DirectionsLink } from './DirectionsLink';

export function LiveIncidentNavigation({ destination, connected, autoPreview = false }: { destination: MapPoint; connected: boolean; autoPreview?: boolean }) {
  const [storedOrigin, setStoredOrigin] = useState<MapPoint | null>(null);
  const [tracking, setTracking] = useState(!isLocalEmulator), [routeEnabled, setRouteEnabled] = useState(autoPreview);
  const [result, setResult] = useState<{ route: RoadRoute; target: string; at: number } | null>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [now, setNow] = useState(Date.now);
  const live = useLiveLocation(tracking && connected);
  const origin = live.fix?.point ?? storedOrigin;
  const fresh = !!live.fix && usableFix(live.fix, now);
  const target = `${destination.latitude},${destination.longitude}`;
  const visibleRoute = result?.target === target ? result.route : null;
  const controller = useRef<AbortController | null>(null), serial = useRef(0), lastAttempt = useRef<RouteAttempt | null>(null);
  useEffect(() => {
    const uid = firebaseClient().auth.currentUser?.uid;
    if (!uid) return;
    return onSnapshot(doc(firebaseClient().db, `volunteers/${uid}`), snapshot => { const point = snapshot.data()?.location; if (validPoint(point)) setStoredOrigin(point); });
  }, []);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  useEffect(() => () => { serial.current++; controller.current?.abort(); }, []);
  useEffect(() => { controller.current?.abort(); }, [target, connected, live.foreground]);
  const preview = useCallback(async () => {
    if (!origin || !connected || !live.foreground || (tracking && (!live.fix || !usableFix(live.fix, Date.now())))) return;
    const id = ++serial.current;
    controller.current?.abort(); const abort = new AbortController(); controller.current = abort;
    const at = Date.now(); lastAttempt.current = { origin, destination, at };
    const timer = setTimeout(() => abort.abort(), 15000); setBusy(true); setError('');
    try {
      const route = await loadRoute(origin, destination, abort.signal);
      if (id === serial.current && !abort.signal.aborted) setResult({ route, target, at });
    } catch { if (id === serial.current) setError('Chưa tính được tuyến mới. Tuyến cũ nếu còn hiển thị chỉ để tham khảo; kiểm tra Internet hoặc thử lại.'); }
    finally { clearTimeout(timer); if (id === serial.current) setBusy(false); }
  }, [origin, destination, target, connected, tracking, live.foreground, live.fix]);
  useEffect(() => {
    if (!(routeEnabled || autoPreview) || !origin || !connected || !live.foreground || (tracking && !fresh)) return;
    if (shouldRefreshRoute(lastAttempt.current, origin, destination, now)) void preview();
  }, [routeEnabled, autoPreview, origin, connected, tracking, fresh, live.foreground, destination, now, preview]);
  function setLive(value: boolean) { setTracking(value); setRouteEnabled(value || routeEnabled); setError(''); }
  if (!connected) return <View><Text>Đang chờ điểm đến và kết nối được xác nhận. Tạm dừng bản đồ/GPS để tránh dùng điểm cũ.</Text></View>;
  return <View style={{ gap: 10, padding: 12, backgroundColor: '#edf5fb', borderRadius: 12 }}>
    <Text style={{ fontSize: 18, fontWeight: '700' }}>Đường đến bệnh nhân</Text>
    <ToggleRow accessibilityLabel="Cập nhật GPS khi mở chỉ đường" label="GPS trực tiếp khi mở bản đồ" value={tracking} disabled={!connected} onValueChange={setLive} />
    <Text accessibilityLiveRegion="polite" style={{ fontSize: 14, lineHeight: 20 }}>{tracking ? !live.foreground ? 'GPS tạm dừng khi app ở nền.' : live.fix ? `GPS ${fresh ? 'đang cập nhật' : 'đã cũ'} · ±${Math.round(live.fix.accuracy)}m · ${Math.max(0, Math.floor((now - live.fix.timestamp) / 1000))}s trước` : 'Đang lấy GPS…' : 'Vị trí đã lưu · Chưa theo dõi GPS trực tiếp.'}</Text>
    {tracking && !fresh && <Text style={{ color: '#9f2424', fontSize: 14 }}>Chờ GPS mới, đủ chính xác. Kiểm tra quyền vị trí hoặc ra nơi thoáng.</Text>}
    <RouteMap origin={origin} destination={destination} route={visibleRoute} />
    {visibleRoute && <><Text accessibilityRole="header" style={{ fontSize: 18, fontWeight: '700', color: '#125b99' }}>{(visibleRoute.distance / 1000).toFixed(2)} km · ~{Math.max(1, Math.ceil(visibleRoute.duration / 60))} phút</Text><Text style={{ fontSize: 14 }}>Tuyến ô tô tham khảo · {Math.max(0, Math.floor((now - result!.at) / 1000))}s trước.</Text></>}
    {!!(error || (tracking && live.error)) && <Text accessibilityRole="alert" style={{ color: '#9f2424' }}>{error || live.error}</Text>}
    <Button variant="secondary" loading={busy} title={busy ? 'Đang tính tuyến…' : 'Tính lại tuyến'} disabled={busy || !origin || !connected || (tracking && (!fresh || !live.foreground))} onPress={() => { setRouteEnabled(true); void preview(); }} />
    <InfoDisclosure title="Chặng đường và tùy chọn">
      <Text>A · TNV: {origin ? `${origin.latitude.toFixed(6)}, ${origin.longitude.toFixed(6)}` : 'Chưa có vị trí'}</Text>
      <Text>B · Bệnh nhân: {destination.latitude.toFixed(6)}, {destination.longitude.toFixed(6)}</Text>
      {visibleRoute?.steps.map((step, index) => <Text key={index}>{index + 1}. {step.instruction} · {Math.round(step.distance)} m</Text>)}
      <DirectionsLink title="Xem trên Google Maps" disabled={!origin || !connected} url={googleDirections(destination, origin ?? undefined)} />
      <DirectionsLink title="Dẫn đường Google Maps" disabled={!connected} url={googleDirections(destination)} />
      <Text>GPS chỉ chạy khi app mở. Tọa độ tính tuyến gửi tới OSRM, bản đồ dùng OpenStreetMap; không gửi hồ sơ hay số điện thoại. Chưa có giao thông trực tiếp hoặc dẫn đường giọng nói. Người báo phải xác nhận khi đổi điểm bệnh nhân. {isLocalEmulator ? 'Điểm diễn tập có thể là tọa độ giả.' : ''}</Text>
    </InfoDisclosure>
  </View>;
}
