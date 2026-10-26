import { useCallback, useEffect, useRef, useState } from 'react';
import { Switch, View } from 'react-native';
import { doc, onSnapshot } from 'firebase/firestore';
import { Text } from './AppText';
import { Button } from './ActionButton';
import { firebaseClient, isLocalEmulator } from '../lib/firebase';
import { googleDirections, loadRoute, validPoint, type RoadRoute } from '../lib/directions';
import { shouldRefreshRoute, usableFix, type RouteAttempt } from '../lib/live-location';
import { useLiveLocation } from '../lib/use-live-location';
import type { MapPoint } from '../lib/map';
import { RouteMap } from './RouteMap';
import { DirectionsLink } from './DirectionsLink';

export function LiveIncidentNavigation({ destination, connected, autoPreview = false }: { destination: MapPoint; connected: boolean; autoPreview?: boolean }) {
  const [storedOrigin, setStoredOrigin] = useState<MapPoint | null>(null);
  const [tracking, setTracking] = useState(false), [routeEnabled, setRouteEnabled] = useState(autoPreview);
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
  return <View style={{ gap: 12, padding: 14, backgroundColor: '#edf5fb', borderRadius: 12 }}>
    <Text style={{ fontSize: 19, fontWeight: '700' }}>Đường đi đến bệnh nhân</Text>
    <Text>A · TNV: {origin ? `${origin.latitude}, ${origin.longitude}` : 'Chưa có vị trí'}</Text>
    <Text>B · Điểm bệnh nhân đã xác nhận: {destination.latitude}, {destination.longitude}</Text>
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}><Switch accessibilityLabel="Cập nhật GPS khi mở chỉ đường" value={tracking} disabled={!connected} onValueChange={setLive} /><Text style={{ flex: 1 }}>Cập nhật GPS và tuyến đường khi đang mở màn này</Text></View>
    <Text accessibilityLiveRegion="polite">{tracking ? !live.foreground ? 'GPS tạm dừng khi ứng dụng ở nền.' : live.fix ? `GPS ${fresh ? 'đang cập nhật' : 'đã cũ'} · sai số ước tính ±${Math.round(live.fix.accuracy)} m · ${Math.max(0, Math.floor((now - live.fix.timestamp) / 1000))} giây trước` : 'Đang chờ GPS chính xác. Cho phép vị trí trên thiết bị.' : 'Đang dùng vị trí đã lưu, không phải GPS trực tiếp. Bật cập nhật để theo vị trí hiện tại.'}</Text>
    {tracking && !fresh && <Text style={{ color: '#9f2424' }}>Chưa có điểm GPS đủ mới để tính tuyến trực tiếp. Kiểm tra quyền vị trí và ra nơi thoáng.</Text>}
    <Text>GPS chỉ chạy khi app mở. Tọa độ dùng để tính tuyến sẽ gửi tới OSRM; bản đồ dùng OpenStreetMap. Không gửi hồ sơ hoặc số điện thoại. {isLocalEmulator ? 'Điểm đã lưu trong diễn tập có thể là tọa độ giả.' : ''}</Text>
    <Button title={busy ? 'Đang tính tuyến…' : 'Tính lại đường đi'} disabled={busy || !origin || !connected || (tracking && (!fresh || !live.foreground))} onPress={() => { setRouteEnabled(true); void preview(); }} />
    <RouteMap origin={origin} destination={destination} route={visibleRoute} />
    {visibleRoute && <><Text accessibilityRole="header" style={{ fontSize: 20, fontWeight: '700', color: '#125b99' }}>Theo đường ô tô: {(visibleRoute.distance / 1000).toFixed(2)} km · khoảng {Math.max(1, Math.ceil(visibleRoute.duration / 60))} phút</Text><Text>Tuyến tính {Math.max(0, Math.floor((now - result!.at) / 1000))} giây trước. Không có giao thông trực tiếp; khi bật GPS, tính lại có giới hạn tần suất để tránh quá tải.</Text>{visibleRoute.steps.map((step, index) => <Text key={index}>{index + 1}. {step.instruction} · {Math.round(step.distance)} m</Text>)}</>}
    {!!(error || (tracking && live.error)) && <Text accessibilityRole="alert" style={{ color: '#9f2424' }}>{error || live.error}</Text>}
    <DirectionsLink title="Xem tuyến này trên Google Maps" disabled={!origin || !connected} url={googleDirections(destination, origin ?? undefined)} />
    <DirectionsLink title="Dẫn đường bằng Google Maps" disabled={!connected} url={googleDirections(destination)} />
    <Text>EHIS chưa có dẫn đường bằng giọng nói. Tuyến ô tô và thời gian chỉ tham khảo; người báo có thể xác nhận cập nhật điểm bệnh nhân, không tự theo điện thoại người báo.</Text>
  </View>;
}
