'use client';
import { useState } from 'react';
import { callable, adminClient } from '@/lib/firebase-client';
export function ReferrerRegistry() {
  const [form, setForm] = useState({ email: '', fullName: '', phone: '', organisation: '', position: '', verificationNote: '' });
  const [confirmed, setConfirmed] = useState(false), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const labels = { email: 'Email tài khoản người giới thiệu', fullName: 'Họ và tên', phone: 'Số liên hệ đơn vị', organisation: 'Tổ chức / đơn vị', position: 'Chức vụ quản lý', verificationNote: 'Căn cứ kiểm tra qua đơn vị' };
  async function save(enabled: boolean) {
    setBusy(true); setMessage('');
    try { await callable(adminClient().functions, 'setVolunteerReferrer', { timeout: 15000 })({ ...form, phone: form.phone.replace(/[\s().-]/g, ''), enabled }); setMessage(enabled ? 'Đã cấp quyền người giới thiệu. Người này có thể xác minh đơn được chỉ định.' : 'Đã thu hồi quyền. Checklist chưa được duyệt sẽ không đủ điều kiện duyệt mới.'); }
    catch { setMessage('Chưa lưu được. Người giới thiệu cần có tài khoản; kiểm tra đủ thông tin và quyền quản trị.'); } finally { setBusy(false); }
  }
  return <details className="report-panel"><summary>Quản lý người giới thiệu tại đơn vị</summary><p>Người giới thiệu tạo tài khoản tại <a href="/referrer">trang xác minh TNV</a> trước. Kiểm tra danh tính, chức vụ và quyền quản lý qua kênh chính thức của đơn vị.</p>
    {Object.entries(labels).map(([key, label]) => <label key={key} className="phone-label">{label}<input type={key === 'email' ? 'email' : key === 'phone' ? 'tel' : 'text'} value={form[key as keyof typeof form]} maxLength={key === 'verificationNote' ? 500 : key === 'email' ? 254 : key === 'organisation' ? 150 : 100} disabled={busy} onChange={event => setForm(previous => ({ ...previous, [key]: event.target.value }))} /></label>)}
    <label style={{ display: 'flex', gap: 12, padding: '12px 0' }}><input type="checkbox" checked={confirmed} disabled={busy} onChange={event => setConfirmed(event.target.checked)} />Đã kiểm tra người quản lý và được đơn vị xác nhận</label>
    <button className="primary" disabled={busy || !confirmed || Object.values(form).some(value => !value.trim())} onClick={() => save(true)}>Cấp / cập nhật quyền giới thiệu</button><button className="secondary" disabled={busy || Object.values(form).some(value => !value.trim())} onClick={() => save(false)}>Thu hồi quyền giới thiệu</button>{message && <p role="status">{message}</p>}
  </details>;
}
