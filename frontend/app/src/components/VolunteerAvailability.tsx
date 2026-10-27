import { Text } from './AppText';
import { Button } from './ActionButton';
import { ToggleRow } from './ToggleRow';
import { InfoDisclosure } from './InfoDisclosure';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, TextInput, View } from 'react-native';
import * as Location from 'expo-location';
import { doc, onSnapshot } from 'firebase/firestore';
import { firebaseClient, isLocalEmulator as isTrialMode, readableError, updateAvailability } from '../lib/firebase';
import { LocationMap } from './LocationMap';
import { MapPoint, parsePoint } from '../lib/map';
import { firstUsableLocation } from '../lib/location-request';
import type { LocationFix } from '../lib/live-location';

type Volunteer = { verificationStatus: string; isAvailable: boolean; activeIncidentId?: string | null; location?: MapPoint };
export async function currentLocation(askPermission: boolean, signal?: AbortSignal) {
  const permission = askPermission ? await Location.requestForegroundPermissionsAsync() : await Location.getForegroundPermissionsAsync();
  if (permission.status !== 'granted') throw new Error('location-permission');
  if (!await Location.hasServicesEnabledAsync()) throw new Error('location-disabled');
  const fix = (value: Location.LocationObject): LocationFix => ({ point: { latitude: value.coords.latitude, longitude: value.coords.longitude }, accuracy: value.coords.accuracy ?? Infinity, timestamp: value.timestamp });
  const result = await firstUsableLocation({
    last: async () => { const value = await Location.getLastKnownPositionAsync({ maxAge: 15000, requiredAccuracy: 100 }); return value ? fix(value) : null; },
    watch: (receive, fail) => Location.watchPositionAsync({ accuracy: Location.Accuracy.High, timeInterval: 1000, distanceInterval: 0 }, value => receive(fix(value)), fail),
  }, signal);
  return result.point;
}
export function VolunteerAvailability({ uid, paused = false, prepareAlerts }: { uid: string; paused?: boolean; prepareAlerts?: () => Promise<unknown> }) {
  const [volunteer, setVolunteer] = useState<Volunteer>();
  const [verifiedFromServer, setVerifiedFromServer] = useState(false);
  const [source, setSource] = useState<'gps' | 'demo' | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showLocation, setShowLocation] = useState(false);
  const [latitude, setLatitude] = useState('10.7769');
  const [longitude, setLongitude] = useState('106.7009');
  const demoPoint = useRef<MapPoint>({ latitude: 10.7769, longitude: 106.7009 });
  const epoch = useRef(0);
  const locationRequest = useRef<AbortController | null>(null);
  const [phase, setPhase] = useState('');
  useEffect(() => () => { epoch.current += 1; locationRequest.current?.abort(); }, []);
  useEffect(() => { if (paused) { epoch.current += 1; locationRequest.current?.abort(); } }, [paused]);
  useEffect(() => onSnapshot(doc(firebaseClient().db, `volunteers/${uid}`), { includeMetadataChanges: true }, snapshot => {
    setVerifiedFromServer(!snapshot.metadata.fromCache);
    setVolunteer(snapshot.exists() ? snapshot.data() as Volunteer : undefined);
  }, err => { setVerifiedFromServer(false); setError(readableError(err)); }), [uid]);
  const refresh = useCallback(async (method: 'gps' | 'demo', askPermission: boolean) => {
    const startedAt = epoch.current;
    locationRequest.current?.abort(); const abort = new AbortController(); locationRequest.current = abort;
    if (askPermission) setPhase('Đang lấy vị trí · tối đa 12 giây…');
    const location = method === 'demo' && isTrialMode ? demoPoint.current : await currentLocation(askPermission, abort.signal);
    if (startedAt !== epoch.current || firebaseClient().auth.currentUser?.uid !== uid) return;
    if (askPermission) setPhase('Đang tìm ca gần bạn…');
    await updateAvailability({ available: true, location });
  }, [uid]);
  useEffect(() => {
    if (paused || !source || !volunteer?.isAvailable || volunteer.activeIncidentId || volunteer.verificationStatus !== 'approved') return;
    let inFlight = false, cancelled = false;
    const interval = setInterval(async () => {
      if (AppState.currentState !== 'active' || inFlight) return;
      inFlight = true;
      try { await refresh(source, false); if (!cancelled) setError(''); }
      catch { if (!cancelled) setError('Chưa làm mới vị trí. Kiểm tra kết nối và bấm bật sẵn sàng lại.'); }
      finally { inFlight = false; }
    }, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [source, volunteer?.isAvailable, volunteer?.activeIncidentId, volunteer?.verificationStatus, refresh, paused]);
  async function enable(method: 'gps' | 'demo') {
    // Called inside the user's tap, before awaiting GPS, to satisfy autoplay policy.
    void prepareAlerts?.().catch(() => undefined);
    if (method === 'demo') {
      const point = parsePoint(latitude, longitude);
      if (!point) { setError('Nhập vĩ độ từ -85 đến 85 và kinh độ từ -180 đến 180 bằng số.'); return; }
      demoPoint.current = point;
    }
    epoch.current += 1;
    setBusy(true); setError('');
    try { await refresh(method, true); setSource(method); }
    catch (err) { setError(err instanceof Error && err.message.startsWith('location-') ? 'Chưa lấy được GPS. Cho phép vị trí, kiểm tra dịch vụ định vị và thử lại.' : readableError(err)); }
    finally { setBusy(false); setPhase(''); }
  }
  async function disable() {
    epoch.current += 1;
    locationRequest.current?.abort();
    setBusy(true); setSource(null); setError('');
    try { await updateAvailability({ available: false }); }
    catch (err) { setError(readableError(err)); }
    finally { setBusy(false); }
  }
  const approved = verifiedFromServer && volunteer?.verificationStatus === 'approved';
  return <View style={{ gap: 10, padding: 16, backgroundColor: volunteer?.isAvailable && verifiedFromServer && !paused ? '#d9f3e2' : '#edf1f3', borderRadius: 14, borderWidth: 2, borderColor: volunteer?.isAvailable && verifiedFromServer && !paused ? '#167447' : '#879a9c' }}>
    <Text accessibilityRole="header" style={{ fontWeight: '700', fontSize: 18 }}>{!verifiedFromServer ? 'Đang xác nhận với máy chủ…' : !approved ? 'Tài khoản chưa được duyệt' : volunteer?.activeIncidentId ? 'ĐANG PHỤ TRÁCH CA' : paused ? 'TẠM MẤT ĐỒNG BỘ' : volunteer?.isAvailable ? 'ĐANG SẴN SÀNG' : 'CHƯA SẴN SÀNG'}</Text>
    <ToggleRow accessibilityLabel="Sẵn sàng nhận yêu cầu hỗ trợ" label={busy ? phase || "Đang xác nhận…" : volunteer?.activeIncidentId ? "Hoàn tất ca để nhận ca mới" : "Sẵn sàng nhận ca gần bạn"} value={!!volunteer?.isAvailable && verifiedFromServer && !paused} disabled={paused || busy || !approved || !!volunteer?.activeIncidentId} onValueChange={value => { if (value) void enable('gps'); else void disable(); }} />
    <InfoDisclosure title="Vị trí và tìm ca"><Text>Gửi vị trí khi bật sẵn sàng, làm mới mỗi 30 giây khi app mở. Tìm ca trong 5km, kể cả ca báo trước còn hạn. Điểm cũ quá 5 phút không được chọn cho ca mới.</Text></InfoDisclosure>
    {volunteer?.isAvailable && <Button variant="secondary" loading={busy} title={busy ? 'Đang cập nhật…' : 'Làm mới vị trí'} onPress={() => enable('gps')} disabled={paused || busy || !approved || !!volunteer?.activeIncidentId} />}
    {isTrialMode && <InfoDisclosure title="Vị trí giả · chỉ local"><Text>Chỉnh tọa độ để diễn tập trên máy tính.</Text>
      <TextInput accessibilityLabel="Vĩ độ TNV giả" value={latitude} onChangeText={setLatitude} editable={!busy && !volunteer?.activeIncidentId} style={{ backgroundColor: 'white', borderRadius: 8, padding: 12 }} />
      <TextInput accessibilityLabel="Kinh độ TNV giả" value={longitude} onChangeText={setLongitude} editable={!busy && !volunteer?.activeIncidentId} style={{ backgroundColor: 'white', borderRadius: 8, padding: 12 }} />
      <Button title="Bật sẵn sàng bằng vị trí giả" onPress={() => enable('demo')} disabled={paused || busy || !approved || !!volunteer?.activeIncidentId} /></InfoDisclosure>}
    {verifiedFromServer && volunteer?.location && <><Button variant="secondary" title={showLocation ? 'Ẩn bản đồ vị trí của tôi' : 'Xem vị trí tôi đã gửi'} onPress={() => setShowLocation(value => !value)} color="#526f67" />{showLocation && <LocationMap point={volunteer.location} title="Vị trí TNV đã gửi lên máy chủ" />}</>}
    {!!error && <Text accessibilityRole="alert" style={{ color: '#9f2424' }}>{error}</Text>}
  </View>;
}
