'use client';
import { useEffect, useState } from 'react';
import { browserSessionPersistence, createUserWithEmailAndPassword, onAuthStateChanged, sendEmailVerification, setPersistence, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { callable, referrerClient } from '@/lib/firebase-client';

export const levels = { first_aid: 'Đào tạo sơ cứu', clinical_student: 'Sinh viên có thực hành lâm sàng', clinical_staff: 'Nhân sự có thực hành lâm sàng' };
const checks = { identityChecked: 'Đã đối chiếu danh tính', affiliationChecked: 'Đã xác nhận thuộc đơn vị quản lý', trainingChecked: 'Đã kiểm tra đào tạo và kinh nghiệm', scopeExplained: 'Đã thống nhất phạm vi hỗ trợ và giới hạn năng lực' };
export type Application = { uid: string; applicationRevision: number; fullName: string; phone: string; experience: string; trainingLevel: keyof typeof levels; clinicalMonths: number; homeAddress: string; workAddress: string; serviceArea: string; referrerEmail: string; policyVersion?: number; referral?: { decision: string; evidence: string; confirmedLevel: keyof typeof levels; confirmedClinicalMonths: number; organisation: string; position: string } };
function ApplicationReview({ item, saved }: { item: Application; saved: () => void }) {
  const [checklist, setChecklist] = useState(Object.fromEntries(Object.keys(checks).map(key => [key, false])));
  const [level, setLevel] = useState(item.trainingLevel), [months, setMonths] = useState(String(item.clinicalMonths)), [evidence, setEvidence] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function submit(decision: string) {
    setBusy(true); setError('');
    try { await callable(referrerClient().functions, 'submitVolunteerReferral', { timeout: 15000 })({ uid: item.uid, applicationRevision: item.applicationRevision, decision, checklist, confirmedLevel: level, confirmedClinicalMonths: Number(months), evidence }); saved(); }
    catch { setError('Chưa lưu được. Kiểm tra đủ thông tin và quyền; tải lại nếu hồ sơ vừa thay đổi.'); } finally { setBusy(false); }
  }
  return <section className="report-panel"><h2>{item.fullName}</h2><p>Liên hệ: {item.phone}</p><p>Tự khai: {levels[item.trainingLevel]} · {item.clinicalMonths} tháng</p><p>{item.experience}</p><p>Cư trú: {item.homeAddress}</p><p>Đơn vị: {item.workAddress}</p><p>Khu vực hỗ trợ: {item.serviceArea}</p>
    {item.referral && <p className="success">Đã ghi nhận: {item.referral.decision === 'recommended' ? 'Đề nghị duyệt' : 'Chưa đủ điều kiện'}. Quản trị còn phải duyệt riêng.</p>}
    <fieldset disabled={busy}><legend>Checklist do người quản lý xác nhận</legend>{Object.entries(checks).map(([key, label]) => <label key={key} style={{ display: 'flex', gap: 12, padding: '12px 0' }}><input type="checkbox" checked={checklist[key]} onChange={event => setChecklist(previous => ({ ...previous, [key]: event.target.checked }))} />{label}</label>)}</fieldset>
    <label className="phone-label">Mức đào tạo đã kiểm tra<select value={level} disabled={busy} onChange={event => { const next = event.target.value as keyof typeof levels; setLevel(next); if (next === 'first_aid') setMonths('0'); }}>{Object.entries(levels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
    <label className="phone-label">Số tháng lâm sàng đã kiểm tra<input type="number" min="0" max="600" value={months} disabled={busy || level === 'first_aid'} onChange={event => setMonths(event.target.value)} /></label>
    <label className="phone-label">Căn cứ xác minh / giới hạn hỗ trợ<textarea value={evidence} onChange={event => setEvidence(event.target.value)} maxLength={500} disabled={busy} placeholder="Tên khóa, nơi thực hành, thời điểm kiểm tra; không nhập hồ sơ bệnh án." /></label>
    <button className="primary" disabled={busy || !evidence.trim() || !/^\d+$/.test(months) || Object.values(checklist).some(value => !value)} onClick={() => submit('recommended')}>Xác nhận và đề nghị duyệt</button>
    <button className="secondary" disabled={busy || !evidence.trim() || !/^\d+$/.test(months)} onClick={() => submit('not_recommended')}>Ghi nhận chưa đủ điều kiện</button>{error && <p role="alert" className="error">{error}</p>}
  </section>;
}
export function ReferrerDashboard() {
  const [user, setUser] = useState<User | null>(null), [ready, setReady] = useState(false), [busy, setBusy] = useState(false);
  const [email, setEmail] = useState(''), [password, setPassword] = useState(''), [error, setError] = useState(''), [loaded, setLoaded] = useState(false);
  const [items, setItems] = useState<Application[]>([]), [organisation, setOrganisation] = useState('');
  useEffect(() => onAuthStateChanged(referrerClient().auth, value => { setUser(value); setReady(true); setItems([]); setLoaded(false); setOrganisation(''); setError(''); }), []);
  async function act(operation: 'login' | 'register' | 'load' | 'logout' | 'verify') {
    setBusy(true); setError('');
    try {
      const client = referrerClient();
      if (operation === 'logout') await signOut(client.auth);
      else if (operation === 'verify') { if (client.auth.currentUser) await sendEmailVerification(client.auth.currentUser); setError('Đã gửi email xác minh. Mở liên kết trong hộp thư, sau đó báo quản trị kiểm tra tài khoản và chức vụ.'); }
      else if (operation === 'load') { const uid = client.auth.currentUser?.uid; const result = await callable<Record<string, never>, { organisation: string; applications: Application[] }>(client.functions, 'listReferrerApplications', { timeout: 15000 })({}); if (client.auth.currentUser?.uid === uid) { setItems(result.data.applications); setOrganisation(result.data.organisation); setLoaded(true); } }
      else { await setPersistence(client.auth, browserSessionPersistence); await (operation === 'login' ? signInWithEmailAndPassword : createUserWithEmailAndPassword)(client.auth, email.trim(), password); setPassword(''); }
    } catch { setError(operation === 'load' ? 'Chưa tải được. Quản trị cần xác minh và cấp quyền người giới thiệu trước.' : 'Chưa hoàn tất. Kiểm tra email, mật khẩu (tối thiểu 8 ký tự), kết nối hoặc dùng tài khoản đã đăng ký.'); }
    finally { setBusy(false); }
  }
  return <main className="report-page role-admin"><div className="report-brand">EHIS · NGƯỜI GIỚI THIỆU</div><h1>Xác minh tình nguyện viên</h1><p className="report-intro">Dành cho người quản lý tại đơn vị đã được EHIS xác minh. Tạo tài khoản không tự cấp quyền xác nhận.</p>
    {!ready ? <p>Đang kiểm tra phiên…</p> : !user ? <form className="report-panel" onSubmit={event => { event.preventDefault(); void act('login'); }}><label className="phone-label">Email<input type="email" required value={email} onChange={event => setEmail(event.target.value)} disabled={busy} autoComplete="username" /></label><label className="phone-label">Mật khẩu<input type="password" minLength={8} required value={password} onChange={event => setPassword(event.target.value)} disabled={busy} autoComplete="current-password" /></label><button className="primary" disabled={busy}>Đăng nhập</button><button className="secondary" type="button" disabled={busy || !email.trim() || password.length < 8} onClick={() => act('register')}>Tạo tài khoản người giới thiệu</button></form> : <><p>{user.email}{organisation ? ` · ${organisation}` : ''}</p><button className="secondary" disabled={busy} onClick={() => act('logout')}>Đăng xuất</button><button className="primary" disabled={busy} onClick={() => act('load')}>Tải hồ sơ được giao</button><p className="hint">Tối đa 50 đơn chờ. Chỉ hiển thị hồ sơ chỉ định bạn; tải lại sau khi quản trị xử lý.</p>{loaded && !items.length && <p>Chưa có hồ sơ chờ xác minh.</p>}{items.map(item => <ApplicationReview key={`${item.uid}:${item.applicationRevision}`} item={item} saved={() => { void act('load'); }} />)}</>}
    {user && <button className="secondary" disabled={busy} onClick={() => act('verify')}>Gửi email xác minh tài khoản</button>}
    {error && <p role="alert" className="error">{error}</p>}
    <p><a href="/privacy">Cách EHIS sử dụng thông tin của bạn</a></p>
  </main>;
}
