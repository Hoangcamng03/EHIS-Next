import { Text } from './AppText';
import { Button } from './ActionButton';
import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { ScrollView, TextInput, View } from 'react-native';
import { createUserWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { firebaseClient, isLocalEmulator, isTrialMode, readableError, updateAvailability } from '../lib/firebase';
import { ui } from '../lib/ui';
import { accountPurposes, AccountPurpose } from '../lib/account-purpose';
import { PurposeChoices } from './PurposeChoices';

type SessionState = { user: User | null; loading: boolean; error: string };
const SessionContext = createContext<SessionState & { prepareRegistration(purpose: AccountPurpose): void; cancelRegistration(): void }>({ user: null, loading: true, error: '', prepareRegistration: () => {}, cancelRegistration: () => {} });
export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({ user: null, loading: true, error: '' });
  const registrationPurpose = useRef<AccountPurpose | null>(null);
  const router = useRouter();
  useEffect(() => {
    let unsubscribe: (() => void) | undefined, cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) unsubscribe = onAuthStateChanged(firebaseClient().auth, user => {
        const registeredUser = user && !user.isAnonymous ? user : null;
        setState({ user: registeredUser, loading: false, error: '' });
        // Auth can notify before the signup promise resolves and unmount AuthForm.
        // Keep the pending intent in the provider so the destination survives that race.
        if (registeredUser && registrationPurpose.current) {
          const purpose = registrationPurpose.current;
          registrationPurpose.current = null;
          router.replace(accountPurposes[purpose].route);
        }
      });
    }).catch(error => { if (!cancelled) setState({ user: null, loading: false, error: readableError(error) }); });
    return () => { cancelled = true; unsubscribe?.(); };
  }, [router]);
  return <SessionContext.Provider value={{ ...state, prepareRegistration: purpose => { registrationPurpose.current = purpose; }, cancelRegistration: () => { registrationPurpose.current = null; } }}>{children}</SessionContext.Provider>;
}
export function useSession() { return useContext(SessionContext); }
export function AuthGate({ children }: { children(user: User): ReactNode }) {
  const { user, loading, error } = useSession();
  if (loading) return <View style={ui.page}><Text>Đang khôi phục phiên đăng nhập…</Text></View>;
  if (error) return <View style={ui.page}><Text accessibilityRole="alert" style={ui.error}>{error}</Text></View>;
  return user ? children(user) : <AuthForm />;
}
function AuthForm() {
  const [mode, setMode] = useState<'choose' | 'login' | 'register'>('choose');
  const [purpose, setPurpose] = useState<AccountPurpose | null>(null);
  const [email, setEmail] = useState(''), [password, setPassword] = useState('');
  const { prepareRegistration, cancelRegistration } = useSession();
  const register = mode === 'register';
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false), [message, setMessage] = useState('');
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
    <Text style={ui.body}>{mode === 'choose' ? 'Chọn một mục để đăng ký. Bạn có thể dùng cả hai khu vực sau này.' : 'Một tài khoản dùng cho cả hai khu vực. Quyền nhận ca của tình nguyện viên cần được xét duyệt riêng.'}</Text>
    {mode !== 'choose' && isTrialMode && <View style={ui.notice}><Text>{isLocalEmulator ? 'Bản thử nghiệm trên máy tính · chỉ nhập dữ liệu giả. Dữ liệu nằm trong Emulator.' : 'Buổi chạy thử EHIS · chỉ nhập thông tin và tình huống giả. Dữ liệu thử được lưu trực tuyến.'}</Text></View>}
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
      <Button title={busy ? 'Đang xử lý…' : register ? `Tạo tài khoản ${purpose ? accountPurposes[purpose].title : 'EHIS'}` : 'Đăng nhập'} onPress={submit} disabled={busy || !email.trim() || !password || (register && !purpose)} />
      <Button title={register ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký'} onPress={() => changeMode(register ? 'login' : 'choose')} disabled={busy} color="#526f67" />
      {!register && <Button title="Quên mật khẩu" onPress={resetPassword} disabled={busy} color="#526f67" />}
      {!!error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}
      {!!message && <Text accessibilityRole="alert" style={ui.success}>{message}</Text>}
    </View>}
    {mode === 'choose' && isTrialMode && <View style={ui.notice}><Text>Buổi chạy thử · chỉ dùng thông tin giả.</Text></View>}
    <Text style={ui.body}>Không cần cài app để báo hỗ trợ: người qua đường quét thẻ QR và dùng website.</Text>
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
  return <View style={{ gap: 8 }}><Text style={ui.body}>{user?.email}</Text><Button title={busy ? 'Đang đăng xuất…' : 'Đăng xuất'} onPress={logout} disabled={busy} color="#526f67" />{!!error && <Text style={ui.error}>{error}</Text>}</View>;
}
