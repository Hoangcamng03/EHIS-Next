'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';

import { callable as httpsCallable, firebaseClient, readableError, reporterSession } from '@/lib/firebase-client';
import { reportProgress } from '@/lib/report-status';
import { useOnline } from '@/lib/use-online';
import { UpdatePatientLocation } from './UpdatePatientLocation';

const questions = [
  { key: 'responsiveness', title: '1. Người này có đáp lại khi bạn gọi không?', choices: [['responsive', 'Có · nhìn, nói hoặc cử động đáp lại'], ['unresponsive', 'Không thấy đáp lại'], ['unknown', 'Không rõ / chưa kiểm tra']] },
  { key: 'breathing', title: '2. Bạn quan sát thấy họ thở như thế nào?', choices: [['normal', 'Có vẻ thở đều'], ['abnormal', 'Khó thở, thở ngáp hoặc không thấy thở'], ['unknown', 'Không rõ / chưa kiểm tra']] },
  { key: 'bleeding', title: '3. Bạn có thấy máu đang chảy ngoài cơ thể không?', choices: [['none_seen', 'Không thấy'], ['visible', 'Có thấy máu đang chảy'], ['unknown', 'Không rõ / chưa kiểm tra']] },
] as const;
type Answers = Record<typeof questions[number]['key'], string>;
type Status = { status: string; invitedCount: number; reportSubmitted: boolean; reportRevision: number; offerExpiresAt?: { toMillis(): number } };
export function BystanderReport({ incidentId }: { incidentId: string }) {
  const online = useOnline();
  const [status, setStatus] = useState<Status>();
  const [serverConfirmed, setServerConfirmed] = useState(false);
  const [answers, setAnswers] = useState<Answers>({ responsiveness: '', breathing: '', bleeding: '' });
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [retry, setRetry] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const attempt = useRef<{ fingerprint: string; submissionId: string } | null>(null);
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;
    reporterSession().then(uid => {
      if (cancelled) return;
      if (!online) { setServerConfirmed(false); return; }
      unsubscribe = onSnapshot(doc(firebaseClient().db, `reporters/${uid}/incidentStatuses/${incidentId}`), { includeMetadataChanges: true }, snapshot => {
        setServerConfirmed(!snapshot.metadata.fromCache);
        if (snapshot.exists()) { setStatus(snapshot.data() as Status); setError(''); }
        else { setStatus(undefined); setError(snapshot.metadata.fromCache ? '' : 'Không tìm thấy yêu cầu trong phiên này. Hãy dùng trình duyệt đã gửi yêu cầu.'); }
      }, err => { setServerConfirmed(false); setStatus(undefined); setError(readableError(err)); });
    }).catch(err => { if (!cancelled) setError(readableError(err)); });
    return () => { cancelled = true; unsubscribe?.(); };
  }, [incidentId, retry, online]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!canSend || busy) return; setBusy(true); setError(''); setSuccess('');
    const payload = { incidentId, phone: phone.trim(), answers };
    const fingerprint = JSON.stringify(payload);
    if (attempt.current?.fingerprint !== fingerprint) attempt.current = { fingerprint, submissionId: crypto.randomUUID() };
    try {
      await reporterSession();
      const result = await httpsCallable<typeof payload & { submissionId: string }, { received: boolean; revision: number }>(firebaseClient().functions, 'submitBystanderReport', { timeout: 20000 })({ ...payload, submissionId: attempt.current.submissionId });
      setSuccess(`Đã gửi bản bổ sung số ${result.data.revision} đến cùng ca hỗ trợ.`);
    } catch (err) { setError(readableError(err)); }
    finally { setBusy(false); }
  }
  async function cancel() {
    if (!online || !serverConfirmed || busy || terminal) return;
    setBusy(true); setError('');
    try { await httpsCallable(firebaseClient().functions, 'finishIncident', { timeout: 20000 })({ incidentId, outcome: 'cancelled' }); setConfirmCancel(false); setSuccess('Đã hủy yêu cầu chưa có người tiếp nhận.'); }
    catch (err) { setError(readableError(err)); }
    finally { setBusy(false); }
  }
  const progress = status ? reportProgress(status.status, status.invitedCount, status.offerExpiresAt?.toMillis(), now) : undefined;
  const terminal = !!progress?.terminal;
  const canSend = online && serverConfirmed && !!status && !terminal && ['dispatching', 'accepted', 'arrived'].includes(status.status);
  return <main className="report-page role-reporter">
    <div className="report-brand">EHIS NEXT <span>NGƯỜI BÁO TIN</span></div>

    {!online && <p role="alert" className="error">Thiết bị đang báo mất mạng. Chưa thể gửi hoặc xác nhận trạng thái mới. Không chờ EHIS nếu cần cấp cứu.</p>}
    <p className="step">BƯỚC 2 / 2</p><h1>Bổ sung<br />tình trạng.</h1>
    {!status && !error && <p role="status">Đang kiểm tra yêu cầu…</p>}
    {status && !serverConfirmed && <p className="notice" role="status">Đang chờ kết nối máy chủ. Thông tin dưới đây có thể đã cũ; chưa thể gửi thêm cho đến khi kết nối lại.</p>}
    {progress && <div className={`status-banner ${progress.waiting || progress.delayed ? 'awaiting-help' : ''}`} role="status">
      <strong>{progress.title}</strong><p>{progress.detail}</p>
      {progress.waiting && progress.delayed && <p>Yêu cầu đang chờ. Đừng chờ ứng dụng nếu cần cấp cứu ngay.</p>}
      {status?.reportSubmitted && <p>Đã ghi nhận bản bổ sung số {status.reportRevision}.</p>}
    </div>}
    <p className="report-intro">Chỉ ghi điều bạn thấy, không cần chẩn đoán. Chưa chắc thì chọn “Không rõ”. Thông tin sẽ gửi tiếp cho TNV.</p>
    {status && ['accepted', 'arrived'].includes(status.status) && <UpdatePatientLocation key={incidentId} incidentId={incidentId} enabled={canSend} />}
    {status?.status === 'dispatching' && <p className="hint">Nếu điểm bệnh nhân ban đầu sai hoặc đã di chuyển: hủy yêu cầu chưa được nhận, rồi mở thẻ để gửi tại điểm đúng. Sau khi TNV nhận, bạn có thể xác nhận cập nhật điểm tại đây.</p>}
    <form className="report-panel" onSubmit={submit}>
      {questions.map(question => <fieldset key={question.key} disabled={busy || !canSend}><legend>{question.title}</legend>
        <div className="choices">{question.choices.map(([value, label]) => <label key={value} className={answers[question.key] === value ? 'choice selected' : 'choice'}><input type="radio" name={question.key} value={value} required checked={answers[question.key] === value} onChange={() => { setAnswers(previous => ({ ...previous, [question.key]: value })); setSuccess(''); }} />{label}</label>)}</div>
      </fieldset>)}
      <label className="phone-label optional-phone" htmlFor="phone">Số điện thoại để TNV liên hệ <span>Không bắt buộc</span></label>
      <input id="phone" type="tel" autoComplete="tel" inputMode="tel" maxLength={40} placeholder="Để trống nếu không muốn cung cấp" value={phone} disabled={busy || !canSend} onChange={e => { setPhone(e.target.value); setSuccess(''); }} />
      <p className="hint">Chỉ TNV được phân công ca mới có thể xem số bạn cung cấp.</p>
      <button className="primary" type="submit" disabled={busy || !canSend || questions.some(question => !answers[question.key])}>{busy ? 'Đang gửi…' : 'Gửi thông tin bổ sung'}</button>
      <p className="hint">Bỏ trống số điện thoại vẫn gửi được. Ba câu hỏi đều cần chọn một đáp án.</p>
      {success && <p className="success" role="status">{success}</p>}{error && <p className="error" role="alert">{error}</p>}
      {!status && error && <button className="secondary" type="button" onClick={() => { setError(''); setRetry(value => value + 1); }}>Thử kết nối lại</button>}
    </form>
    {status?.status === 'dispatching' && !terminal && <section className="report-panel"><h2>Đã gửi nhầm yêu cầu?</h2>
      {confirmCancel ? <><p>Chỉ hủy nếu đã gửi nhầm hoặc không còn cần hỗ trợ. Nếu TNV vừa nhận ca, máy chủ sẽ từ chối hủy.</p><button className="secondary danger-action" type="button" disabled={busy || !canSend} onClick={cancel}>Xác nhận hủy yêu cầu</button><button className="secondary" type="button" disabled={busy} onClick={() => setConfirmCancel(false)}>Giữ yêu cầu đang chờ</button></> : <button className="secondary" type="button" disabled={busy || !canSend} onClick={() => setConfirmCancel(true)}>Hủy yêu cầu chưa có TNV nhận</button>}
    </section>}
    <p className="hint">Thông tin tự khai từ người chứng kiến, không phải kết luận y khoa. Nếu TNV chưa mở ứng dụng, bản thử nghiệm này chưa bảo đảm thông báo nền.</p>
  </main>;
}
