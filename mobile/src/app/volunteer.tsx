import { Text } from '../components/AppText';
import { Button } from '../components/ActionButton';
import { useEffect, useRef, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { User } from 'firebase/auth';
import { collection, doc, limit, onSnapshot, orderBy, query } from 'firebase/firestore';

import { callable as httpsCallable, firebaseClient, readableError, updateAvailability } from '../lib/firebase';
import { VolunteerAvailability } from '../components/VolunteerAvailability';
import { IncidentNavigation } from '../components/IncidentNavigation';
import { AuthGate, AccountBar } from '../components/Session';
import { VolunteerApplication } from '../components/VolunteerApplication';
import { usePathname } from 'expo-router';
import { statusLabel } from '../lib/ui';
import { ConfirmAction } from '../components/ConfirmAction';
import { activeOffer, collectSignalEvents, invitationState } from '../lib/alert-policy';
import { palette } from '../lib/palette';
import { useEmergencySignal } from '../lib/use-emergency-signal';

type Answers = { responsiveness: string; breathing: string; bleeding: string };
type Alert = { incidentId: string; status: string; reportRevision: number; distanceMeters: number; answers: Answers | null; offerExpiresAt?: { toMillis(): number } };
type Details = { phone: string | null; answers: Answers | null; revision: number; location: { latitude: number; longitude: number } | null; patientProfile?: { fullName: string; allergies: string[]; emergencyContactPhone: string | null } | null };
const labels: Record<string, string> = { responsive: 'Có phản hồi', unresponsive: 'Không thấy phản hồi', unknown: 'Không rõ', normal: 'Có vẻ bình thường', abnormal: 'Có vẻ bất thường / không thấy thở', none_seen: 'Không thấy', visible: 'Có thấy' };
function Observation({ answers }: { answers: Answers | null }) {
  if (!answers) return <Text>Người báo chưa gửi câu trả lời bổ sung.</Text>;
  return <View style={styles.answers}><Text>Phản hồi: {labels[answers.responsiveness]}</Text><Text>Nhịp thở: {labels[answers.breathing]}</Text><Text>Chảy máu bên ngoài: {labels[answers.bleeding]}</Text></View>;
}
function IncidentAlert({ alert, connected, now, onAccepted, autoPreview = false }: { alert: Alert; connected: boolean; now: number; onAccepted?: (id: string) => void; autoPreview?: boolean }) {
  const [details, setDetails] = useState<Details>();
  const [detailAttempt, setDetailAttempt] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!connected || !['accepted', 'arrived'].includes(alert.status)) return;
    let cancelled = false;
    httpsCallable<{ incidentId: string }, Details>(firebaseClient().functions, 'getVolunteerIncidentDetails', { timeout: 15000 })({ incidentId: alert.incidentId })
      .then(result => { if (!cancelled) { setDetails(result.data); setError(''); } })
      .catch(err => { if (!cancelled) { setDetails(undefined); setError(readableError(err)); } });
    return () => { cancelled = true; };
  }, [alert.incidentId, alert.reportRevision, alert.status, connected, detailAttempt]);
  async function accept() {
    setBusy(true); setError('');
    try { await httpsCallable(firebaseClient().functions, 'acceptIncident', { timeout: 15000 })({ incidentId: alert.incidentId }); onAccepted?.(alert.incidentId); }
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
  const visibleStatus = invitationState({ ...alert, expiresAt: alert.offerExpiresAt?.toMillis() }, now);
  const offerExpired = visibleStatus === 'expired';
  const terminal = offerExpired || ['closed', 'completed', 'cancelled', 'expired'].includes(alert.status);
  const privateData = connected && details?.revision === alert.reportRevision ? details : undefined;
  return <View style={[styles.card, !terminal && !assigned && styles.urgent]}>
    <Text style={styles.cardTitle}>{assigned ? 'Bạn đang phụ trách ca' : terminal ? 'Ca / lời mời đã kết thúc' : 'Yêu cầu hỗ trợ mới'}</Text>
    <Text>Ca {alert.incidentId.slice(0, 10)} · Đường thẳng lúc gửi lời mời: {alert.distanceMeters} m</Text>
    <Text style={!terminal && !assigned ? styles.urgentTitle : styles.revision}>{statusLabel[visibleStatus] || visibleStatus}</Text>
    <Text style={styles.revision}>{alert.reportRevision > 0 ? `Thông tin bổ sung · bản ${alert.reportRevision}` : 'Thông báo ban đầu'}</Text>
    {!terminal && <Observation answers={alert.answers} />}
    {alert.status === 'offered' && !offerExpired && <><Text style={styles.note}>Hồ sơ sức khỏe và vị trí chi tiết chỉ mở sau khi bạn nhận ca, theo quyền chia sẻ của bệnh nhân. Khi mở đường đi, tọa độ được gửi đến OSRM.</Text><Button title={busy ? 'Đang xác nhận nhận ca…' : 'Nhận ca và mở đường đi'} disabled={busy || !connected} color={palette.emergency.primary} onPress={accept} /></>}
    {assigned && <View style={styles.answers}>
      <Text>{privateData ? `SĐT người báo: ${privateData.phone || 'Không cung cấp'}` : 'Đang chờ thông tin được cấp quyền từ máy chủ…'}</Text>
      {!privateData && !!error && <Button title="Tải lại chi tiết ca" disabled={!connected} onPress={() => { setError(''); setDetailAttempt(value => value + 1); }} />}
      {privateData?.patientProfile ? <View style={styles.answers}><Text style={styles.cardTitle}>Hồ sơ bệnh nhân tự khai</Text><Text>Họ tên: {privateData.patientProfile.fullName}</Text><Text>Dị ứng: {privateData.patientProfile.allergies.join(', ') || 'Chưa khai báo'}</Text><Text>Liên hệ khẩn cấp: {privateData.patientProfile.emergencyContactPhone || 'Chưa khai báo'}</Text><Text>Chỉ dùng cho ca đang phụ trách; thông tin chưa được xác minh y khoa.</Text></View> : privateData && <Text>Bệnh nhân không chia sẻ hồ sơ sức khỏe qua thẻ này.</Text>}
      {connected && details?.location && <IncidentNavigation destination={details.location} connected={connected} autoPreview={autoPreview} />}
      {alert.status === 'accepted' && <Button title="Xác nhận đã đến nơi" disabled={busy || !connected} onPress={arrive} />}
      <Text>Chỉ kết thúc khi phiên hỗ trợ đã xong. Sau đó bạn có thể bật sẵn sàng để thử ca tiếp theo.</Text>
      <ConfirmAction title="Kết thúc phiên hỗ trợ" explanation="Bạn xác nhận phiên hỗ trợ đã xong? Sau bước này, thông tin riêng và bản đồ của ca sẽ đóng." disabled={busy || !connected} onConfirm={finish} />
    </View>}
    {!!error && !terminal && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
  </View>;
}
export default function VolunteerScreen() { return <AuthGate purpose="volunteer">{user => <VolunteerDashboard key={user.uid} user={user} />}</AuthGate>; }
function VolunteerDashboard({ user }: { user: User }) {
  const focused = usePathname() === '/volunteer';
  const [alerts, setAlerts] = useState<Alert[]>([]), [connected, setConnected] = useState(false);
  const [approved, setApproved] = useState(false), [checked, setChecked] = useState(false), [application, setApplication] = useState<string>();
  const [available, setAvailable] = useState(false);
  const [wakeId, setWakeId] = useState<string | null>(null), [autoRouteId, setAutoRouteId] = useState<string | null>(null);
  const seen = useRef(new Map<string, number>());
  const signal = useEmergencySignal();
  const [now, setNow] = useState(() => Date.now()), [error, setError] = useState('');
  useEffect(() => onSnapshot(doc(firebaseClient().db, `volunteers/${user.uid}`), { includeMetadataChanges: true }, snapshot => {
    setChecked(!snapshot.metadata.fromCache); setApproved(!snapshot.metadata.fromCache && snapshot.data()?.verificationStatus === 'approved'); setAvailable(!snapshot.metadata.fromCache && snapshot.data()?.isAvailable === true);
  }, err => { setChecked(false); setAvailable(false); setError(readableError(err)); }), [user.uid]);
  useEffect(() => onSnapshot(doc(firebaseClient().db, `volunteerApplications/${user.uid}`), snapshot => setApplication(snapshot.data()?.status), err => setError(readableError(err))), [user.uid]);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  useEffect(() => {
    if (!approved) return;
    return onSnapshot(query(collection(firebaseClient().db, `volunteers/${user.uid}/alerts`), orderBy('createdAt', 'desc'), limit(30)), { includeMetadataChanges: true },
      snapshot => { setConnected(!snapshot.metadata.fromCache); setAlerts(snapshot.docs.map(item => item.data() as Alert)); setError(''); }, err => { setConnected(false); setError(readableError(err)); });
  }, [user.uid, approved]);
  useEffect(() => () => { updateAvailability({ available: false }, 4000).catch(() => undefined); }, [user.uid]);
  useEffect(() => { if (!focused) updateAvailability({ available: false }, 4000).catch(() => undefined); }, [focused, user.uid]);
  const offers = alerts.filter(alert => activeOffer({ ...alert, expiresAt: alert.offerExpiresAt?.toMillis() }, now));
  const assigned = alerts.filter(alert => ['accepted', 'arrived'].includes(alert.status));
  const wakeOffer = offers.find(alert => alert.incidentId === wakeId);
  const { play, stop, foreground } = signal;
  const feedbackActive = approved && connected && focused && foreground && (available || assigned.length > 0);
  useEffect(() => { if (!feedbackActive) stop(); }, [feedbackActive, stop]);
  useEffect(() => {
    if (!feedbackActive) return;
    const events = collectSignalEvents(seen.current, alerts.map(alert => ({ ...alert, expiresAt: alert.offerExpiresAt?.toMillis() })), now);
    if (events.length) {
      play(events.some(event => event.kind === 'request') ? 'request' : 'update');
      const invitation = events.find(event => alerts.some(alert => alert.incidentId === event.incidentId && activeOffer({ ...alert, expiresAt: alert.offerExpiresAt?.toMillis() }, now)));
      if (invitation) setWakeId(previous => alerts.some(alert => alert.incidentId === previous && activeOffer({ ...alert, expiresAt: alert.offerExpiresAt?.toMillis() }, now)) ? previous : invitation.incidentId);
    }
  }, [alerts, feedbackActive, now, play]);
  useEffect(() => { if (wakeId && !wakeOffer) stop(); }, [wakeId, wakeOffer, stop]);
  function closeAlarm() { stop(); setWakeId(null); }
  function accepted(id: string) {
    closeAlarm(); setAutoRouteId(id);
    // The API has confirmed assignment; do not wait for a later listener to show it.
    setAlerts(previous => previous.map(alert => alert.incidentId === id ? { ...alert, status: 'accepted' } : alert));
  }
  return <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
    <Text style={styles.eyebrow}>EHIS · TÌNH NGUYỆN VIÊN</Text><Text style={styles.title}>Hỗ trợ cộng đồng</Text>
    <AccountBar />
    {!checked ? <Text>Đang xác nhận quyền với máy chủ…</Text> : !approved ? <VolunteerApplication status={application} /> : <>
      <Text style={styles.intro}>Bật sẵn sàng, kiểm tra chuông và giữ trang này mở. Yêu cầu mới sẽ hiện cảnh báo nổi bật; nhận ca để mở hồ sơ được chia sẻ và đường đi.</Text>
      {!connected && <Text accessibilityRole="alert">Đang chờ đồng bộ máy chủ. Chưa thể nhận hoặc kết thúc ca.</Text>}
      {offers.length > 0 && <View style={styles.urgent}><Text accessibilityRole="alert" style={styles.urgentTitle}>⚠ CẦN HỖ TRỢ KHẨN · {offers.length} YÊU CẦU</Text><Text style={styles.urgentText}>Chưa có người nhận ca cho đến khi máy chủ xác nhận. Xem tình trạng và chỉ nhận nếu bạn có thể hỗ trợ.</Text><Button title="Mở cảnh báo yêu cầu" color={palette.emergency.primary} onPress={() => setWakeId(offers[0].incidentId)} /></View>}
      {assigned.map(alert => <IncidentAlert key={alert.incidentId} alert={alert} connected={connected && approved} now={now} autoPreview={autoRouteId === alert.incidentId} />)}
      <VolunteerAvailability key={user.uid} uid={user.uid} paused={!connected || !focused} prepareAlerts={signal.prepare} />
      <View style={styles.card}><Text style={styles.cardTitle}>Chuông và rung cảnh báo</Text><Text accessibilityLiveRegion="polite">{signal.sounding ? 'Đang phát chuông cảnh báo…' : signal.message}</Text><Button title="Bật và thử chuông · 1 giây" onPress={signal.test} color="#0b5962" /><View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}><Switch accessibilityLabel="Rung nhẹ khi có cảnh báo" value={signal.vibrationEnabled} onValueChange={signal.toggleVibration} disabled={!signal.vibrationSupported} /><Text style={{ flex: 1 }}>{signal.vibrationSupported ? 'Rung nhẹ nếu thiết bị cho phép.' : 'Trình duyệt này chưa hỗ trợ rung; cảnh báo hình ảnh vẫn hoạt động.'}</Text></View>{signal.soundEnabled && <Button title="Tắt âm chuông" onPress={signal.mute} color="#526f67" />}{signal.sounding && <Button title="Dừng chuông hiện tại" onPress={signal.stop} color={palette.emergency.primary} />}<Text style={styles.note}>Yêu cầu mới: chuông tối đa 6 giây. Thông tin bổ sung mới: 2 giây. Không phát lặp cho cùng một bản cập nhật. Web cần được mở ở phía trước; không bảo đảm chuông khi khóa màn hình hoặc đóng trình duyệt.</Text></View>
      {connected && !alerts.length && <Text>Chưa có lời mời. Hãy bật sẵn sàng trước khi người báo gửi yêu cầu.</Text>}
      {[...alerts].filter(alert => !['accepted', 'arrived'].includes(alert.status) && alert.incidentId !== wakeOffer?.incidentId).sort((a, b) => Number(b.status === 'offered') - Number(a.status === 'offered')).map(alert => <IncidentAlert key={alert.incidentId} alert={alert} connected={connected && approved} now={now} onAccepted={accepted} />)}
      <Modal visible={!!wakeOffer && foreground && focused && connected} transparent animationType="fade" onRequestClose={closeAlarm}>
        <View style={styles.backdrop}><ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled"><Text accessibilityRole="alert" style={styles.urgentTitle}>{wakeOffer?.reportRevision ? 'CÓ THÔNG TIN TÌNH TRẠNG MỚI' : '⚠ CẦN HỖ TRỢ KHẨN'}</Text>{wakeOffer && <><Text style={styles.urgentText}>Lời mời còn khoảng {Math.max(0, Math.ceil((wakeOffer.offerExpiresAt!.toMillis() - now) / 1000))} giây theo hạn máy chủ. {offers.length > 1 ? `Có ${offers.length} lời mời đang chờ.` : ''}</Text><IncidentAlert alert={wakeOffer} connected={connected && approved} now={now} onAccepted={accepted} /></>}<Button title="Đã xem · đóng cảnh báo và dừng chuông" onPress={closeAlarm} color="#526f67" /><Text style={styles.note}>Đóng cửa sổ chỉ xác nhận bạn đã xem; không tự nhận hoặc từ chối ca. Lời mời còn hạn vẫn nằm trong danh sách.</Text></ScrollView></View>
      </Modal>
    </>}
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    <Text style={styles.note}>Chưa có thông báo đẩy khi app đóng. Không coi việc bật sẵn sàng là cam kết có ca; không thay thế dịch vụ cấp cứu.</Text>
  </ScrollView>;
}
const styles = StyleSheet.create({
  page: { padding: 20, gap: 18, backgroundColor: palette.volunteer.background, flexGrow: 1, width: '100%', maxWidth: 800, alignSelf: 'center' },
  urgent: { backgroundColor: palette.emergency.background, borderColor: palette.emergency.border, borderWidth: 2, borderRadius: 16, padding: 18, gap: 12 },
  urgentTitle: { color: palette.emergency.ink, fontSize: 24, fontWeight: '800' }, urgentText: { color: '#57282b', fontSize: 17, lineHeight: 25 },
  backdrop: { flex: 1, backgroundColor: 'rgba(19, 30, 33, 0.75)', padding: 18, justifyContent: 'center' },
  modalContent: { backgroundColor: palette.emergency.background, padding: 20, gap: 16, borderRadius: 18, borderWidth: 3, borderColor: palette.emergency.border, width: '100%', maxWidth: 760, alignSelf: 'center', marginVertical: 20 },
  eyebrow: { color: '#526f67', fontSize: 12, fontWeight: '700' }, title: { color: '#123c37', fontSize: 38, fontWeight: '700' },
  intro: { fontSize: 17, lineHeight: 26, color: '#36574e' }, card: { backgroundColor: '#fff', padding: 20, borderRadius: 16, gap: 14, borderWidth: 1, borderColor: '#dce8e0' },
  cardTitle: { fontSize: 19, fontWeight: '700', color: '#123c37' }, input: { borderWidth: 1, borderColor: '#b8cbc1', borderRadius: 10, padding: 14 },
  revision: { color: '#096951', fontWeight: '700' }, answers: { gap: 8 }, error: { color: '#9f2424', fontSize: 17 }, note: { color: '#405e54', fontSize: 16, lineHeight: 25 },
});
