import { useEffect, useRef, useState } from 'react';
import { Button, Text, View } from 'react-native';
import { doc, onSnapshot } from 'firebase/firestore';
import { firebaseClient, isLocalEmulator } from '../lib/firebase';
import { currentLocation } from './VolunteerAvailability';
import { googleDirections, loadRoute, validPoint, type RoadRoute } from '../lib/directions';
import type { MapPoint } from '../lib/map';
import { RouteMap } from './RouteMap';
import { DirectionsLink } from './DirectionsLink';

export function IncidentNavigation({ destination, connected }: { destination: MapPoint; connected: boolean }) {
  const [origin, setOrigin] = useState<MapPoint | null>(null);
  const [route, setRoute] = useState<RoadRoute | null>(null);
  const [routeKey, setRouteKey] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [gpsBusy, setGpsBusy] = useState(false);
  const [originLabel, setOriginLabel] = useState('Vị trí TNV đã lưu khi bật sẵn sàng; có thể đã cũ.');
  const operation = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const currentKey = `${origin?.latitude},${origin?.longitude}:${destination.latitude},${destination.longitude}`;
  const visibleRoute = routeKey === currentKey ? route : null;
  useEffect(() => {
    const uid = firebaseClient().auth.currentUser?.uid;
    if (!uid) return;
    return onSnapshot(doc(firebaseClient().db, `volunteers/${uid}`), snapshot => {
      const point = snapshot.data()?.location;
      if (validPoint(point)) setOrigin(previous => previous ?? point);
    });
  }, []);
  useEffect(() => () => { operation.current += 1; controller.current?.abort(); }, []);
  useEffect(() => { controller.current?.abort(); }, [currentKey, connected]);
  async function preview() {
    if (!origin || !connected) return;
    const id = ++operation.current;
    controller.current?.abort();
    const abort = new AbortController(); controller.current = abort;
    const timer = setTimeout(() => abort.abort(), 15000);
    setBusy(true); setError(''); setRoute(null);
    try {
      const result = await loadRoute(origin, destination, abort.signal);
      if (id === operation.current) { setRoute(result); setRouteKey(currentKey); }
    } catch { if (id === operation.current) setError('Chưa lấy được tuyến đường. Kiểm tra Internet và thử lại, hoặc mở Google Maps.'); }
    finally { clearTimeout(timer); if (id === operation.current) setBusy(false); }
  }
  async function refreshGps() {
    setGpsBusy(true); setError('');
    try { const point = await currentLocation(true); setOrigin(point); setOriginLabel('Vị trí GPS vừa lấy trên thiết bị này; bấm xem đường đi để tính lại.'); }
    catch { setError('Chưa lấy được GPS. Kiểm tra quyền vị trí. Bạn vẫn có thể mở Google Maps để chọn điểm xuất phát.'); }
    finally { setGpsBusy(false); }
  }
  return <View style={{ gap: 12, padding: 14, backgroundColor: '#edf5fb', borderRadius: 12 }}>
    <Text style={{ fontSize: 19, fontWeight: '700', color: '#123c37' }}>Đường đi đến bệnh nhân</Text>
    <Text>A · TNV: {origin ? `${origin.latitude}, ${origin.longitude}` : 'Chưa có vị trí'}</Text>
    <Text>B · Bệnh nhân: {destination.latitude}, {destination.longitude}</Text>
    <Text>{originLabel}{isLocalEmulator ? ' Đang thử nghiệm: tọa độ đã lưu có thể là vị trí giả.' : ''}</Text>
    <Text>Bấm xem đường đi sẽ gửi hai tọa độ đến OSRM để tính tuyến ô tô; bản đồ dùng OpenStreetMap. Không gửi hồ sơ hoặc số điện thoại.</Text>
    <Button title={busy ? 'Đang tính tuyến đường…' : 'Xem đường đi trong EHIS'} disabled={busy || gpsBusy || !origin || !connected} onPress={preview} />
    <Button title={gpsBusy ? 'Đang lấy GPS…' : 'Lấy GPS hiện tại để tính lại'} disabled={gpsBusy || busy || !connected} onPress={refreshGps} />
    <RouteMap origin={origin} destination={destination} route={visibleRoute} />
    {visibleRoute && <>
      <Text accessibilityRole="header" style={{ fontSize: 20, fontWeight: '700', color: '#125b99' }}>Theo đường ô tô: {(visibleRoute.distance / 1000).toFixed(2)} km · khoảng {Math.max(1, Math.ceil(visibleRoute.duration / 60))} phút</Text>
      <Text>Ước tính OSRM, không tính giao thông trực tiếp. Điểm nối vào đường có thể cách vị trí bệnh nhân; cần xác nhận điểm đến.</Text>
      {visibleRoute.steps.map((step, index) => <Text key={index}>{index + 1}. {step.instruction} · {Math.round(step.distance)} m</Text>)}
    </>}
    {!!error && <Text accessibilityRole="alert" style={{ color: '#9f2424' }}>{error}</Text>}
    <DirectionsLink title="Xem tuyến này trên Google Maps" disabled={!origin || !connected} url={googleDirections(destination, origin ?? undefined)} />
    <DirectionsLink title="Dẫn đường bằng Google Maps" disabled={!connected} url={googleDirections(destination)} />
    <Text>Google Maps nhận tọa độ khi bạn mở. “Dẫn đường” dùng vị trí thiết bị do Google Maps xác định; không dùng điểm TNV giả. Chọn phương tiện phù hợp trong Google Maps. EHIS chưa theo dõi hoặc tự tính lại tuyến khi đang di chuyển.</Text>
  </View>;
}
