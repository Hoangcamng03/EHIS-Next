import { Text } from '../components/AppText';
import { Button } from '../components/ActionButton';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { Linking, Platform, ScrollView, Switch, TextInput, View, useWindowDimensions } from 'react-native';
import { collection, doc, getDoc, limit, onSnapshot, orderBy, query } from 'firebase/firestore';

import QRCode from 'react-native-qrcode-svg';
import { AuthGate, AccountBar } from '../components/Session';
import { callable as httpsCallable, firebaseClient, isLocalEmulator, isTrialMode, readableError } from '../lib/firebase';
import { patientUi as ui, statusLabel } from '../lib/ui';
import { ConfirmAction } from '../components/ConfirmAction';
import { profileDraft, profileMatchesSaved } from '../lib/profile-draft';

type Card = { cardId: string; active: boolean; shareProfile: boolean };
type History = { id: string; status: string; createdAt?: { toDate(): Date }; invitedCount?: number };
export default function PatientScreen() { return <AuthGate purpose="patient">{user => <PatientDashboard key={user.uid} uid={user.uid} />}</AuthGate>; }
function PatientDashboard({ uid }: { uid: string }) {
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const { width } = useWindowDimensions();
  const [fullName, setFullName] = useState(''), [allergies, setAllergies] = useState(''), [phone, setPhone] = useState('');
  const [loaded, setLoaded] = useState(false), [savedFingerprint, setSavedFingerprint] = useState<string | null>(null);
  const [profileFailed, setProfileFailed] = useState(false), [profileAttempt, setProfileAttempt] = useState(0);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [card, setCard] = useState<Card>(), [history, setHistory] = useState<History[]>([]);
  const [share, setShare] = useState(false), [confirmedRevoke, setConfirmedRevoke] = useState(false);
  const [operation, setOperation] = useState<string | null>(null);
  const [feedbackTarget, setFeedbackTarget] = useState('profile');
  const [connected, setConnected] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('');
  const configuredUrl = process.env.EXPO_PUBLIC_BYSTANDER_URL;
  const base = configuredUrl || (isLocalEmulator && Platform.OS === 'web' ? 'http://localhost:3100' : '');
  let validBase = false;
  try { const url = new URL(base); validBase = !url.username && !url.password && !url.search && !url.hash && (url.protocol === 'https:' || (isLocalEmulator && url.protocol === 'http:')); } catch { /* Display setup message instead of a broken QR. */ }
  const cardUrl = validBase && card?.active ? `${base.replace(/\/+$/, '')}/card?id=${encodeURIComponent(card.cardId)}` : '';
  useEffect(() => {
    let cancelled = false;
    getDoc(doc(firebaseClient().db, `patients/${uid}`)).then(snapshot => {
      if (cancelled) return;
      const value = snapshot.data();
      setFullName(value?.fullName || ''); setAllergies((value?.allergies || []).join(', ')); setPhone(value?.emergencyContactPhone || '');
      setSavedFingerprint(snapshot.exists() ? JSON.stringify(profileDraft(value?.fullName || '', (value?.allergies || []).join(', '), value?.emergencyContactPhone || '')) : null); setLoaded(true);
    }).catch(err => { if (!cancelled) { setError(readableError(err)); setProfileFailed(true); } });
    return () => { cancelled = true; };
  }, [uid, profileAttempt]);
  useEffect(() => onSnapshot(doc(firebaseClient().db, `patientCards/${uid}`), { includeMetadataChanges: true }, snapshot => {
    setConnected(!snapshot.metadata.fromCache); setCard(snapshot.exists() ? snapshot.data() as Card : undefined);
  }, err => { setConnected(false); setError(readableError(err)); }), [uid]);
  useEffect(() => onSnapshot(query(collection(firebaseClient().db, `patients/${uid}/incidentStatuses`), orderBy('createdAt', 'desc'), limit(30)), snapshot => {
    setHistory(snapshot.docs.map(item => ({ ...item.data(), id: item.id }) as History));
  }, err => setError(readableError(err))), [uid]);
  useEffect(() => { if (card?.active) scroll.current?.scrollTo({ y: 0, animated: false }); }, [card?.active, card?.cardId]);
  const draft = profileDraft(fullName, allergies, phone);
  const profileSaved = profileMatchesSaved(draft, savedFingerprint);
  const dirty = loaded && !profileSaved;
  async function act(action: 'save' | 'issue' | 'revoke') {
    if (action === 'issue' && !profileSaved) { setError('Lưu thay đổi hồ sơ trước khi tạo mã QR.'); return; }
    setOperation(action); setFeedbackTarget(action === 'save' ? 'profile' : 'card');
    setBusy(true); setError(''); setMessage('');
    try {
      if (action === 'save') {
        await httpsCallable(firebaseClient().functions, 'savePatientProfile', { timeout: 15000 })(draft);
        setSavedFingerprint(JSON.stringify(draft)); setMessage('Đã lưu hồ sơ của bạn trên máy chủ.');
      } else if (action === 'issue') {
        await httpsCallable(firebaseClient().functions, 'issuePatientCard', { timeout: 15000 })({ shareProfile: share });
        setMessage('Đã phát hành thẻ. QR chỉ chứa đường dẫn báo hỗ trợ, không chứa hồ sơ sức khỏe.');
      } else {
        await httpsCallable(firebaseClient().functions, 'revokePatientCard', { timeout: 15000 })({ cardId: card?.cardId });
        setConfirmedRevoke(false); setMessage('Đã thu hồi thẻ. QR cũ không tạo được yêu cầu mới.');
      }
    } catch (err) { setError(readableError(err)); } finally { setBusy(false); setOperation(null); }
  }
  async function cancel(id: string) {
    setOperation('cancel'); setFeedbackTarget('incident');
    setBusy(true); setError(''); setMessage('');
    try { await httpsCallable(firebaseClient().functions, 'cancelPatientIncident', { timeout: 15000 })({ incidentId: id }); setMessage('Đã hủy yêu cầu chưa có TNV nhận.'); }
    catch (err) { setError(readableError(err)); } finally { setBusy(false); setOperation(null); }
  }
  const active = history.find(item => ['dispatching', 'accepted', 'arrived'].includes(item.status));
  const feedback = (target: string) => feedbackTarget === target ? <>{!!error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}{!!message && <Text accessibilityRole="alert" style={ui.success}>{message}</Text>}</> : null;
  const renderIncident = (item: History) => <View key={item.id} style={{ gap: 6, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#dce8e0' }}><Text style={{ fontWeight: '700' }}>{statusLabel[item.status] || item.status}</Text><Text style={ui.body}>Ca {item.id.slice(0, 10)} · {item.createdAt?.toDate().toLocaleString('vi-VN') || ''}</Text>{item.status === 'dispatching' && <Text style={ui.body}>{item.invitedCount ? 'Đã gửi lời mời; chưa đồng nghĩa đã có người nhận.' : 'Chưa có TNV phù hợp. Không chờ EHIS nếu cần dịch vụ cấp cứu.'}</Text>}{item.status === 'dispatching' && <ConfirmAction title="Hủy yêu cầu nhầm trước khi TNV nhận" explanation="Bạn muốn hủy yêu cầu này? Chỉ hủy nếu đã gửi nhầm hoặc không còn cần hỗ trợ qua EHIS." disabled={busy || !connected} onConfirm={() => cancel(item.id)} />}</View>;
  const cardPanel = <View style={ui.card}><Text style={ui.heading}>Thẻ QR của bạn</Text>
      {card?.active ? <>
        <Text style={ui.success}>Mã QR đang hoạt động</Text>{dirty && <Text style={ui.error}>Bạn đang sửa hồ sơ. QR hiện dùng thông tin đã lưu trên máy chủ; lưu thay đổi trước khi tiếp tục.</Text>}<Text style={ui.body}>{card.shareProfile ? 'Bạn cho phép TNV được phân công xem họ tên, dị ứng và liên hệ khẩn cấp trong ca đang hoạt động.' : 'Chỉ chia sẻ điểm hỗ trợ và báo cáo người chứng kiến; không cấp hồ sơ sức khỏe cho TNV.'}</Text>
        {!!cardUrl && <><View style={{ alignItems: 'center', padding: 12 }}><QRCode value={cardUrl} size={Math.min(210, Math.max(100, width - 150))} quietZone={12} /></View><Text selectable accessibilityLabel="Đường dẫn thẻ EHIS" style={ui.body}>{cardUrl}</Text><Button variant="secondary" title="Mở trang báo hỗ trợ từ QR" onPress={() => Linking.openURL(cardUrl).catch(() => setError('Chưa mở được trang thẻ.'))} /></>}
        {!validBase && <Text style={ui.error}>Chưa thiết lập được địa chỉ trang báo hỗ trợ. Liên hệ nhóm phụ trách trước khi sử dụng QR.</Text>}
        {active ? <Text style={ui.body}>Thẻ đang có ca hỗ trợ. Cần kết thúc/hủy ca trước khi thu hồi.</Text> : <><View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}><Switch accessibilityLabel="Xác nhận thu hồi thẻ" value={confirmedRevoke} onValueChange={setConfirmedRevoke} disabled={busy} /><Text style={{ flex: 1 }}>Tôi hiểu QR cũ sẽ ngừng hoạt động khi thu hồi.</Text></View><Button variant="secondary" title={operation === 'revoke' ? 'Đang vô hiệu hóa QR…' : 'Vô hiệu hóa mã QR này'} color="#a12626" disabled={busy || !connected || !confirmedRevoke} onPress={() => act('revoke')} /></>}
      </> : <>
        {!profileSaved && <Text style={ui.body}>Hãy lưu hồ sơ trước; nút tạo QR sẽ được mở sau khi máy chủ xác nhận.</Text>}
        <Text style={ui.body}>{card ? 'Thẻ trước đã thu hồi. Có thể phát hành thẻ mới với mã QR khác.' : 'Lưu hồ sơ rồi phát hành thẻ. Không đưa thông tin sức khỏe trực tiếp vào QR.'}</Text>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}><Switch accessibilityLabel="Cho phép TNV được phân công xem hồ sơ" value={share} onValueChange={setShare} disabled={busy} /><Text style={{ flex: 1 }}>Cho phép TNV đã nhận ca xem họ tên, dị ứng và số liên hệ khẩn cấp trong thời gian hỗ trợ.</Text></View>
        <Button title={operation === 'issue' ? 'Đang tạo mã QR…' : 'Tạo mã QR'} disabled={busy || !connected || !profileSaved || !validBase} onPress={() => act('issue')} />
        {!validBase && <Text style={ui.error}>Cần cấu hình địa chỉ website cho QR trước khi phát hành.</Text>}
      </>}
    {feedback('card')}</View>;
  return <ScrollView ref={scroll} contentContainerStyle={ui.page} keyboardShouldPersistTaps="handled">
    <Text style={ui.eyebrow}>EHIS · BỆNH NHÂN</Text><Text style={ui.title}>Thẻ sức khỏe của bạn</Text>
    {!connected && <Text accessibilityRole="alert" style={ui.error}>Đang chờ máy chủ. Thẻ và trạng thái lưu trên thiết bị có thể đã cũ.</Text>}
    {isLocalEmulator && <View style={ui.notice}><Text>Bản thử nghiệm · chỉ nhập hồ sơ giả. QR localhost chỉ dùng trên máy tính này; quét bằng điện thoại cần URL HTTPS truy cập được.</Text></View>}
    {isTrialMode && !isLocalEmulator && <View style={ui.notice}><Text>Thẻ dùng trong buổi chạy thử. Chỉ nhập hồ sơ giả; QR này mở website trực tuyến trên thiết bị khác.</Text></View>}
    {feedback('incident')}
    {active && <View style={ui.card}><Text style={ui.heading}>Yêu cầu đang diễn ra</Text>{renderIncident(active)}</View>}
    {card?.active && cardPanel}
    <View style={ui.card}><Text style={ui.heading}>Thông tin sức khỏe</Text>
      {profileFailed && <><Text accessibilityRole="alert" style={ui.error}>Chưa tải được hồ sơ. Tải lại trước khi chỉnh sửa để tránh ghi đè dữ liệu đã lưu.</Text><Button title="Tải lại hồ sơ" onPress={() => { setError(''); setProfileFailed(false); setProfileAttempt(value => value + 1); }} /></>}
      <Text style={ui.body}>Thông tin tự khai để hỗ trợ liên hệ, không phải hồ sơ đã được nhân viên y tế xác minh.</Text>
      <Text>Họ và tên</Text><TextInput accessibilityLabel="Họ tên bệnh nhân" value={fullName} onChangeText={setFullName} maxLength={100} style={ui.input} editable={loaded && !busy} />
      <Text>Dị ứng đã biết · ngăn cách bằng dấu phẩy</Text><TextInput accessibilityLabel="Dị ứng" value={allergies} onChangeText={setAllergies} multiline maxLength={2000} placeholder="Để trống nếu chưa khai báo" style={ui.input} editable={loaded && !busy} />
      <Text>Số liên hệ khẩn cấp · không bắt buộc</Text><TextInput accessibilityLabel="Số liên hệ khẩn cấp" value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={40} style={ui.input} editable={loaded && !busy} />
      {loaded && <Text accessibilityLiveRegion="polite" style={profileSaved ? ui.success : ui.body}>{profileSaved ? 'Hồ sơ đã lưu. Bạn có thể sử dụng thẻ QR.' : 'Có thông tin chưa lưu. Bấm Lưu hồ sơ trước khi sử dụng QR.'}</Text>}
      <Button title={operation === 'save' ? 'Đang lưu hồ sơ…' : 'Lưu hồ sơ'} disabled={!loaded || busy || !connected || !fullName.trim() || profileSaved} onPress={() => act('save')} />{feedback('profile')}
    </View>
    {!card?.active && cardPanel}

    {history.some(item => item.id !== active?.id) && <View style={ui.card}><Button variant="secondary" title={historyOpen ? 'Ẩn lịch sử hỗ trợ' : 'Xem lịch sử hỗ trợ'} onPress={() => setHistoryOpen(value => !value)} />{historyOpen && history.filter(item => item.id !== active?.id).map(renderIncident)}</View>}
    <AccountBar />
  </ScrollView>;
}
