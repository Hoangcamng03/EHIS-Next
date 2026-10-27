'use client';
import { useEffect, useState } from 'react';
import { browserSessionPersistence, onAuthStateChanged, setPersistence, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';

import { callable as httpsCallable, adminClient } from '@/lib/firebase-client';

type Application = { uid: string; fullName: string; phone: string; experience: string };
export function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null), [admin, setAdmin] = useState(false), [ready, setReady] = useState(false);
  const [email, setEmail] = useState(''), [password, setPassword] = useState(''), [error, setError] = useState(''), [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false), [items, setItems] = useState<Application[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [review, setReview] = useState<{ uid: string; decision: 'approved' | 'rejected' } | null>(null);
  useEffect(() => {
    let cancelled = false;
    const client = adminClient();
    const unsubscribe = onAuthStateChanged(client.auth, value => {
      setUser(value); setAdmin(false); setReady(!value); setItems([]); setLoaded(false); setReview(null); setError('');
      if (value) httpsCallable<Record<string, never>, { isAdmin: boolean }>(client.functions, 'getMyAccess', { timeout: 15000 })({}).then(result => {
        if (!cancelled && client.auth.currentUser?.uid === value.uid) { setAdmin(result.data.isAdmin); setReady(true); }
      }).catch(() => { if (!cancelled) { setError('Chưa xác minh được quyền quản trị. Kiểm tra kết nối.'); setReady(true); } });
    });
    return () => { cancelled = true; unsubscribe(); };
  }, []);
  async function load() {
    const result = await httpsCallable<Record<string, never>, { applications: Application[] }>(adminClient().functions, 'listVolunteerApplications', { timeout: 15000 })({});
    setItems(result.data.applications); setLoaded(true); setReview(null);
  }
  async function act(operation: 'login' | 'logout' | 'load' | 'approved' | 'rejected', uid?: string) {
    setBusy(true); setError(''); setMessage('');
    try {
      const client = adminClient();
      if (operation === 'login') { await setPersistence(client.auth, browserSessionPersistence); await signInWithEmailAndPassword(client.auth, email.trim(), password); setPassword(''); }
      else if (operation === 'logout') await signOut(client.auth);
      else if (operation === 'load') await load();
      else { await httpsCallable(client.functions, 'reviewVolunteerApplication', { timeout: 15000 })({ uid, decision: operation }); setMessage(operation === 'approved' ? 'Đã duyệt TNV. Người đăng ký có thể bật sẵn sàng.' : 'Đã từ chối đơn. Người đăng ký có thể bổ sung và gửi lại.'); await load(); }
    } catch { setError('Thao tác chưa hoàn tất. Kiểm tra tài khoản, quyền quản trị và kết nối rồi thử lại.'); }
    finally { setBusy(false); }
  }
  return <main className="report-page role-admin"><div className="report-brand">EHIS · QUẢN TRỊ</div><h1>Duyệt TNV.</h1>
    <p className="report-intro">Xem thông tin tự khai và kiểm tra điều kiện tham gia trước khi cấp quyền nhận ca. Duyệt trong app không thay thế xác minh năng lực thực tế.</p>
    {!ready && <p role="status">Đang kiểm tra quyền quản trị…</p>}
    {!user ? <form className="report-panel" onSubmit={event => { event.preventDefault(); act('login'); }}>
      <label className="phone-label">Email quản trị<input type="email" value={email} onChange={event => setEmail(event.target.value)} required disabled={busy} autoComplete="username" /></label>
      <label className="phone-label">Mật khẩu<input type="password" value={password} onChange={event => setPassword(event.target.value)} required disabled={busy} autoComplete="current-password" /></label>
      <button className="primary" disabled={busy}>Đăng nhập quản trị</button>
    </form> : <><p>{user.email}</p><button className="secondary" disabled={busy} onClick={() => act('logout')}>Đăng xuất quản trị</button>
      {ready && !admin && <p role="alert" className="error">Tài khoản này không có quyền quản trị. Chọn vai trò hoặc đăng ký tài khoản không tự cấp quyền.</p>}
      {admin && <><button className="primary" disabled={busy} onClick={() => act('load')}>Tải đơn chờ duyệt</button><p className="hint">Hiển thị tối đa 50 đơn chờ duyệt mỗi lần. Sau xử lý, tải lại để xem các đơn tiếp theo.</p>
        {!items.length && <p>{loaded ? 'Hiện không có đơn chờ duyệt.' : 'Bấm Tải đơn chờ duyệt để xem danh sách.'}</p>}
        {items.map(item => <section className="report-panel" key={item.uid}><h2>{item.fullName}</h2><p>Liên hệ: {item.phone}</p><p>Kinh nghiệm tự khai: {item.experience}</p>
          {review?.uid === item.uid ? <div className="review-confirm"><p>{review.decision === 'approved' ? 'Cho phép tài khoản này bật sẵn sàng và nhận ca? Xác nhận bạn đã kiểm tra điều kiện tham gia buổi thử.' : 'Từ chối đơn này? Người đăng ký có thể bổ sung và gửi lại.'}</p><button className="primary" disabled={busy} onClick={() => act(review.decision, item.uid)}>{busy ? 'Đang lưu…' : review.decision === 'approved' ? 'Xác nhận duyệt đơn' : 'Xác nhận từ chối đơn'}</button><button className="secondary" disabled={busy} onClick={() => setReview(null)}>Quay lại xem đơn</button></div> : <><button className="primary" disabled={busy} onClick={() => setReview({ uid: item.uid, decision: 'approved' })}>Duyệt đơn</button><button className="secondary" disabled={busy} onClick={() => setReview({ uid: item.uid, decision: 'rejected' })}>Từ chối đơn</button></>}
        </section>)}
      </>}
    </>}
    {!!error && <p role="alert" className="error">{error}</p>}{!!message && <p role="status" className="success">{message}</p>}
    <p className="hint">Chỉ tài khoản quản trị được nhóm phụ trách cấp mới được duyệt TNV. Đăng ký hoặc chọn đối tượng không tự cấp quyền quản trị.</p>
  </main>;
}
