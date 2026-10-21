import { useEffect, useState } from 'react';
import { Button, ScrollView, StyleSheet, Text, View } from 'react-native';
import { User } from 'firebase/auth';
import { collection, doc, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { firebaseClient, readableError, updateAvailability } from '../lib/firebase';
import { VolunteerAvailability } from '../components/VolunteerAvailability';
import { IncidentNavigation } from '../components/IncidentNavigation';
import { AuthGate, AccountBar } from '../components/Session';
import { VolunteerApplication } from '../components/VolunteerApplication';
import { Link, usePathname } from 'expo-router';
import { statusLabel } from '../lib/ui';

type Answers = { responsiveness: string; breathing: string; bleeding: string };
type Alert = { incidentId: string; status: string; reportRevision: number; distanceMeters: number; answers: Answers | null; offerExpiresAt?: { toMillis(): number } };
type Details = { phone: string | null; answers: Answers | null; revision: number; location: { latitude: number; longitude: number } | null; patientProfile?: { fullName: string; allergies: string[]; emergencyContactPhone: string | null } | null };
const labels: Record<string, string> = { responsive: 'Có phản hồi', unresponsive: 'Không thấy phản hồi', unknown: 'Không rõ', normal: 'Có vẻ bình thường', abnormal: 'Có vẻ bất thường / không thấy thở', none_seen: 'Không thấy', visible: 'Có thấy' };
function Observation({ answers }: { answers: Answers | null }) {
  if (!answers) return <Text>Người báo chưa gửi câu trả lời bổ sung.</Text>;
  return <View style={styles.answers}><Text>Phản hồi: {labels[answers.responsiveness]}</Text><Text>Nhịp thở: {labels[answers.breathing]}</Text><Text>Chảy máu bên ngoài: {labels[answers.bleeding]}</Text></View>;
}
function IncidentAlert({ alert, connected, now }: { alert: Alert; connected: boolean; now: number }) {
  const [details, setDetails] = useState<Details>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!['accepted', 'arrived'].includes(alert.status)) return;
    let cancelled = false;
    httpsCallable<{ incidentId: string }, Details>(firebaseClient().functions, 'getVolunteerIncidentDetails', { timeout: 15000 })({ incidentId: alert.incidentId })
      .then(result => { if (!cancelled) { setDetails(result.data); setError(''); } })
      .catch(err => { if (!cancelled) { setDetails(undefined); setError(readableError(err)); } });
    return () => { cancelled = true; };
  }, [alert.incidentId, alert.reportRevision, alert.status]);
  async function accept() {
    setBusy(true); setError('');
    try { await httpsCallable(firebaseClient().functions, 'acceptIncident', { timeout: 15000 })({ incidentId: alert.incidentId }); }
    catch (err) { setError(readableError(err)); }
    finally { setBusy(false); }
  }
  async function finish() {
    setBusy(true); setError('');
    try { await httpsCallable(firebaseClient().functions, 'finishIncident', { timeout: 15000 })({ incidentId: alert.incidentId, outcome: 'completed' }); }
    catch (err) { setError(readableError(err)); }
    finally { setBusy(false); }
  }
  async function arrive() {
    setBusy(true); setError('');
    try { await httpsCallable(firebaseClient().functions, 'markIncidentArrived', { timeout: 15000 })({ incidentId: alert.incidentId }); }
    catch (err) { setError(readableError(err)); } finally { setBusy(false); }
  }
  const assigned = ['accepted', 'arrived'].includes(alert.status);
  const offerExpired = alert.status === 'offered' && !!alert.offerExpiresAt && alert.offerExpiresAt.toMillis() <= now;
  const terminal = offerExpired || ['closed', 'completed', 'cancelled', 'expired'].includes(alert.status);
  return <View style={styles.card}>
    <Text style={styles.cardTitle}>{assigned ? 'Bạn đang phụ trách ca' : terminal ? 'Ca / lời mời đã kết thúc' : 'Yêu cầu hỗ trợ mới'}</Text>
    <Text>Ca {alert.incidentId.slice(0, 10)} · Đường thẳng lúc gửi lời mời: {alert.distanceMeters} m</Text>
    <Text>{statusLabel[alert.status] || alert.status}</Text>
    <Text style={styles.revision}>{alert.reportRevision > 0 ? `Thông tin bổ sung · bản ${alert.reportRevision}` : 'Thông báo ban đầu'}</Text>
    {!terminal && <Observation answers={alert.answers} />}
    {alert.status === 'offered' && !offerExpired && <Button title={busy ? 'Đang nhận…' : 'Tiếp nhận ca'} disabled={busy || !connected} onPress={accept} />}
    {assigned && <View style={styles.answers}>
      <Text>{details && details.revision === alert.reportRevision ? `SĐT người báo: ${details.phone || 'Không cung cấp'}` : 'Đang lấy thông tin được cấp quyền…'}</Text>
      {details?.patientProfile ? <View style={styles.answers}><Text style={styles.cardTitle}>Hồ sơ bệnh nhân tự khai</Text><Text>Họ tên: {details.patientProfile.fullName}</Text><Text>Dị ứng: {details.patientProfile.allergies.join(', ') || 'Chưa khai báo'}</Text><Text>Liên hệ khẩn cấp: {details.patientProfile.emergencyContactPhone || 'Chưa khai báo'}</Text><Text>Chỉ dùng cho ca đang phụ trách; thông tin chưa được xác minh y khoa.</Text></View> : details && <Text>Bệnh nhân không chia sẻ hồ sơ sức khỏe qua thẻ này.</Text>}
      {details?.location && <IncidentNavigation destination={details.location} connected={connected} />}
      {alert.status === 'accepted' && <Button title="Xác nhận đã đến nơi" disabled={busy || !connected} onPress={arrive} />}
      <Text>Chỉ kết thúc khi phiên hỗ trợ đã xong. Sau đó bạn có thể bật sẵn sàng để thử ca tiếp theo.</Text>
      <Button title={busy ? 'Đang kết thúc…' : 'Kết thúc phiên hỗ trợ'} disabled={busy || !connected} onPress={finish} />
    </View>}
    {!!error && !terminal && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
  </View>;
}
export default function VolunteerScreen() { return <AuthGate>{user => <VolunteerDashboard key={user.uid} user={user} />}</AuthGate>; }
function VolunteerDashboard({ user }: { user: User }) {
  const focused = usePathname() === '/volunteer';
  const [alerts, setAlerts] = useState<Alert[]>([]), [connected, setConnected] = useState(false);
  const [approved, setApproved] = useState(false), [checked, setChecked] = useState(false), [application, setApplication] = useState<string>();
  const [now, setNow] = useState(() => Date.now()), [error, setError] = useState('');
  useEffect(() => onSnapshot(doc(firebaseClient().db, `volunteers/${user.uid}`), { includeMetadataChanges: true }, snapshot => {
    setChecked(!snapshot.metadata.fromCache); setApproved(!snapshot.metadata.fromCache && snapshot.data()?.verificationStatus === 'approved');
  }, err => { setChecked(false); setError(readableError(err)); }), [user.uid]);
  useEffect(() => onSnapshot(doc(firebaseClient().db, `volunteerApplications/${user.uid}`), snapshot => setApplication(snapshot.data()?.status), err => setError(readableError(err))), [user.uid]);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 10000); return () => clearInterval(timer); }, []);
  useEffect(() => {
    if (!approved) return;
    return onSnapshot(query(collection(firebaseClient().db, `volunteers/${user.uid}/alerts`), orderBy('createdAt', 'desc'), limit(30)), { includeMetadataChanges: true },
      snapshot => { setConnected(!snapshot.metadata.fromCache); setAlerts(snapshot.docs.map(item => item.data() as Alert)); setError(''); }, err => { setConnected(false); setError(readableError(err)); });
  }, [user.uid, approved]);
  useEffect(() => () => { updateAvailability({ available: false }, 4000).catch(() => undefined); }, [user.uid]);
  useEffect(() => { if (!focused) updateAvailability({ available: false }, 4000).catch(() => undefined); }, [focused, user.uid]);
  return <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
    <Text style={styles.eyebrow}>EHIS · TÌNH NGUYỆN VIÊN</Text><Text style={styles.title}>Hỗ trợ cộng đồng</Text>
    <Link href="/" style={{ color: '#096951', paddingVertical: 8 }}>← Chuyển khu vực</Link><AccountBar />
    {!checked ? <Text>Đang xác nhận quyền với máy chủ…</Text> : !approved ? <VolunteerApplication status={application} /> : <>
      <Text style={styles.intro}>Bạn đã được duyệt. Bật sẵn sàng và giữ màn hình này mở trong lúc thử nghiệm. Đổi khu vực sẽ tắt sẵn sàng cho ca mới.</Text>
      {!connected && <Text accessibilityRole="alert">Đang chờ đồng bộ máy chủ. Chưa thể nhận hoặc kết thúc ca.</Text>}
      <VolunteerAvailability key={user.uid} uid={user.uid} paused={!connected || !focused} />
      {connected && !alerts.length && <Text>Chưa có lời mời. Hãy bật sẵn sàng trước khi người báo gửi yêu cầu.</Text>}
      {[...alerts].sort((a, b) => Number(['offered', 'accepted', 'arrived'].includes(b.status)) - Number(['offered', 'accepted', 'arrived'].includes(a.status))).map(alert => <IncidentAlert key={alert.incidentId} alert={alert} connected={connected && approved} now={now} />)}
    </>}
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    <Text style={styles.note}>Chưa có thông báo đẩy khi app đóng. Không coi việc bật sẵn sàng là cam kết có ca; không thay thế dịch vụ cấp cứu.</Text>
  </ScrollView>;
}
const styles = StyleSheet.create({
  page: { padding: 24, gap: 18, backgroundColor: '#f4f8f6', flexGrow: 1 },
  eyebrow: { color: '#526f67', fontSize: 12, fontWeight: '700' }, title: { color: '#123c37', fontSize: 38, fontWeight: '700' },
  intro: { lineHeight: 24, color: '#526f67' }, card: { backgroundColor: '#fff', padding: 20, borderRadius: 16, gap: 14, borderWidth: 1, borderColor: '#dce8e0' },
  cardTitle: { fontSize: 19, fontWeight: '700', color: '#123c37' }, input: { borderWidth: 1, borderColor: '#b8cbc1', borderRadius: 10, padding: 14 },
  revision: { color: '#096951', fontWeight: '700' }, answers: { gap: 8 }, error: { color: '#9f2424' }, note: { color: '#526f67', fontSize: 12, lineHeight: 20 },
});
