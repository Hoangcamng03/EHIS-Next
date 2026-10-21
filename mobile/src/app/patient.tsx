import { useEffect, useState } from 'react';
import { Button, Linking, Platform, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { Link } from 'expo-router';
import { collection, doc, getDoc, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import QRCode from 'react-native-qrcode-svg';
import { AuthGate, AccountBar } from '../components/Session';
import { firebaseClient, isLocalEmulator, readableError } from '../lib/firebase';
import { ui, statusLabel } from '../lib/ui';

type Card = { cardId: string; active: boolean; shareProfile: boolean };
type History = { id: string; status: string; createdAt?: { toDate(): Date }; invitedCount?: number };
export default function PatientScreen() { return <AuthGate>{user => <PatientDashboard key={user.uid} uid={user.uid} />}</AuthGate>; }
function PatientDashboard({ uid }: { uid: string }) {
  const [fullName, setFullName] = useState(''), [allergies, setAllergies] = useState(''), [phone, setPhone] = useState('');
  const [loaded, setLoaded] = useState(false), [savedProfile, setSavedProfile] = useState(false);
  const [card, setCard] = useState<Card>(), [history, setHistory] = useState<History[]>([]);
  const [share, setShare] = useState(false), [confirmedRevoke, setConfirmedRevoke] = useState(false);
  const [connected, setConnected] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('');
  const configuredUrl = process.env.EXPO_PUBLIC_BYSTANDER_URL;
  const base = configuredUrl || (isLocalEmulator && Platform.OS === 'web' ? 'http://localhost:3100' : '');
  let validBase = false;
  try { const url = new URL(base); validBase = !url.username && !url.password && !url.search && !url.hash && (url.protocol === 'https:' || (isLocalEmulator && url.protocol === 'http:')); } catch { /* Display setup message instead of a broken QR. */ }
  const cardUrl = validBase && card?.active ? `${base.replace(/\/+$/, '')}/c/${card.cardId}` : '';
  useEffect(() => {
    let cancelled = false;
    getDoc(doc(firebaseClient().db, `patients/${uid}`)).then(snapshot => {
      if (cancelled) return;
      const value = snapshot.data();
      setFullName(value?.fullName || ''); setAllergies((value?.allergies || []).join(', ')); setPhone(value?.emergencyContactPhone || '');
      setSavedProfile(snapshot.exists()); setLoaded(true);
    }).catch(err => { if (!cancelled) { setError(readableError(err)); setLoaded(true); } });
    return () => { cancelled = true; };
  }, [uid]);
  useEffect(() => onSnapshot(doc(firebaseClient().db, `patientCards/${uid}`), { includeMetadataChanges: true }, snapshot => {
    setConnected(!snapshot.metadata.fromCache); setCard(snapshot.exists() ? snapshot.data() as Card : undefined);
  }, err => { setConnected(false); setError(readableError(err)); }), [uid]);
  useEffect(() => onSnapshot(query(collection(firebaseClient().db, `patients/${uid}/incidentStatuses`), orderBy('createdAt', 'desc'), limit(30)), snapshot => {
    setHistory(snapshot.docs.map(item => ({ ...item.data(), id: item.id }) as History));
  }, err => setError(readableError(err))), [uid]);
  async function act(action: 'save' | 'issue' | 'revoke') {
    setBusy(true); setError(''); setMessage('');
    try {
      if (action === 'save') {
        await httpsCallable(firebaseClient().functions, 'savePatientProfile', { timeout: 15000 })({ fullName: fullName.trim(), allergies: allergies.split(',').map(item => item.trim()).filter(Boolean), emergencyContactPhone: phone.replace(/[\s().-]/g, '') });
        setSavedProfile(true); setMessage('Đã lưu hồ sơ của bạn trên máy chủ.');
      } else if (action === 'issue') {
        await httpsCallable(firebaseClient().functions, 'issuePatientCard', { timeout: 15000 })({ shareProfile: share });
        setMessage('Đã phát hành thẻ. QR chỉ chứa đường dẫn báo hỗ trợ, không chứa hồ sơ sức khỏe.');
      } else {
        await httpsCallable(firebaseClient().functions, 'revokePatientCard', { timeout: 15000 })({ cardId: card?.cardId });
        setConfirmedRevoke(false); setMessage('Đã thu hồi thẻ. QR cũ không tạo được yêu cầu mới.');
      }
    } catch (err) { setError(readableError(err)); } finally { setBusy(false); }
  }
  async function cancel(id: string) {
    setBusy(true); setError(''); setMessage('');
    try { await httpsCallable(firebaseClient().functions, 'cancelPatientIncident', { timeout: 15000 })({ incidentId: id }); setMessage('Đã hủy yêu cầu chưa có TNV nhận.'); }
    catch (err) { setError(readableError(err)); } finally { setBusy(false); }
  }
  const active = history.find(item => ['dispatching', 'accepted', 'arrived'].includes(item.status));
  return <ScrollView contentContainerStyle={ui.page} keyboardShouldPersistTaps="handled">
    <Text style={ui.eyebrow}>EHIS · BỆNH NHÂN</Text><Text style={ui.title}>Thẻ sức khỏe của bạn</Text>
    <Link href="/" style={ui.link}>← Chuyển khu vực</Link><AccountBar />
    {!connected && <Text accessibilityRole="alert" style={ui.error}>Đang chờ máy chủ. Thẻ và trạng thái lưu trên thiết bị có thể đã cũ.</Text>}
    {isLocalEmulator && <View style={ui.notice}><Text>Bản thử nghiệm · chỉ nhập hồ sơ giả. QR localhost chỉ dùng trên máy tính này; quét bằng điện thoại cần URL HTTPS truy cập được.</Text></View>}
    <View style={ui.card}><Text style={ui.heading}>1. Hồ sơ sức khỏe</Text>
      <Text style={ui.body}>Thông tin tự khai để hỗ trợ liên hệ, không phải hồ sơ đã được nhân viên y tế xác minh.</Text>
      <Text>Họ và tên</Text><TextInput accessibilityLabel="Họ tên bệnh nhân" value={fullName} onChangeText={setFullName} maxLength={100} style={ui.input} editable={loaded && !busy} />
      <Text>Dị ứng đã biết · ngăn cách bằng dấu phẩy</Text><TextInput accessibilityLabel="Dị ứng" value={allergies} onChangeText={setAllergies} multiline maxLength={2000} placeholder="Để trống nếu chưa khai báo" style={ui.input} editable={loaded && !busy} />
      <Text>Số liên hệ khẩn cấp · không bắt buộc</Text><TextInput accessibilityLabel="Số liên hệ khẩn cấp" value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={40} style={ui.input} editable={loaded && !busy} />
      <Button title={busy ? 'Đang xử lý…' : 'Lưu hồ sơ'} disabled={!loaded || busy || !connected || !fullName.trim()} onPress={() => act('save')} />
    </View>
    <View style={ui.card}><Text style={ui.heading}>2. Thẻ EHIS</Text>
      {card?.active ? <>
        <Text style={ui.success}>Thẻ đang hoạt động</Text><Text style={ui.body}>{card.shareProfile ? 'Bạn cho phép TNV được phân công xem họ tên, dị ứng và liên hệ khẩn cấp trong ca đang hoạt động.' : 'Chỉ chia sẻ điểm hỗ trợ và báo cáo người chứng kiến; không cấp hồ sơ sức khỏe cho TNV.'}</Text>
        {!!cardUrl && <><View style={{ alignItems: 'center', padding: 12 }}><QRCode value={cardUrl} size={210} quietZone={12} /></View><Text selectable accessibilityLabel="Đường dẫn thẻ EHIS" style={ui.body}>{cardUrl}</Text><Button title="Mở trang thẻ để kiểm tra" onPress={() => Linking.openURL(cardUrl).catch(() => setError('Chưa mở được trang thẻ.'))} /></>}
        {!validBase && <Text style={ui.error}>Chưa cấu hình địa chỉ website hợp lệ cho QR. Cần cấu hình EXPO_PUBLIC_BYSTANDER_URL trước khi dùng thẻ.</Text>}
        {active ? <Text style={ui.body}>Thẻ đang có ca hỗ trợ. Cần kết thúc/hủy ca trước khi thu hồi.</Text> : <><View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}><Switch accessibilityLabel="Xác nhận thu hồi thẻ" value={confirmedRevoke} onValueChange={setConfirmedRevoke} disabled={busy} /><Text style={{ flex: 1 }}>Tôi hiểu QR cũ sẽ ngừng hoạt động khi thu hồi.</Text></View><Button title="Thu hồi thẻ hiện tại" color="#a12626" disabled={busy || !connected || !confirmedRevoke} onPress={() => act('revoke')} /></>}
      </> : <>
        <Text style={ui.body}>{card ? 'Thẻ trước đã thu hồi. Có thể phát hành thẻ mới với mã QR khác.' : 'Lưu hồ sơ rồi phát hành thẻ. Không đưa thông tin sức khỏe trực tiếp vào QR.'}</Text>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}><Switch accessibilityLabel="Cho phép TNV được phân công xem hồ sơ" value={share} onValueChange={setShare} disabled={busy} /><Text style={{ flex: 1 }}>Cho phép TNV đã nhận ca xem họ tên, dị ứng và số liên hệ khẩn cấp trong thời gian hỗ trợ.</Text></View>
        <Button title="Phát hành thẻ QR" disabled={busy || !connected || !savedProfile || !validBase} onPress={() => act('issue')} />
        {!validBase && <Text style={ui.error}>Cần cấu hình địa chỉ website cho QR trước khi phát hành.</Text>}
      </>}
    </View>
    {!!error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}{!!message && <Text accessibilityRole="alert" style={ui.success}>{message}</Text>}
    <View style={ui.card}><Text style={ui.heading}>3. Ca hỗ trợ và lịch sử</Text>
      {!history.length && <Text style={ui.body}>Chưa có ca từ thẻ của bạn. Khi người báo gửi yêu cầu, trạng thái sẽ xuất hiện ở đây.</Text>}
      {history.map(item => <View key={item.id} style={{ gap: 6, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#dce8e0' }}><Text style={{ fontWeight: '700' }}>{statusLabel[item.status] || item.status}</Text><Text style={ui.body}>Ca {item.id.slice(0, 10)} · {item.createdAt?.toDate().toLocaleString('vi-VN') || ''}</Text>{item.status === 'dispatching' && <Text style={ui.body}>{item.invitedCount ? 'Đã gửi lời mời; chưa đồng nghĩa đã có người nhận.' : 'Chưa có TNV phù hợp. Không chờ EHIS nếu cần dịch vụ cấp cứu.'}</Text>}{item.status === 'dispatching' && <Button title="Hủy yêu cầu nhầm trước khi TNV nhận" disabled={busy || !connected} onPress={() => cancel(item.id)} color="#a12626" />}</View>)}
    </View>
  </ScrollView>;
}
