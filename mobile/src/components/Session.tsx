import { Text } from './AppText';
import { Button } from './ActionButton';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { createUserWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { firebaseClient, isLocalEmulator, isTrialMode, readableError, updateAvailability } from '../lib/firebase';
import { ui } from '../lib/ui';

const SessionContext = createContext<{ user: User | null; loading: boolean; error: string }>({ user: null, loading: true, error: '' });
export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ user: User | null; loading: boolean; error: string }>({ user: null, loading: true, error: '' });
  useEffect(() => {
    let unsubscribe: (() => void) | undefined, cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) unsubscribe = onAuthStateChanged(firebaseClient().auth, user => setState({ user: user && !user.isAnonymous ? user : null, loading: false, error: '' }));
    }).catch(error => { if (!cancelled) setState({ user: null, loading: false, error: readableError(error) }); });
    return () => { cancelled = true; unsubscribe?.(); };
  }, []);
  return <SessionContext.Provider value={state}>{children}</SessionContext.Provider>;
}
export function useSession() { return useContext(SessionContext); }
export function AuthGate({ children }: { children(user: User): ReactNode }) {
  const { user, loading, error } = useSession();
  if (loading) return <View style={ui.page}><Text>Đang khôi phục phiên đăng nhập…</Text></View>;
  if (error) return <View style={ui.page}><Text accessibilityRole="alert" style={ui.error}>{error}</Text></View>;
  return user ? children(user) : <AuthForm />;
}
function AuthForm() {
  const [register, setRegister] = useState(false), [email, setEmail] = useState(''), [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false), [message, setMessage] = useState('');
  async function resetPassword() {
    if (!email.trim()) { setError('Nhập email của bạn trước, rồi chọn Quên mật khẩu.'); return; }
    setBusy(true); setError(''); setMessage('');
    try { await sendPasswordResetEmail(firebaseClient().auth, email.trim()); setMessage('Nếu email có tài khoản, bạn sẽ nhận được thư đặt lại mật khẩu. Kiểm tra cả thư rác.'); }
    catch { setMessage('Nếu email có tài khoản, bạn sẽ nhận được thư đặt lại mật khẩu. Nếu chưa nhận được, kiểm tra địa chỉ email và kết nối.'); }
    finally { setBusy(false); }
  }
  async function submit() {
    if (register && password.length < 8) { setError('Dùng mật khẩu ít nhất 8 ký tự.'); return; }
    setBusy(true); setError(''); setMessage('');
    try {
      const auth = firebaseClient().auth;
      if (register) await createUserWithEmailAndPassword(auth, email.trim(), password);
      else await signInWithEmailAndPassword(auth, email.trim(), password);
      setPassword('');
    } catch (err) { setError(readableError(err)); } finally { setBusy(false); }
  }
  return <ScrollView contentContainerStyle={ui.page} keyboardShouldPersistTaps="handled">
    <Text style={ui.eyebrow}>EHIS · THẺ SỨC KHỎE CÁ NHÂN</Text><Text style={ui.title}>{register ? 'Tạo tài khoản' : 'Chào bạn.'}</Text>
    <Text style={ui.body}>Một tài khoản để quản lý thẻ sức khỏe và tham gia hỗ trợ cộng đồng. Quyền TNV cần được xét duyệt riêng.</Text>
    {isLocalEmulator && <View style={ui.notice}><Text>Bản thử nghiệm trên máy tính · chỉ nhập dữ liệu giả. Dữ liệu nằm trong Emulator.</Text></View>}
    {isTrialMode && !isLocalEmulator && <View style={ui.notice}><Text>Buổi chạy thử EHIS · chỉ nhập thông tin và tình huống giả. Dữ liệu thử được lưu trực tuyến.</Text></View>}
    <View style={ui.card}>
      <Text style={ui.heading}>{register ? 'Đăng ký bằng email' : 'Đăng nhập EHIS'}</Text>
      <Text>Email</Text><TextInput accessibilityLabel="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" style={ui.input} editable={!busy} />
      <Text>Mật khẩu{register ? ' · ít nhất 8 ký tự' : ''}</Text><TextInput accessibilityLabel="Mật khẩu" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} autoCapitalize="none" autoComplete={register ? 'new-password' : 'current-password'} style={ui.input} editable={!busy} />
      <Button title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu để kiểm tra'} onPress={() => setShowPassword(value => !value)} disabled={busy} color="#526f67" />
      <Button title={busy ? 'Đang xử lý…' : register ? 'Tạo tài khoản EHIS' : 'Đăng nhập'} onPress={submit} disabled={busy || !email.trim() || !password} />
      <Button title={register ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký'} onPress={() => { setRegister(!register); setError(''); setPassword(''); }} disabled={busy} color="#526f67" />
      {!register && <Button title="Quên mật khẩu" onPress={resetPassword} disabled={busy} color="#526f67" />}
      {!!error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}
      {!!message && <Text accessibilityRole="alert" style={ui.success}>{message}</Text>}
    </View><Text style={ui.body}>Không cần cài app để báo hỗ trợ: người qua đường quét thẻ QR và dùng website.</Text>
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
