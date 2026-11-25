'use client';
import { useEffect, useState } from 'react';
import {
  browserSessionPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';

import { callable as httpsCallable, adminClient } from '@/lib/firebase-client';
import { AdminApplicationReview } from './AdminApplicationReview';
import { VolunteerRoster } from './VolunteerRoster';
import { OperationsOverview } from './OperationsOverview';
import { HandoverDesk } from './HandoverDesk';
import { type Application } from '@/lib/volunteer-application';

export function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null),
    [admin, setAdmin] = useState(false),
    [ready, setReady] = useState(false);
  const [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [error, setError] = useState(''),
    [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false),
    [items, setItems] = useState<Application[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [accessAttempt, setAccessAttempt] = useState(0);
  const [accessFailed, setAccessFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const client = adminClient();
    const unsubscribe = onAuthStateChanged(client.auth, (value) => {
      setUser(value);
      setAdmin(false);
      setReady(!value);
      setAccessFailed(false);
      setItems([]);
      setLoaded(false);
      setError('');
      if (value)
        httpsCallable<Record<string, never>, { isAdmin: boolean }>(
          client.functions,
          'getMyAccess',
          { timeout: 15000 },
        )({})
          .then((result) => {
            if (!cancelled && client.auth.currentUser?.uid === value.uid) {
              setAdmin(result.data.isAdmin);
              setReady(true);
            }
          })
          .catch(() => {
            if (!cancelled && client.auth.currentUser?.uid === value.uid) {
              setError('Chưa xác minh được quyền quản trị. Kiểm tra kết nối.');
              setAccessFailed(true);
              setReady(true);
            }
          });
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [accessAttempt]);
  useEffect(() => {
    if (!user || !admin) return;
    let cancelled = false;
    const uid = user.uid,
      client = adminClient();
    httpsCallable<Record<string, never>, { applications: Application[] }>(
      client.functions,
      'listVolunteerApplications',
      { timeout: 15000 },
    )({})
      .then((result) => {
        if (!cancelled && client.auth.currentUser?.uid === uid) {
          setItems(result.data.applications);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) setError('Chưa tải được đơn. Bấm Tải lại đơn chờ duyệt.');
      });
    return () => {
      cancelled = true;
    };
  }, [user, admin]);
  async function load() {
    const result = await httpsCallable<Record<string, never>, { applications: Application[] }>(
      adminClient().functions,
      'listVolunteerApplications',
      { timeout: 15000 },
    )({});
    setItems(result.data.applications);
    setLoaded(true);
  }
  async function act(operation: 'login' | 'logout' | 'load') {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const client = adminClient();
      if (operation === 'login') {
        await setPersistence(client.auth, browserSessionPersistence);
        await signInWithEmailAndPassword(client.auth, email.trim(), password);
        setPassword('');
      } else if (operation === 'logout') await signOut(client.auth);
      else if (operation === 'load') await load();
    } catch {
      setError(
        'Thao tác chưa hoàn tất. Kiểm tra tài khoản, quyền quản trị và kết nối rồi thử lại.',
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="report-page role-admin">
      <div className="report-brand">EHIS · QUẢN TRỊ</div>
      <h1>Quản lý hỗ trợ</h1>
      <p className="report-intro">
        Theo dõi ca hỗ trợ, duyệt kỹ năng và quản lý TNV theo khu vực. Chỉ cấp quyền sau khi đối
        chiếu điều kiện tham gia; duyệt trong app không thay thế xác minh năng lực thực tế.
      </p>
      {!ready && <p role="status">Đang kiểm tra quyền quản trị…</p>}
      {!user ? (
        <form
          className="report-panel"
          onSubmit={(event) => {
            event.preventDefault();
            act('login');
          }}
        >
          <label className="phone-label">
            Email quản trị
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              disabled={busy}
              autoComplete="username"
            />
          </label>
          <label className="phone-label">
            Mật khẩu
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              disabled={busy}
              autoComplete="current-password"
            />
          </label>
          <button className="primary" disabled={busy}>
            Đăng nhập quản trị
          </button>
        </form>
      ) : (
        <>
          <p>{user.email}</p>
          <button className="secondary" disabled={busy} onClick={() => act('logout')}>
            Đăng xuất quản trị
          </button>
          {ready && accessFailed && (
            <button
              className="primary"
              disabled={busy}
              onClick={() => setAccessAttempt((value) => value + 1)}
            >
              Kiểm tra lại quyền quản trị
            </button>
          )}
          {ready && !admin && !accessFailed && (
            <p role="alert" className="error">
              Tài khoản này không có quyền quản trị. Chọn vai trò hoặc đăng ký tài khoản không tự
              cấp quyền.
            </p>
          )}
          {admin && (
            <>
              <section className="report-panel">
                <h2>Duyệt tình nguyện viên</h2>
                <p>
                  TNV gửi hồ sơ → Admin đối chiếu danh tính, đào tạo và kỹ năng → Xác nhận cấp
                  quyền. Không cần người giới thiệu.
                </p>
              </section>
              <details className="report-panel">
                <summary>Ca đang hoạt động và bàn giao</summary>
                <OperationsOverview />
                <HandoverDesk />
              </details>
              <details className="report-panel">
                <summary>Danh sách TNV đã duyệt và khu vực</summary>
                <VolunteerRoster />
              </details>
              <button className="primary" disabled={busy} onClick={() => act('load')}>
                Tải lại đơn chờ duyệt
              </button>
              <p className="hint">
                Hiển thị tối đa 50 đơn chờ duyệt mỗi lần. Sau xử lý, tải lại để xem các đơn tiếp
                theo.
              </p>
              {!items.length && (
                <p>
                  {loaded
                    ? 'Hiện không có đơn chờ duyệt.'
                    : 'Bấm Tải đơn chờ duyệt để xem danh sách.'}
                </p>
              )}
              {items.map((item) => (
                <AdminApplicationReview
                  key={`${item.uid}:${item.applicationRevision}`}
                  item={item}
                  saved={async () => {
                    await load();
                    setMessage('Đã cập nhật kết quả duyệt hồ sơ.');
                  }}
                />
              ))}
            </>
          )}
        </>
      )}
      {!!error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {!!message && (
        <p role="status" className="success">
          {message}
        </p>
      )}
      <p className="hint">
        Chỉ tài khoản quản trị được nhóm phụ trách cấp mới được duyệt TNV. Đăng ký hoặc chọn đối
        tượng không tự cấp quyền quản trị.
      </p>
    </main>
  );
}
