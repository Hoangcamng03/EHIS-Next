import { Text } from './AppText';
import { Button } from './ActionButton';
import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { Redirect } from 'expo-router';
import { Linking, ScrollView, TextInput, View } from 'react-native';
import { createUserWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { callable, firebaseClient, isLocalEmulator, readableError, updateAvailability } from '../lib/firebase';
import { ui } from '../lib/ui';
import { accountPurposes, AccountPurpose } from '../lib/account-purpose';
import { PurposeChoices } from './PurposeChoices';
import { ReleaseStatus } from './ReleaseStatus';
import { InstallGuide } from './InstallGuide';
import { ToggleRow } from './ToggleRow';
import { InfoDisclosure } from './InfoDisclosure';

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
  return <ScrollView contentContainerStyle={ui.page} keyboardShouldPersistTaps="always" keyboardDismissMode="on-drag"><Text style={ui.title}>Hoàn tất thông tin tài khoản</Text><Text style={ui.body}>Chọn đối tượng một lần để mở đúng giao diện.</Text>{busy ? <Text>Đang lưu lựa chọn…</Text> : <PurposeChoices onChoose={choose} />}{!!error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}<AccountBar /></ScrollView>;
}
function AuthForm() {
  const [mode, setMode] = useState<'choose' | 'login' | 'register'>('login');
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
  return <ScrollView contentContainerStyle={ui.page} keyboardShouldPersistTaps="always" keyboardDismissMode="on-drag">
    <Text style={ui.eyebrow}>{mode === 'choose' ? 'EHIS · ĐĂNG KÝ · BƯỚC 1 / 2' : register ? 'EHIS · ĐĂNG KÝ · BƯỚC 2 / 2' : 'EHIS · THẺ SỨC KHỎE CÁ NHÂN'}</Text><Text style={ui.title}>{mode === 'choose' ? 'Bạn là ai?' : register && purpose ? `Đăng ký ${accountPurposes[purpose].title}` : 'Đăng nhập EHIS'}</Text>
    <Text style={ui.body}>{mode === 'choose' ? 'Chọn cách bạn muốn sử dụng EHIS.' : register ? 'Tạo tài khoản bằng email.' : 'Đăng nhập để mở thẻ QR hoặc nhận hỗ trợ.'}</Text>
    <View style={ui.notice}><Text style={ui.caption}>{isLocalEmulator ? "Thực hành trên máy tính · Chỉ dùng dữ liệu giả." : "Diễn tập có hướng dẫn · Chỉ dùng dữ liệu giả."}</Text></View>
    {mode === 'choose' ? <>
      <PurposeChoices onChoose={value => { changeMode('register'); setPurpose(value); }} />
      <Button variant="secondary" title="Đã có tài khoản? Đăng nhập" onPress={() => changeMode('login')} color="#526f67" />
    </> : <View style={ui.card}>
      {register && purpose && <View style={ui.notice}>
        <Text style={ui.heading}>Bạn chọn: {accountPurposes[purpose].title}</Text>
        <Text style={ui.body}>{accountPurposes[purpose].nextStep}</Text>
        <Button variant="secondary" title="Đổi lựa chọn" onPress={() => changeMode('choose')} disabled={busy} color="#526f67" />
      </View>}
      <Text>Email</Text><TextInput accessibilityLabel="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" style={ui.input} editable={!busy} />
      <Text>Mật khẩu{register ? ' · ít nhất 8 ký tự' : ''}</Text><TextInput accessibilityLabel="Mật khẩu" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} autoCapitalize="none" autoComplete={register ? 'new-password' : 'current-password'} style={ui.input} editable={!busy} />
      <Button variant="quiet" title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onPress={() => setShowPassword(value => !value)} disabled={busy} color="#526f67" />
      {register && <View style={{ gap: 10 }}><Button variant="quiet" title="Dữ liệu và quyền riêng tư" onPress={() => Linking.openURL(`${process.env.EXPO_PUBLIC_BYSTANDER_URL || 'https://ehis-next-20261021-hc03.web.app'}/privacy`)} color="#526f67" /><ToggleRow accessibilityLabel="Xác nhận đã đọc thông tin thử nghiệm" label="Tôi đã đọc thông tin dữ liệu và phạm vi diễn tập." value={acknowledged} onValueChange={setAcknowledged} disabled={busy} /></View>}
      <Button loading={busy} title={busy ? 'Đang xử lý…' : register ? 'Tạo tài khoản' : 'Đăng nhập'} onPress={submit} disabled={busy || !email.trim() || !password || (register && (!purpose || !acknowledged))} />
      <Button variant="secondary" title={register ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký'} onPress={() => changeMode(register ? 'login' : 'choose')} disabled={busy} color="#526f67" />
      {!register && <Button variant="secondary" title="Quên mật khẩu" onPress={resetPassword} disabled={busy} color="#526f67" />}
      {!!error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}
      {!!message && <Text accessibilityRole="alert" style={ui.success}>{message}</Text>}
    </View>}
    <InfoDisclosure title="Cách dùng EHIS"><Text style={ui.body}>Người qua đường quét QR để báo hỗ trợ trên web. TNV cần được duyệt trước khi nhận ca. Đây là đợt diễn tập, chưa tiếp nhận cấp cứu thật.</Text><InstallGuide /></InfoDisclosure>
    <ReleaseStatus />
  </ScrollView>;
}
export function AccountBar() {
  const [open, setOpen] = useState(false);
  const { user } = useSession();
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function logout() {
    setBusy(true); setError('');
    try { await updateAvailability({ available: false }, 4000).catch(() => undefined); await signOut(firebaseClient().auth); }
    catch (err) { setError(readableError(err)); } finally { setBusy(false); }
  }
  return <View style={ui.card}><Button variant="secondary" title={open ? 'Ẩn tài khoản và cài đặt' : 'Tài khoản và cài đặt'} onPress={() => setOpen(value => !value)} />{open && <><Text style={ui.body}>{user?.email}</Text><ReleaseStatus /><Button variant="secondary" title={busy ? 'Đang đăng xuất…' : 'Đăng xuất'} onPress={logout} disabled={busy} color="#526f67" />{!!error && <Text style={ui.error}>{error}</Text>}<InstallGuide compact /></>}</View>;
}
