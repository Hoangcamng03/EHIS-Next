import { Text } from '../components/AppText';
import { Button } from '../components/ActionButton';
import { ToggleRow } from '../components/ToggleRow';
import { InfoDisclosure } from '../components/InfoDisclosure';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, ScrollView, StyleSheet, View } from 'react-native';
import { User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

import { callable as httpsCallable, firebaseClient, readableError, updateAvailability } from '../lib/firebase';
import { VolunteerAvailability } from '../components/VolunteerAvailability';
import { IncidentNavigation } from '../components/IncidentNavigation';
import { AuthGate, AccountBar } from '../components/Session';
import { VolunteerApplication } from '../components/VolunteerApplication';
import { BackgroundNotifications } from '../components/BackgroundNotifications';
import { usePathname } from 'expo-router';
import { statusLabel } from '../lib/ui';
import { ConfirmAction } from '../components/ConfirmAction';
import { activeOffer, collectSignalEvents, invitationState } from '../lib/alert-policy';
import { palette } from '../lib/palette';
import { useEmergencySignal } from '../lib/use-emergency-signal';
import { subscribeVolunteerAlerts, type AlertFeedState } from '../lib/subscribe-alerts';

type Answers = { responsiveness: string; breathing: string; bleeding: string };
type Alert = { incidentId: string; status: string; reportRevision: number; locationRevision?: number; distanceMeters: number; answers: Answers | null; offerExpiresAt?: { toMillis(): number } };
type Details = { phone: string | null; answers: Answers | null; revision: number; locationRevision?: number; location: { latitude: number; longitude: number } | null; patientProfile?: { fullName: string; allergies: string[]; emergencyContactPhone: string | null; emergencyContactName?: string | null; emergencyContactRelationship?: string | null } | null };
const labels: Record<string, string> = { responsive: 'Có phản hồi', unresponsive: 'Không thấy phản hồi', unknown: 'Không rõ', normal: 'Có vẻ bình thường', abnormal: 'Có vẻ bất thường / không thấy thở', none_seen: 'Không thấy', visible: 'Có thấy' };
const OfferSummary = memo(function OfferSummary({ alert, onOpen }: { alert: Alert; onOpen: (id: string) => void }) {
  return <View style={styles.card}><Text style={styles.cardTitle}>Ca {alert.incidentId.slice(0, 10)} · {alert.distanceMeters} m</Text>
    <Text>{alert.answers ? `Phản hồi: ${labels[alert.answers.responsiveness]} · Nhịp thở: ${labels[alert.answers.breathing]}` : 'Người báo chưa gửi tình trạng bổ sung.'}</Text>
    <Button variant="secondary" title={`Xem ca ${alert.incidentId.slice(0, 10)}`} color={palette.emergency.primary} onPress={() => onOpen(alert.incidentId)} /></View>;
});
function Observation({ answers }: { answers: Answers | null }) {
  if (!answers) return <Text>Chờ người báo bổ sung tình trạng.</Text>;
  return <View style={styles.answers}><Text>Phản hồi: {labels[answers.responsiveness]}</Text><Text>Thở: {labels[answers.breathing]}</Text><Text>Chảy máu: {labels[answers.bleeding]}</Text></View>;
}
function IncidentAlert({ alert, connected, now, onAccepted, autoPreview = false, canAccept = true }: { alert: Alert; connected: boolean; now: number; onAccepted?: (id: string) => void; autoPreview?: boolean; canAccept?: boolean }) {
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
  }, [alert.incidentId, alert.reportRevision, alert.locationRevision, alert.status, connected, detailAttempt]);
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
    {(assigned || terminal) && <Text style={styles.cardTitle}>{assigned ? 'Đang phụ trách' : 'Đã kết thúc'}</Text>}
    <Text>Ca {alert.incidentId.slice(0, 10)} · Đường thẳng: {alert.distanceMeters} m</Text>
    <Text style={!terminal && !assigned ? styles.urgentTitle : styles.revision}>{statusLabel[visibleStatus] || visibleStatus}</Text>

    {!terminal && <Observation answers={alert.answers} />}
    {alert.status === 'offered' && !offerExpired && <><Text style={styles.note}>Nhận ca để mở hồ sơ được chia sẻ và bản đồ. Tọa độ tính tuyến gửi tới OSRM.</Text><Button loading={busy} title={busy ? 'Đang nhận…' : 'Nhận ca'} disabled={busy || !connected || !canAccept} color={palette.emergency.primary} onPress={accept} /></>}
    {assigned && <View style={styles.answers}>
      <Text>{privateData ? `Người báo: ${privateData.phone || 'Không cung cấp'}` : 'Đang tải chi tiết ca…'}</Text>
      {!privateData && !!error && <Button title="Tải lại chi tiết ca" disabled={!connected} onPress={() => { setError(''); setDetailAttempt(value => value + 1); }} />}
      {privateData?.patientProfile ? <View style={styles.answers}><Text style={styles.cardTitle}>Hồ sơ bệnh nhân</Text><Text>Họ tên: {privateData.patientProfile.fullName}</Text><Text>Dị ứng: {privateData.patientProfile.allergies.join(', ') || 'Chưa khai báo'}</Text><Text>Người liên hệ: {privateData.patientProfile.emergencyContactName || 'Chưa khai báo'}{privateData.patientProfile.emergencyContactRelationship ? ` · ${privateData.patientProfile.emergencyContactRelationship}` : ''}</Text><Text>Số khẩn cấp: {privateData.patientProfile.emergencyContactPhone || 'Chưa khai báo'}</Text><Text>Thông tin tự khai, chưa xác minh y tế.</Text></View> : privateData && <Text>Bệnh nhân không chia sẻ hồ sơ sức khỏe.</Text>}
      {(alert.locationRevision || 0) > 0 && <Text style={styles.urgentTitle}>Điểm bệnh nhân vừa được cập nhật</Text>}{connected && details?.location && <IncidentNavigation destination={details.location} connected={connected && (details.locationRevision || 0) === (alert.locationRevision || 0)} autoPreview={autoPreview || (alert.locationRevision || 0) > 0} />}{connected && (details?.locationRevision || 0) !== (alert.locationRevision || 0) && <Text>Đang cập nhật điểm đến…</Text>}
      {alert.status === 'accepted' && <Button loading={busy} title="Đã đến nơi" disabled={busy || !connected} onPress={arrive} />}

      <ConfirmAction tone="complete" title="Hoàn tất ca hỗ trợ" explanation="Hoàn tất ca và đóng thông tin riêng?" disabled={busy || !connected} onConfirm={finish} />
    </View>}
    {!!error && !terminal && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
  </View>;
}
export default function VolunteerScreen() { return <AuthGate purpose="volunteer">{user => <VolunteerDashboard key={user.uid} user={user} />}</AuthGate>; }
function VolunteerDashboard({ user }: { user: User }) {
  const focused = usePathname() === '/volunteer';
  const [activeId, setActiveId] = useState<string | null>(null);
  const [feed, setFeed] = useState<AlertFeedState & { key: string }>({ alerts: [], connected: false, error: null, key: '' });
  const feedKey = `${user.uid}:${activeId ?? ''}`;
  const [approved, setApproved] = useState(false), [checked, setChecked] = useState(false), [application, setApplication] = useState<{ status?: string; [key: string]: unknown }>();
  const [applicationLoaded, setApplicationLoaded] = useState(false), [verificationVersion, setVerificationVersion] = useState(0);
  const alerts = useMemo(() => approved && feed.key === feedKey ? feed.alerts : [], [approved, feed.key, feed.alerts, feedKey]);
  const connected = approved && feed.key === feedKey && feed.connected;
  const [available, setAvailable] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [wakeId, setWakeId] = useState<string | null>(null), [autoRouteId, setAutoRouteId] = useState<string | null>(null);
  const seen = useRef(new Map<string, number>());
  const signal = useEmergencySignal();
  const [now, setNow] = useState(() => Date.now()), [error, setError] = useState('');
  useEffect(() => onSnapshot(doc(firebaseClient().db, `volunteers/${user.uid}`), { includeMetadataChanges: true }, snapshot => {
    setChecked(!snapshot.metadata.fromCache); setApproved(!snapshot.metadata.fromCache && snapshot.data()?.verificationStatus === 'approved'); setAvailable(!snapshot.metadata.fromCache && snapshot.data()?.isAvailable === true);
    setActiveId(typeof snapshot.data()?.activeIncidentId === 'string' ? snapshot.data()!.activeIncidentId : null);
    setVerificationVersion(snapshot.data()?.verificationPolicyVersion || 0);
  }, err => { setChecked(false); setAvailable(false); setError(readableError(err)); }), [user.uid]);
  useEffect(() => onSnapshot(doc(firebaseClient().db, `volunteerApplications/${user.uid}`), snapshot => { setApplication(snapshot.data()); setApplicationLoaded(true); }, err => setError(readableError(err))), [user.uid]);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  useEffect(() => {
    if (!approved) return;
    return subscribeVolunteerAlerts(firebaseClient().db, user.uid, activeId, value => {
      setFeed({ ...value, key: feedKey }); setError(value.error ? readableError(value.error) : '');
    });
  }, [user.uid, approved, activeId, feedKey]);
  useEffect(() => () => { updateAvailability({ available: false }, 4000).catch(() => undefined); }, [user.uid]);
  useEffect(() => { if (!focused) updateAvailability({ available: false }, 4000).catch(() => undefined); }, [focused, user.uid]);
  const offers = useMemo(() => alerts.filter(alert => activeOffer({ ...alert, expiresAt: alert.offerExpiresAt?.toMillis() }, now)).sort((a, b) => (a.offerExpiresAt?.toMillis() || 0) - (b.offerExpiresAt?.toMillis() || 0) || a.distanceMeters - b.distanceMeters || a.incidentId.localeCompare(b.incidentId)), [alerts, now]);
  const assigned = useMemo(() => alerts.filter(alert => ['accepted', 'arrived'].includes(alert.status)), [alerts]);
  const history = alerts.filter(alert => !['accepted', 'arrived'].includes(alert.status) && !activeOffer({ ...alert, expiresAt: alert.offerExpiresAt?.toMillis() }, now));
  const wakeOffer = offers.find(alert => alert.incidentId === wakeId);
  const { play, stop, foreground } = signal;
  const openOffer = useCallback((id: string) => { stop(); setWakeId(id); }, [stop]);
  const feedbackActive = approved && connected && focused && foreground && (available || assigned.length > 0);
  useEffect(() => { if (!feedbackActive) stop(); }, [feedbackActive, stop]);
  useEffect(() => {
    if (!feedbackActive) return;
    const eligible = assigned.length ? assigned : alerts;
    const events = collectSignalEvents(seen.current, eligible.map(alert => ({ ...alert, expiresAt: alert.offerExpiresAt?.toMillis() })), now);
    if (events.length) {
      play(events.some(event => event.kind === 'request') ? 'request' : 'update');
      const invitation = offers.find(alert => events.some(event => event.incidentId === alert.incidentId));
      if (invitation) setWakeId(previous => offers.some(alert => alert.incidentId === previous) ? previous : invitation.incidentId);
    }
  }, [alerts, offers, assigned, feedbackActive, now, play]);
  useEffect(() => { if (wakeId && !wakeOffer) stop(); }, [wakeId, wakeOffer, stop]);
  function closeAlarm() { stop(); setWakeId(null); }
  function accepted(id: string) {
    closeAlarm(); setAutoRouteId(id);
    // The API has confirmed assignment; do not wait for a later listener to show it.
    setFeed(previous => ({ ...previous, alerts: previous.alerts.map(alert => alert.incidentId === id ? { ...alert, status: 'accepted' } : alert) }));
  }
  return <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="always" keyboardDismissMode="on-drag">
    <Text style={styles.eyebrow}>EHIS · TÌNH NGUYỆN VIÊN</Text><Text style={styles.title}>{assigned.length ? 'Đang hỗ trợ' : 'Hỗ trợ cộng đồng'}</Text>
    {!checked ? <Text>Đang xác nhận quyền với máy chủ…</Text> : !approved ? applicationLoaded ? <VolunteerApplication key={String(application?.applicationRevision || 'new')} status={application?.status} initial={application} /> : <Text>Đang tải hồ sơ đăng ký…</Text> : <>
      {verificationVersion !== 2 && <Text style={styles.note}>Tài khoản diễn tập cũ · Chưa có checklist xác minh của đơn vị theo quy trình mới.</Text>}
      {!assigned.length && <Text style={styles.intro}>Bật sẵn sàng để nhận yêu cầu gần bạn.</Text>}
      {!connected && <Text accessibilityRole="alert">Đang đồng bộ · Tạm khóa thao tác ca.</Text>}
      {feed.overflow && <Text accessibilityRole="alert" style={styles.error}>Vượt 100 lời mời. Liên hệ người vận hành.</Text>}
      {offers.length > 0 && <View style={assigned.length ? styles.card : styles.urgent}><Text accessibilityRole="alert" style={assigned.length ? styles.cardTitle : styles.urgentTitle}>{assigned.length ? `Còn ${offers.length} yêu cầu khác đang chờ` : `⚠ Cần hỗ trợ khẩn · ${offers.length} ca`}</Text><Text style={styles.urgentText}>{assigned.length ? "Hoàn tất ca hiện tại trước khi nhận ca khác." : "Chỉ nhận khi bạn có thể đến hỗ trợ."}</Text><Button title="Xem yêu cầu" color={palette.emergency.primary} onPress={() => setWakeId(offers[0].incidentId)} /></View>}
      {assigned.map(alert => <IncidentAlert key={alert.incidentId} alert={alert} connected={connected && approved} now={now} autoPreview={autoRouteId === alert.incidentId} />)}
      {offers.map(alert => <OfferSummary key={alert.incidentId} alert={alert} onOpen={openOffer} />)}
      <VolunteerAvailability key={user.uid} uid={user.uid} paused={!connected || !focused} prepareAlerts={signal.prepare} />
      <BackgroundNotifications />
      <View style={styles.card}><Text style={styles.cardTitle}>Âm thanh cảnh báo</Text><Text accessibilityLiveRegion="polite" style={styles.note}>{signal.sounding ? "Đang phát chuông…" : signal.message}</Text><Button variant="secondary" title="Thử chuông" onPress={signal.test} color="#0b5962" />{signal.sounding && <Button title="Dừng chuông" onPress={signal.stop} color={palette.emergency.primary} />}<InfoDisclosure title="Tùy chọn chuông và rung"><ToggleRow accessibilityLabel="Rung nhẹ khi có cảnh báo" label={signal.vibrationSupported ? "Rung khi có cảnh báo" : "Thiết bị chưa hỗ trợ rung"} value={signal.vibrationEnabled} onValueChange={signal.toggleVibration} disabled={!signal.vibrationSupported} /><Text style={styles.note}>Chuông trong app: yêu cầu mới 6 giây; bổ sung 2 giây. Android cần Media &gt; 0. Muốn nhận khi bấm Home hoặc khóa màn hình, bật thông báo Android bên dưới. Âm báo còn phụ thuộc cài đặt âm lượng và Không làm phiền.</Text></InfoDisclosure></View>
      {connected && !offers.length && !assigned.length && <Text>Chưa có ca chờ gần bạn.</Text>}
      {history.length > 0 && <View style={styles.card}><Button variant="secondary" title={historyOpen ? 'Ẩn lịch sử gần đây' : `Xem lịch sử gần đây (${history.length})`} color="#526f67" onPress={() => setHistoryOpen(value => !value)} />{historyOpen && history.map(alert => <IncidentAlert key={alert.incidentId} alert={alert} connected={connected && approved} now={now} />)}</View>}
      <Modal visible={!!wakeOffer && foreground && focused && connected} transparent animationType="none" hardwareAccelerated onRequestClose={closeAlarm}>
        <View style={styles.backdrop}><ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="always" keyboardDismissMode="on-drag"><Text accessibilityRole="alert" style={styles.urgentTitle}>⚠ Cần hỗ trợ khẩn</Text>{wakeOffer && <><Text style={styles.urgentText}>Còn {Math.max(0, Math.ceil((wakeOffer.offerExpiresAt!.toMillis() - now) / 1000))} giây để nhận. {offers.length > 1 ? `Có ${offers.length} lời mời đang chờ.` : ''}</Text>{!available && !assigned.length && <Text>Bật sẵn sàng trước khi nhận lời mời này.</Text>}<IncidentAlert alert={wakeOffer} connected={connected && approved} now={now} onAccepted={accepted} canAccept={available && !assigned.length} /></>}{offers.length > 1 && <View style={{ gap: 8 }}><Text style={styles.cardTitle}>Chọn ca chờ khác ({offers.length})</Text>{offers.map((item, index) => <Button key={item.incidentId} variant={item.incidentId === wakeId ? "primary" : "secondary"} title={`${index + 1}. Ca ${item.incidentId.slice(0, 10)} · ${item.distanceMeters} m${item.incidentId === wakeId ? " · đang xem" : ""}`} onPress={() => { stop(); setWakeId(item.incidentId); }} />)}</View>}<Button variant="secondary" title="Đóng · Xem danh sách ca" onPress={closeAlarm} color="#526f67" /><Text style={styles.note}>Đóng cửa sổ không hủy lời mời.</Text></ScrollView></View>
      </Modal>
    </>}
    <AccountBar />
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    <Text style={styles.note}>GPS làm mới khi app mở. Điểm cũ quá 5 phút không nhận ca mới.</Text>
  </ScrollView>;
}
const styles = StyleSheet.create({
  page: { padding: 16, gap: 14, backgroundColor: palette.volunteer.background, flexGrow: 1, width: '100%', maxWidth: 800, alignSelf: 'center' },
  urgent: { backgroundColor: palette.emergency.background, borderColor: palette.emergency.border, borderWidth: 2, borderRadius: 16, padding: 18, gap: 12 },
  urgentTitle: { color: palette.emergency.ink, fontSize: 20, lineHeight: 27, fontWeight: '700' }, urgentText: { color: '#57282b', fontSize: 16, lineHeight: 23 },
  backdrop: { flex: 1, backgroundColor: 'rgba(19, 30, 33, 0.75)', padding: 18, justifyContent: 'center' },
  modalContent: { backgroundColor: palette.emergency.background, padding: 16, gap: 12, borderRadius: 16, borderWidth: 3, borderColor: palette.emergency.border, width: '100%', maxWidth: 760, alignSelf: 'center', marginVertical: 20 },
  eyebrow: { color: '#526f67', fontSize: 12, fontWeight: '700' }, title: { color: '#123c37', fontSize: 26, lineHeight: 33, fontWeight: '700' },
  intro: { fontSize: 16, lineHeight: 23, color: '#36574e' }, card: { backgroundColor: '#fff', padding: 16, borderRadius: 16, gap: 12, borderWidth: 1, borderColor: '#dce8e0' },
  cardTitle: { fontSize: 17, lineHeight: 24, fontWeight: '700', color: '#123c37' }, input: { borderWidth: 1, borderColor: '#b8cbc1', borderRadius: 10, padding: 14 },
  revision: { color: '#096951', fontWeight: '700' }, answers: { gap: 8 }, error: { color: '#9f2424', fontSize: 17 }, note: { color: '#405e54', fontSize: 14, lineHeight: 20 },
});
