import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Button, ScrollView, Text, TextInput, View } from 'react-native';
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { firebaseClient, isLocalEmulator, readableError, updateAvailability } from '../lib/firebase';
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
  async function submit() {
    if (register && password.length < 8) { setError('Dùng mật khẩu ít nhất 8 ký tự.'); return; }
    setBusy(true); setError('');
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
    <View style={ui.card}>
      <Text style={ui.heading}>{register ? 'Đăng ký bằng email' : 'Đăng nhập EHIS'}</Text>
      <Text>Email</Text><TextInput accessibilityLabel="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" style={ui.input} editable={!busy} />
      <Text>Mật khẩu{register ? ' · ít nhất 8 ký tự' : ''}</Text><TextInput accessibilityLabel="Mật khẩu" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" style={ui.input} editable={!busy} />
      <Button title={busy ? 'Đang xử lý…' : register ? 'Tạo tài khoản EHIS' : 'Đăng nhập'} onPress={submit} disabled={busy || !email.trim() || !password} />
      <Button title={register ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký'} onPress={() => { setRegister(!register); setError(''); setPassword(''); }} disabled={busy} color="#526f67" />
      {!!error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}
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
