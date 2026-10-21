import { useEffect, useState } from 'react';
import { Button, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { firebaseClient, readableError } from '../lib/firebase';

type Answers = { responsiveness: string; breathing: string; bleeding: string };
type Alert = { incidentId: string; status: string; reportRevision: number; distanceMeters: number; answers: Answers | null };
type Details = { phone: string | null; answers: Answers | null; revision: number; location: { latitude: number; longitude: number } | null };
const labels: Record<string, string> = { responsive: 'Có phản hồi', unresponsive: 'Không thấy phản hồi', unknown: 'Không rõ', normal: 'Có vẻ bình thường', abnormal: 'Có vẻ bất thường / không thấy thở', none_seen: 'Không thấy', visible: 'Có thấy' };
function Observation({ answers }: { answers: Answers | null }) {
  if (!answers) return <Text>Người báo chưa gửi câu trả lời bổ sung.</Text>;
  return <View style={styles.answers}><Text>Phản hồi: {labels[answers.responsiveness]}</Text><Text>Nhịp thở: {labels[answers.breathing]}</Text><Text>Chảy máu bên ngoài: {labels[answers.bleeding]}</Text></View>;
}
function IncidentAlert({ alert }: { alert: Alert }) {
  const [details, setDetails] = useState<Details>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (alert.status !== 'accepted') return;
    let cancelled = false;
    httpsCallable<{ incidentId: string }, Details>(firebaseClient().functions, 'getVolunteerIncidentDetails')({ incidentId: alert.incidentId })
      .then(result => { if (!cancelled) { setDetails(result.data); setError(''); } })
      .catch(err => { if (!cancelled) { setDetails(undefined); setError(readableError(err)); } });
    return () => { cancelled = true; };
  }, [alert.incidentId, alert.reportRevision, alert.status]);
  async function accept() {
    setBusy(true); setError('');
    try { await httpsCallable(firebaseClient().functions, 'acceptIncident')({ incidentId: alert.incidentId }); }
    catch (err) { setError(readableError(err)); }
    finally { setBusy(false); }
  }
  return <View style={styles.card}>
    <Text style={styles.cardTitle}>{alert.status === 'accepted' ? 'Bạn đang phụ trách ca' : alert.status === 'closed' ? 'Lời mời đã đóng' : 'Yêu cầu hỗ trợ mới'}</Text>
    <Text>Ca {alert.incidentId.slice(0, 10)} · Khoảng {alert.distanceMeters} m</Text>
    <Text style={styles.revision}>{alert.reportRevision > 0 ? `Thông tin bổ sung · bản ${alert.reportRevision}` : 'Thông báo ban đầu'}</Text>
    <Observation answers={alert.answers} />
    {alert.status === 'offered' && <Button title={busy ? 'Đang nhận…' : 'Tiếp nhận ca'} disabled={busy} onPress={accept} />}
    {alert.status === 'accepted' && <View style={styles.answers}>
      <Text>{details && details.revision === alert.reportRevision ? `SĐT người báo: ${details.phone || 'Không cung cấp'}` : 'Đang lấy thông tin được cấp quyền…'}</Text>
      {details?.revision === alert.reportRevision && details.location && <Text>Vị trí: {details.location.latitude}, {details.location.longitude}</Text>}
    </View>}
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
  </View>;
}
export default function VolunteerScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) unsubscribe = onAuthStateChanged(firebaseClient().auth, value => { setUser(value); setAlerts([]); setError(''); });
    }).catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : readableError(err)); });
    return () => { cancelled = true; unsubscribe?.(); };
  }, []);
  useEffect(() => {
    if (!user) return;
    return onSnapshot(query(collection(firebaseClient().db, `volunteers/${user.uid}/alerts`), orderBy('createdAt', 'desc'), limit(30)),
      snapshot => { setAlerts(snapshot.docs.map(item => item.data() as Alert)); setError(''); }, err => { setAlerts([]); setError(readableError(err)); });
  }, [user]);
  async function login() {
    setBusy(true); setError('');
    try { await signInWithEmailAndPassword(firebaseClient().auth, email.trim(), password); setPassword(''); }
    catch (err) { setError(readableError(err)); }
    finally { setBusy(false); }
  }
  return <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
    <Text style={styles.eyebrow}>EHIS NEXT · TÌNH NGUYỆN VIÊN</Text><Text style={styles.title}>Ca hỗ trợ</Text>
    <Text style={styles.intro}>Yêu cầu ban đầu và câu trả lời bổ sung xuất hiện trong cùng một ca khi màn hình đang mở.</Text>
    {!user ? <View style={styles.card}>
      <Text style={styles.cardTitle}>Đăng nhập TNV đã được duyệt</Text>
      <TextInput accessibilityLabel="Email" placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" style={styles.input} />
      <TextInput accessibilityLabel="Mật khẩu" placeholder="Mật khẩu" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" style={styles.input} />
      <Button title={busy ? 'Đang đăng nhập…' : 'Đăng nhập'} disabled={busy || !email || !password} onPress={login} />
    </View> : <><Text>Đã đăng nhập: {user.email || user.uid}</Text><Button title="Đăng xuất" onPress={() => { signOut(firebaseClient().auth).catch(err => setError(readableError(err))); }} />{!alerts.length && !error && <Text>Chưa có lời mời. Trạng thái sẵn sàng và vị trí hiện do dữ liệu demo backend cung cấp.</Text>}{alerts.map(alert => <IncidentAlert key={alert.incidentId} alert={alert} />)}</>}
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    <Text style={styles.note}>Bản thử nghiệm chưa có thông báo đẩy khi ứng dụng đóng. Chưa có quy trình hoàn thành ca hoặc cập nhật vị trí tự động.</Text>
  </ScrollView>;
}
const styles = StyleSheet.create({
  page: { padding: 24, gap: 18, backgroundColor: '#f4f8f6', flexGrow: 1 },
  eyebrow: { color: '#526f67', fontSize: 12, fontWeight: '700' }, title: { color: '#123c37', fontSize: 38, fontWeight: '700' },
  intro: { lineHeight: 24, color: '#526f67' }, card: { backgroundColor: '#fff', padding: 20, borderRadius: 16, gap: 14, borderWidth: 1, borderColor: '#dce8e0' },
  cardTitle: { fontSize: 19, fontWeight: '700', color: '#123c37' }, input: { borderWidth: 1, borderColor: '#b8cbc1', borderRadius: 10, padding: 14 },
  revision: { color: '#096951', fontWeight: '700' }, answers: { gap: 8 }, error: { color: '#9f2424' }, note: { color: '#526f67', fontSize: 12, lineHeight: 20 },
});
