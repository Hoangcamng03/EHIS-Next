import { Text } from './AppText';
import { Button } from './ActionButton';
import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { Redirect } from 'expo-router';
import { Linking, ScrollView, Switch, TextInput, View } from 'react-native';
import { createUserWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { callable, firebaseClient, isLocalEmulator, readableError, updateAvailability } from '../lib/firebase';
import { ui } from '../lib/ui';
import { accountPurposes, AccountPurpose } from '../lib/account-purpose';
import { PurposeChoices } from './PurposeChoices';
import { ReleaseStatus } from './ReleaseStatus';
import { InstallGuide } from './InstallGuide';

type SessionState = { user: User | null; purpose: AccountPurpose | null; loading: boolean; error: string };
type SessionActions = { prepareRegistration(purpose: AccountPurpose): void; cancelRegistration(): void; refresh(): void; completePurpose(purpose: AccountPurpose): Promise<void> };
const SessionContext = createContext<SessionState & SessionActions>({ user: null, purpose: null, loading: true, error: '', prepareRegistration: () => {}, cancelRegistration: () => {}, refresh: () => {}, completePurpose: async () => {} });
export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({ user: null, purpose: null, loading: true, error: '' });
  const registrationPurpose = useRef<AccountPurpose | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let unsubscribe: (() => void) | undefined, cancelled = false, revision = 0;
    Promise.resolve().then(() => {
      if (!cancelled) unsubscribe = onAuthStateChanged(firebaseClient().auth, async user => {
        const current = ++revision;
        const registeredUser = user && !user.isAnonymous ? user : null;
        setState({ user: registeredUser, purpose: null, loading: !!registeredUser, error: '' });
        if (!registeredUser) return;
        try {
          const functions = firebaseClient().functions;
          const pending = registrationPurpose.current;
          if (pending) await callable(functions, 'setAccountPurpose', { timeout: 15000 })({ purpose: pending });
          const access = await callable<unknown, { accountPurpose: AccountPurpose | null }>(functions, 'getMyAccess', { timeout: 15000 })({});
          if (!cancelled && current === revision) {
            registrationPurpose.current = null;
            setState({ user: registeredUser, purpose: access.data.accountPurpose, loading: false, error: '' });
          }
        } catch (error) {
          if (!cancelled && current === revision) setState({ user: registeredUser, purpose: null, loading: false, error: readableError(error) });
        }
      });
    }).catch(error => { if (!cancelled) setState({ user: null, purpose: null, loading: false, error: readableError(error) }); });
    return () => { cancelled = true; unsubscribe?.(); };
  }, [attempt]);
  async function completePurpose(purpose: AccountPurpose) {
    await callable(firebaseClient().functions, 'setAccountPurpose', { timeout: 15000 })({ purpose });
    setAttempt(value => value + 1);
  }
  return <SessionContext.Provider value={{ ...state, prepareRegistration: purpose => { registrationPurpose.current = purpose; }, cancelRegistration: () => { registrationPurpose.current = null; }, refresh: () => setAttempt(value => value + 1), completePurpose }}>{children}</SessionContext.Provider>;
}
export function useSession() { return useContext(SessionContext); }
export function AuthGate({ children, purpose: requiredPurpose }: { children(user: User): ReactNode; purpose?: AccountPurpose }) {
  const { user, purpose, loading, error, refresh } = useSession();
  if (loading) return <View style={ui.page}><Text>Đang khôi phục phiên đăng nhập…</Text></View>;
  if (error) return <View style={ui.page}><Text accessibilityRole="alert" style={ui.error}>{error}</Text><Text>Chưa tải được thông tin tài khoản. Kiểm tra Internet rồi thử lại; không cần đăng ký lại.</Text><Button title="Thử tải lại tài khoản" onPress={refresh} /><Button title="Đăng xuất" onPress={() => signOut(firebaseClient().auth)} /></View>;
  if (user && !purpose) return <CompletePurpose />;
  if (user && requiredPurpose && purpose && requiredPurpose !== purpose) return <Redirect href={accountPurposes[purpose].route} />;
  return user ? children(user) : <AuthForm />;
}
function CompletePurpose() {
  const { completePurpose } = useSession();
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function choose(purpose: AccountPurpose) {
    if (busy) return;
    setBusy(true); setError('');
    try { await completePurpose(purpose); } catch (err) { setError(readableError(err)); } finally { setBusy(false); }
  }
  return <ScrollView contentContainerStyle={ui.page}><Text style={ui.title}>Hoàn tất thông tin tài khoản</Text><Text style={ui.body}>Tài khoản cũ chưa lưu đối tượng sử dụng. Chọn một lần; các lần đăng nhập sau EHIS sẽ mở đúng giao diện.</Text>{busy ? <Text>Đang lưu lựa chọn…</Text> : <PurposeChoices onChoose={choose} />}{!!error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}<AccountBar /></ScrollView>;
}
function AuthForm() {
  const [mode, setMode] = useState<'choose' | 'login' | 'register'>('choose');
  const [purpose, setPurpose] = useState<AccountPurpose | null>(null);
  const [email, setEmail] = useState(''), [password, setPassword] = useState('');
  const { prepareRegistration, cancelRegistration } = useSession();
  const register = mode === 'register';
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false), [message, setMessage] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  function changeMode(next: 'choose' | 'login' | 'register') {
    setMode(next); setError(''); setMessage(''); setPassword(''); setShowPassword(false); cancelRegistration();
    if (next === 'choose') setPurpose(null);
  }
  async function resetPassword() {
    if (!email.trim()) { setError('Nhập email của bạn trước, rồi chọn Quên mật khẩu.'); return; }
    setBusy(true); setError(''); setMessage('');
    try { await sendPasswordResetEmail(firebaseClient().auth, email.trim()); setMessage('Nếu email có tài khoản, bạn sẽ nhận được thư đặt lại mật khẩu. Kiểm tra cả thư rác.'); }
    catch { setMessage('Nếu email có tài khoản, bạn sẽ nhận được thư đặt lại mật khẩu. Nếu chưa nhận được, kiểm tra địa chỉ email và kết nối.'); }
    finally { setBusy(false); }
  }
  async function submit() {
    if (register && !purpose) { setError('Chọn Bệnh nhân hoặc Tình nguyện viên trước khi tạo tài khoản.'); return; }
    if (register && password.length < 8) { setError('Dùng mật khẩu ít nhất 8 ký tự.'); return; }
    if (register && !acknowledged) { setError('Đọc thông tin thử nghiệm và xác nhận trước khi tạo tài khoản.'); return; }
    setBusy(true); setError(''); setMessage('');
    try {
      const auth = firebaseClient().auth;
      if (register && purpose) {
        prepareRegistration(purpose);
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      } else {
        cancelRegistration();
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
      setPassword('');
    } catch (err) { cancelRegistration(); setError(readableError(err)); } finally { setBusy(false); }
  }
  return <ScrollView contentContainerStyle={ui.page} keyboardShouldPersistTaps="handled">
    <Text style={ui.eyebrow}>{mode === 'choose' ? 'EHIS · ĐĂNG KÝ · BƯỚC 1 / 2' : register ? 'EHIS · ĐĂNG KÝ · BƯỚC 2 / 2' : 'EHIS · THẺ SỨC KHỎE CÁ NHÂN'}</Text><Text style={ui.title}>{mode === 'choose' ? 'Bạn muốn dùng EHIS để làm gì?' : register && purpose ? `Đăng ký ${accountPurposes[purpose].title}` : 'Chào bạn.'}</Text>
    <Text style={ui.body}>{mode === 'choose' ? 'Chọn đối tượng khi đăng ký. EHIS ghi nhớ và mở đúng giao diện sau mỗi lần đăng nhập.' : 'EHIS tự mở khu vực đã đăng ký. Tình nguyện viên cần được xét duyệt trước khi nhận ca.'}</Text>
    <View style={ui.notice}><Text>{isLocalEmulator ? 'Môi trường thực hành trên máy tính · dữ liệu giả.' : 'Đăng ký tham gia đợt thử nghiệm có hướng dẫn. Tài khoản và dữ liệu được lưu trên máy chủ.'}</Text><Text>Chỉ nhập dữ liệu giả trong đợt nghiệm thu phần mềm; chưa dùng để yêu cầu cấp cứu thật.</Text></View>
    {mode === 'choose' ? <>
      <PurposeChoices onChoose={value => { changeMode('register'); setPurpose(value); }} />
      <Button title="Đã có tài khoản? Đăng nhập" onPress={() => changeMode('login')} color="#526f67" />
    </> : <View style={ui.card}>
      {register && purpose && <View style={ui.notice}>
        <Text style={ui.heading}>Bạn chọn: {accountPurposes[purpose].title}</Text>
        <Text style={ui.body}>{accountPurposes[purpose].nextStep}</Text>
        <Button title="Đổi lựa chọn" onPress={() => changeMode('choose')} disabled={busy} color="#526f67" />
      </View>}
      <Text style={ui.heading}>{register ? '2. Tạo tài khoản bằng email' : 'Đăng nhập EHIS'}</Text>
      <Text>Email</Text><TextInput accessibilityLabel="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" style={ui.input} editable={!busy} />
      <Text>Mật khẩu{register ? ' · ít nhất 8 ký tự' : ''}</Text><TextInput accessibilityLabel="Mật khẩu" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} autoCapitalize="none" autoComplete={register ? 'new-password' : 'current-password'} style={ui.input} editable={!busy} />
      <Button title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu để kiểm tra'} onPress={() => setShowPassword(value => !value)} disabled={busy} color="#526f67" />
      {register && <View style={{ gap: 10 }}><Button title="Đọc cách lưu dữ liệu và giới hạn sử dụng" onPress={() => Linking.openURL(`${process.env.EXPO_PUBLIC_BYSTANDER_URL || 'https://ehis-next-20261021-hc03.web.app'}/privacy`)} color="#526f67" /><View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><Switch accessibilityLabel="Xác nhận đã đọc thông tin thử nghiệm" value={acknowledged} onValueChange={setAcknowledged} disabled={busy} /><Text style={[ui.body, { flex: 1 }]}>Tôi đã đọc thông tin dữ liệu và hiểu phạm vi thử nghiệm có hướng dẫn.</Text></View></View>}
      <Button title={busy ? 'Đang xử lý…' : register ? `Tạo tài khoản ${purpose ? accountPurposes[purpose].title : 'EHIS'}` : 'Đăng nhập'} onPress={submit} disabled={busy || !email.trim() || !password || (register && (!purpose || !acknowledged))} />
      <Button title={register ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký'} onPress={() => changeMode(register ? 'login' : 'choose')} disabled={busy} color="#526f67" />
      {!register && <Button title="Quên mật khẩu" onPress={resetPassword} disabled={busy} color="#526f67" />}
      {!!error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}
      {!!message && <Text accessibilityRole="alert" style={ui.success}>{message}</Text>}
    </View>}
    <Text style={ui.body}>Không cần cài app để báo hỗ trợ: người qua đường quét thẻ QR và dùng website.</Text>
    <InstallGuide />
    <ReleaseStatus />
  </ScrollView>;
}
export function AccountBar() {
  const { user } = useSession();
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function logout() {
    setBusy(true); setError('');
    try { await updateAvailability({ available: false }, 4000).catch(() => undefined); await signOut(firebaseClient().auth); }
    catch (err) { setError(readableError(err)); } finally { setBusy(false); }
  }
  return <View style={{ gap: 8 }}><Text style={ui.body}>{user?.email}</Text><ReleaseStatus /><Button title={busy ? 'Đang đăng xuất…' : 'Đăng xuất'} onPress={logout} disabled={busy} color="#526f67" />{!!error && <Text style={ui.error}>{error}</Text>}<InstallGuide /></View>;
}
