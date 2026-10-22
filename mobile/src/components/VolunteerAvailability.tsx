import { Text } from './AppText';
import { Button } from './ActionButton';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Switch, TextInput, View } from 'react-native';
import * as Location from 'expo-location';
import { doc, onSnapshot } from 'firebase/firestore';
import { firebaseClient, isLocalEmulator as isTrialMode, readableError, updateAvailability } from '../lib/firebase';
import { LocationMap } from './LocationMap';
import { MapPoint, parsePoint } from '../lib/map';

type Volunteer = { verificationStatus: string; isAvailable: boolean; activeIncidentId?: string | null; location?: MapPoint };
export async function currentLocation(askPermission: boolean) {
  const permission = askPermission ? await Location.requestForegroundPermissionsAsync() : await Location.getForegroundPermissionsAsync();
  if (permission.status !== 'granted') throw new Error('location-permission');
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('location-timeout')), 20000); }),
    ]);
    return { latitude: result.coords.latitude, longitude: result.coords.longitude };
  } finally { clearTimeout(timer); }
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
  useEffect(() => () => { epoch.current += 1; }, []);
  useEffect(() => { if (paused) epoch.current += 1; }, [paused]);
  useEffect(() => onSnapshot(doc(firebaseClient().db, `volunteers/${uid}`), { includeMetadataChanges: true }, snapshot => {
    setVerifiedFromServer(!snapshot.metadata.fromCache);
    setVolunteer(snapshot.exists() ? snapshot.data() as Volunteer : undefined);
  }, err => { setVerifiedFromServer(false); setError(readableError(err)); }), [uid]);
  const refresh = useCallback(async (method: 'gps' | 'demo', askPermission: boolean) => {
    const startedAt = epoch.current;
    const location = method === 'demo' && isTrialMode ? demoPoint.current : await currentLocation(askPermission);
    if (startedAt !== epoch.current || firebaseClient().auth.currentUser?.uid !== uid) return;
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
    }, 60000);
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
    finally { setBusy(false); }
  }
  async function disable() {
    epoch.current += 1;
    setBusy(true); setSource(null); setError('');
    try { await updateAvailability({ available: false }); }
    catch (err) { setError(readableError(err)); }
    finally { setBusy(false); }
  }
  const approved = verifiedFromServer && volunteer?.verificationStatus === 'approved';
  return <View style={{ gap: 14, padding: 20, backgroundColor: volunteer?.isAvailable && verifiedFromServer && !paused ? '#d9f3e2' : '#edf1f3', borderRadius: 14, borderWidth: 2, borderColor: volunteer?.isAvailable && verifiedFromServer && !paused ? '#167447' : '#879a9c' }}>
    <Text accessibilityRole="header" style={{ fontWeight: '800', fontSize: 23 }}>{!verifiedFromServer ? 'Đang xác nhận với máy chủ…' : !approved ? 'Tài khoản chưa được duyệt' : volunteer?.activeIncidentId ? 'ĐANG PHỤ TRÁCH CA' : paused ? 'TẠM MẤT ĐỒNG BỘ' : volunteer?.isAvailable ? 'ĐANG SẴN SÀNG' : 'CHƯA SẴN SÀNG'}</Text>
    <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}><Switch accessibilityLabel="Sẵn sàng nhận yêu cầu hỗ trợ" value={!!volunteer?.isAvailable && verifiedFromServer && !paused} disabled={paused || busy || !approved || !!volunteer?.activeIncidentId} onValueChange={value => { if (value) void enable('gps'); else void disable(); }} /><Text style={{ flex: 1, fontSize: 18, lineHeight: 26 }}>{busy ? 'Đang chờ máy chủ xác nhận…' : volunteer?.activeIncidentId ? 'Hoàn tất ca hiện tại trước khi nhận ca mới.' : 'Bật để nhận yêu cầu gần bạn. Tắt khi không thể tham gia.'}</Text></View>
    <Text>Bật sẵn sàng để gửi vị trí và chuẩn bị chuông. Khi màn hình này đang mở, vị trí được làm mới mỗi phút; vị trí cũ quá 5 phút sẽ không được chọn cho ca mới.</Text>
    {volunteer?.isAvailable && <Button title={busy ? 'Đang cập nhật…' : 'Làm mới vị trí GPS'} onPress={() => enable('gps')} disabled={paused || busy || !approved || !!volunteer?.activeIncidentId} />}
    {isTrialMode && <><Text>BUỔI CHẠY THỬ: nhập vị trí giả của TNV. Mặc định ở trung tâm TP.HCM. Bấm bật sẵn sàng để áp dụng tọa độ; không dùng cho ca thật.</Text>
      <TextInput accessibilityLabel="Vĩ độ TNV giả" value={latitude} onChangeText={setLatitude} editable={!busy && !volunteer?.activeIncidentId} style={{ backgroundColor: 'white', borderRadius: 8, padding: 12 }} />
      <TextInput accessibilityLabel="Kinh độ TNV giả" value={longitude} onChangeText={setLongitude} editable={!busy && !volunteer?.activeIncidentId} style={{ backgroundColor: 'white', borderRadius: 8, padding: 12 }} />
      <Button title="Bật sẵn sàng bằng vị trí giả" onPress={() => enable('demo')} disabled={paused || busy || !approved || !!volunteer?.activeIncidentId} /></>}
    {verifiedFromServer && volunteer?.location && <><Button title={showLocation ? 'Ẩn bản đồ vị trí của tôi' : 'Xem vị trí tôi đã gửi'} onPress={() => setShowLocation(value => !value)} color="#526f67" />{showLocation && <LocationMap point={volunteer.location} title="Vị trí TNV đã gửi lên máy chủ" />}</>}
    {!!error && <Text accessibilityRole="alert" style={{ color: '#9f2424' }}>{error}</Text>}
  </View>;
}
