import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Button, Text, TextInput, View } from 'react-native';
import * as Location from 'expo-location';
import { doc, onSnapshot } from 'firebase/firestore';
import { firebaseClient, isLocalEmulator, readableError, updateAvailability } from '../lib/firebase';
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
export function VolunteerAvailability({ uid, paused = false }: { uid: string; paused?: boolean }) {
  const [volunteer, setVolunteer] = useState<Volunteer>();
  const [verifiedFromServer, setVerifiedFromServer] = useState(false);
  const [source, setSource] = useState<'gps' | 'demo' | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
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
    const location = method === 'demo' && isLocalEmulator ? demoPoint.current : await currentLocation(askPermission);
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
  return <View style={{ gap: 14, padding: 20, backgroundColor: '#e3f0e8', borderRadius: 14 }}>
    <Text style={{ fontWeight: '700' }}>{!verifiedFromServer ? 'Đang kiểm tra quyền TNV với máy chủ…' : !approved ? 'Tài khoản chưa được duyệt' : volunteer?.activeIncidentId ? 'Đang phụ trách một ca' : volunteer?.isAvailable ? 'Đã bật sẵn sàng' : 'Chưa bật sẵn sàng'}</Text>
    <Text>Bật sẵn sàng để gửi vị trí. Khi màn hình này đang mở, vị trí được làm mới mỗi phút; vị trí cũ quá 5 phút sẽ không được chọn cho ca mới.</Text>
    <Button title={busy ? 'Đang cập nhật…' : 'Bật sẵn sàng bằng GPS'} onPress={() => enable('gps')} disabled={paused || busy || !approved || !!volunteer?.activeIncidentId} />
    {isLocalEmulator && <><Text>THỬ NGHIỆM LOCAL: nhập vị trí giả của TNV. Mặc định ở trung tâm TP.HCM. Bấm bật sẵn sàng để áp dụng tọa độ; không dùng cho ca thật.</Text>
      <TextInput accessibilityLabel="Vĩ độ TNV giả" value={latitude} onChangeText={setLatitude} editable={!busy && !volunteer?.activeIncidentId} style={{ backgroundColor: 'white', borderRadius: 8, padding: 12 }} />
      <TextInput accessibilityLabel="Kinh độ TNV giả" value={longitude} onChangeText={setLongitude} editable={!busy && !volunteer?.activeIncidentId} style={{ backgroundColor: 'white', borderRadius: 8, padding: 12 }} />
      <Button title="Bật sẵn sàng bằng vị trí giả" onPress={() => enable('demo')} disabled={paused || busy || !approved || !!volunteer?.activeIncidentId} /></>}
    {verifiedFromServer && volunteer?.location && <LocationMap point={volunteer.location} title="Vị trí TNV đã gửi lên máy chủ" />}
    <Button title="Tắt sẵn sàng" onPress={disable} disabled={paused || busy || !approved || !volunteer?.isAvailable} />
    {!!error && <Text accessibilityRole="alert" style={{ color: '#9f2424' }}>{error}</Text>}
  </View>;
}
