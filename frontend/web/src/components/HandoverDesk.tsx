'use client';
import { useRef, useState } from 'react';
import { adminClient, callable, readableError } from '@/lib/firebase-client';
type Case = { incidentId: string; status: string; responsibleName: string; acceptedAtMs: number | null; handover: { id: string; expiresAtMs: number } | null };
type Candidate = { uid: string; fullName: string; distanceMeters: number };
type History = { id: string; fromName: string; targetName: string; reason: string; status: string; requestedAtMs: number | null };
function HandoverHistory({ incidentId }: { incidentId: string }) {
  const [items, setItems] = useState<History[]>([]), [next, setNext] = useState<string | null>(null), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  async function load(more = false) {
    setBusy(true); setMessage('');
    try { const r = await callable<unknown, { history: History[]; next: string | null }>(adminClient().functions, 'listHandoverHistory')({ incidentId, ...(more && next ? { after: next } : {}) }); setItems(old => more ? [...old, ...r.data.history] : r.data.history); setNext(r.data.next); if (!r.data.history.length) setMessage('Chưa có đề nghị bàn giao.'); }
    catch (e) { setMessage(readableError(e)); } finally { setBusy(false); }
  }
  const labels: Record<string, string> = { pending: 'Chờ xác nhận', accepted: 'Đã chuyển quyền', cancelled: 'Đã hủy', expired: 'Hết hạn', 'case-closed': 'Ca đã kết thúc' };
  return <details><summary>Lịch sử bàn giao</summary><button className="secondary" disabled={busy} onClick={() => load()}>Tải lịch sử</button>{items.map(item => <p key={item.id}>{item.fromName} → {item.targetName} · {labels[item.status] || item.status}{item.requestedAtMs ? ` · ${new Date(item.requestedAtMs).toLocaleString('vi-VN')}` : ''}<br />Lý do: {item.reason}</p>)}{next && <button className="secondary" disabled={busy} onClick={() => load(true)}>Tải thêm lịch sử</button>}{message && <p role="status">{message}</p>}</details>;
}
function CaseRow({ item, changed }: { item: Case; changed: () => void }) {
  const [candidates, setCandidates] = useState<Candidate[] | null>(null), [target, setTarget] = useState(''), [reason, setReason] = useState(''), [confirmed, setConfirmed] = useState(false), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const attempt = useRef<{ fingerprint: string; requestId: string } | null>(null);
  async function load() {
    setBusy(true); setMessage('');
    try { const r = await callable<unknown, { candidates: Candidate[]; overflow: boolean }>(adminClient().functions, 'listHandoverCandidates')({ incidentId: item.incidentId }); setCandidates(r.data.candidates); setTarget(''); if (!r.data.candidates.length) setMessage('Chưa có TNV sẵn sàng trong 5 km. Người hiện tại vẫn phụ trách.'); else if (r.data.overflow) setMessage('Hiển thị 50 TNV gần nhất; danh sách chưa gồm tất cả.'); }
    catch (e) { setMessage(readableError(e)); } finally { setBusy(false); }
  }
  async function propose() {
    if (!confirmed || !target || reason.trim().length < 10) return;
    const fingerprint = JSON.stringify({ target, reason: reason.trim() }); if (attempt.current?.fingerprint !== fingerprint) attempt.current = { fingerprint, requestId: crypto.randomUUID() };
    setBusy(true); setMessage('');
    try { await callable(adminClient().functions, 'proposeIncidentHandover')({ incidentId: item.incidentId, targetUid: target, reason: reason.trim(), requestId: attempt.current.requestId }); setMessage('Đã gửi đề nghị. Chưa chuyển người phụ trách cho đến khi TNV mới xác nhận.'); changed(); }
    catch (e) { setMessage(readableError(e)); } finally { setBusy(false); }
  }
  async function cancel() {
    if (!item.handover) return; setBusy(true); setMessage('');
    try { await callable(adminClient().functions, 'cancelIncidentHandover')({ incidentId: item.incidentId, handoverId: item.handover.id }); setMessage('Đã hủy đề nghị; người hiện tại vẫn phụ trách.'); changed(); }
    catch (e) { setMessage(readableError(e)); } finally { setBusy(false); }
  }
  return <section className="report-panel"><h3>Ca {item.incidentId.slice(0, 10)}</h3><p>Phụ trách: {item.responsibleName} · {item.status === 'arrived' ? 'Đã xác nhận đến' : 'Đang di chuyển'}{item.acceptedAtMs ? ` · Nhận lúc ${new Date(item.acceptedAtMs).toLocaleString('vi-VN')}` : ''}</p>
    {item.handover ? <><p role="status">Có đề nghị bàn giao · hạn xác nhận {new Date(item.handover.expiresAtMs).toLocaleTimeString('vi-VN')}. Người cũ vẫn phụ trách nếu chưa có người mới nhận.</p><button className="secondary" disabled={busy} onClick={cancel}>Hủy đề nghị bàn giao</button></> : <>
      <button className="secondary" disabled={busy} onClick={load}>Tìm TNV có thể nhận bàn giao</button>
      {candidates && candidates.length > 0 && <><label className="phone-label">Người nhận đề nghị<select value={target} disabled={busy} onChange={e => setTarget(e.target.value)}><option value="">Chọn TNV gần bệnh nhân</option>{candidates.map(v => <option key={v.uid} value={v.uid}>{v.fullName} · {v.distanceMeters} m lúc tải</option>)}</select></label>
        <label className="phone-label">Lý do bàn giao<textarea value={reason} maxLength={300} disabled={busy} onChange={e => setReason(e.target.value)} placeholder="Tối thiểu 10 ký tự. Không nhập bệnh án." /></label>
        <label className="confirm"><input type="checkbox" checked={confirmed} disabled={busy} onChange={e => setConfirmed(e.target.checked)} />Tôi đã liên hệ xác minh và giải thích việc bàn giao.</label>
        <button className="primary" disabled={busy || !confirmed || !target || reason.trim().length < 10} onClick={propose}>Gửi đề nghị · chưa chuyển quyền</button></>}
    </>}{message && <p role="status">{message}</p>}<HandoverHistory incidentId={item.incidentId} /></section>;
}
export function HandoverDesk() {
  const [items, setItems] = useState<Case[]>([]), [next, setNext] = useState<string | null>(null), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const [historyId, setHistoryId] = useState('');
  async function load(more = false) { setBusy(true); setMessage(''); try { const r = await callable<unknown, { cases: Case[]; next: string | null }>(adminClient().functions, 'listHandoverCases')({ ...(more && next ? { after: next } : {}) }); setItems(old => more ? [...old, ...r.data.cases] : r.data.cases); setNext(r.data.next); if (!r.data.cases.length) setMessage('Không có ca đang được phụ trách trong trang này.'); } catch (e) { setMessage(readableError(e)); } finally { setBusy(false); } }
  return <details className="report-panel"><summary>Bàn giao ca đang xử lý</summary><p>Quản trị liên hệ xác minh trước khi gửi đề nghị. Chỉ chuyển quyền khi TNV mới xác nhận; không tự đóng ca vì quá giờ. Nhận bàn giao bằng app web mới hoặc APK 0.4.14 trở lên.</p><button className="primary" disabled={busy} onClick={() => load()}>Tải ca đang xử lý</button>{items.map(item => <CaseRow key={item.incidentId + (item.handover?.id || 'none')} item={item} changed={() => { void load(); }} />)}{next && <button className="secondary" disabled={busy} onClick={() => load(true)}>Tải thêm 25 ca</button>}{message && <p role="status">{message}</p>}<label className="phone-label">Tra lịch sử, kể cả ca đã kết thúc<input value={historyId} maxLength={100} onChange={e => setHistoryId(e.target.value.trim())} placeholder="Mã ca đầy đủ" /></label>{/^[A-Za-z0-9_-]{8,100}$/.test(historyId) && <HandoverHistory key={historyId} incidentId={historyId} />}</details>;
}
