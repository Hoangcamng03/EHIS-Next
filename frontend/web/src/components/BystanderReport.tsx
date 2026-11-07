'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { doc, onSnapshot } from 'firebase/firestore';

import { callable as httpsCallable, firebaseClient, readableError, reporterSession } from '@/lib/firebase-client';
import { reportProgress } from '@/lib/report-status';
import { useOnline } from '@/lib/use-online';
import { UpdatePatientLocation } from './UpdatePatientLocation';
import { TravelStatus } from './TravelStatus';
import type { TravelProgress } from '@/lib/travel-progress';
import { DutyContact } from './DutyContact';

import { questions, chooseAnswer, selectedAnswer, type Answers } from '@/lib/observations';
import { ObservationIcon } from './ObservationIcon';

type Status = { travelProgress?: TravelProgress | null; acceptedAt?: { toMillis(): number }; volunteerLoadedRevision?: number; volunteerLoadedAtMs?: number; status: string; invitedCount: number; reportSubmitted: boolean; reportRevision: number; handoverPending?: boolean; offerExpiresAt?: { toMillis(): number } };
export function BystanderReport({ incidentId }: { incidentId: string }) {
  const online = useOnline();
  const [status, setStatus] = useState<Status>();
  const [serverConfirmed, setServerConfirmed] = useState(false);
  const [answers, setAnswers] = useState<Answers>({ responsiveness: '', breathing: '', bleeding: '' });
  const [phone, setPhone] = useState('');
  const [meetingNote, setMeetingNote] = useState('');
  const [meetingNoteEdited, setMeetingNoteEdited] = useState(false);
  const [reportReady, setReportReady] = useState(false), [baseRevision, setBaseRevision] = useState(0), [restoreError, setRestoreError] = useState(''), [restoreAttempt, setRestoreAttempt] = useState(0);
  const [actionError, setActionError] = useState('');
  const edited = useRef(false);
  const [dirty, setDirty] = useState(false);
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
    event.preventDefault(); if (!canSend || !reportReady || outdated || busy) return; setBusy(true); setActionError(''); setSuccess('');
    const payload = { incidentId, phone: phone.trim(), answers, expectedRevision: baseRevision, ...(meetingNoteEdited ? { meetingNote: meetingNote.trim() } : {}) };
    const fingerprint = JSON.stringify(payload);
    if (attempt.current?.fingerprint !== fingerprint) attempt.current = { fingerprint, submissionId: crypto.randomUUID() };
    try {
      await reporterSession();
      const result = await httpsCallable<typeof payload & { submissionId: string }, { received: boolean; revision: number }>(firebaseClient().functions, 'submitBystanderReport', { timeout: 20000 })({ ...payload, submissionId: attempt.current.submissionId });
      setSuccess(`Máy chủ đã lưu bản bổ sung số ${result.data.revision} vào cùng ca hỗ trợ.`);
      setBaseRevision(result.data.revision); edited.current = false; setDirty(false);
    } catch (err) { setActionError(readableError(err)); }
    finally { setBusy(false); }
  }
  async function cancel() {
    if (!online || !serverConfirmed || busy || terminal) return;
    setBusy(true); setActionError('');
    try { await httpsCallable(firebaseClient().functions, 'finishIncident', { timeout: 20000 })({ incidentId, outcome: 'cancelled' }); setConfirmCancel(false); setSuccess('Đã hủy yêu cầu chưa có người tiếp nhận.'); }
    catch (err) { setActionError(readableError(err)); }
    finally { setBusy(false); }
  }
  const progress = status ? reportProgress(status.status, status.invitedCount, status.offerExpiresAt?.toMillis(), now) : undefined;
  const terminal = !!progress?.terminal;
  const canSend = online && serverConfirmed && !!status && !terminal && ['dispatching', 'accepted', 'arrived'].includes(status.status);
  const outdated = reportReady && Number(status?.reportRevision || 0) > baseRevision;
  useEffect(() => {
    if (!canSend) return;
    let cancelled = false;
    Promise.resolve().then(() => { if (cancelled) return; setReportReady(false); setRestoreError(''); return httpsCallable<unknown, { phone: string; answers: Answers | null; meetingNote: string; revision: number }>(firebaseClient().functions, 'getBystanderReport', { timeout: 15000 })({ incidentId }); }).then(result => {
      if (cancelled || !result) return;
      if (!edited.current) { setPhone(result.data.phone || ''); setAnswers(result.data.answers || { responsiveness: '', breathing: '', bleeding: '' }); setMeetingNote(result.data.meetingNote); setMeetingNoteEdited(false); setBaseRevision(result.data.revision); }
      setReportReady(true);
    }).catch(err => { if (!cancelled) setRestoreError(readableError(err)); });
    return () => { cancelled = true; };
  }, [incidentId, canSend, restoreAttempt]);
  function restore() { edited.current = false; setDirty(false); setActionError(''); setSuccess(''); setRestoreAttempt(n => n + 1); }
  if (!status) return <main className="report-page role-reporter"><div className="report-brand">EHIS · NGƯỜI BÁO TIN</div><h1>{error ? 'Chưa mở được yêu cầu' : 'Đang kiểm tra yêu cầu…'}</h1>{error ? <><p role="alert" className="error">{error}</p><p>Đường dẫn này chưa dùng được trong phiên hiện tại. Mở bằng trình duyệt đã báo tin hoặc quét lại thẻ.</p><button className="primary" onClick={() => { setError(''); setRetry(n => n + 1); }}>Thử kết nối lại</button></> : <p role="status">Đang xác nhận với máy chủ. Chưa gửi thêm thông tin.</p>}<Link className="secondary home-action" href="/">Về trang hướng dẫn</Link><DutyContact urgent={!!error || !online} /></main>;
  return <main className="report-page role-reporter">
    <div className="report-brand">EHIS NEXT <span>NGƯỜI BÁO TIN</span></div>

    {!online && <p role="alert" className="error">Thiết bị đang báo mất mạng. Chưa thể gửi hoặc xác nhận trạng thái mới. Không chờ EHIS nếu cần cấp cứu.</p>}
    <p className="step">{terminal ? 'TRẠNG THÁI YÊU CẦU' : 'BƯỚC 2 / 2'}</p><h1>{terminal ? 'Yêu cầu đã kết thúc' : 'Bổ sung tình trạng'}</h1>
    {!!actionError && <p className="error" role="alert">{actionError}</p>}{!!success && <p className="success" role="status">{success}</p>}
    {status && !serverConfirmed && <p className="notice" role="status">Đang chờ kết nối máy chủ. Thông tin dưới đây có thể đã cũ; chưa thể gửi thêm cho đến khi kết nối lại.</p>}
    {progress && <div className={`status-banner ${progress.waiting || progress.delayed ? 'awaiting-help' : ''}`} role="status">
      <strong>{progress.title}</strong><p>{progress.detail}</p>
      {progress.waiting && progress.delayed && <p>Yêu cầu đang chờ. Đừng chờ ứng dụng nếu cần cấp cứu ngay.</p>}
      {status?.reportSubmitted && <p>Đã ghi nhận bản bổ sung số {status.reportRevision}.</p>}
    </div>}
    <DutyContact urgent={!online || !!error || status?.status === 'expired' || !!progress && (progress.delayed || (progress.waiting && status?.invitedCount === 0) || progress.terminal && status?.status === 'dispatching')} />
    {!terminal && ['accepted', 'arrived'].includes(status.status) && <>
      {status.status === 'accepted' && <TravelStatus progress={status.travelProgress} acceptedAtMs={status.acceptedAt?.toMillis()} now={now} />}
      {status.reportRevision > 0 && <p className="hint" role="status">{Number(status.volunteerLoadedRevision || 0) >= status.reportRevision ? `App TNV đã xác nhận tải bản số ${status.volunteerLoadedRevision}. Xác nhận tải không đồng nghĩa đã đọc hoặc đánh giá y khoa.` : `Máy chủ đã lưu bản số ${status.reportRevision}. Chưa có xác nhận tải bản mới từ app TNV; app cũ có thể không gửi xác nhận.`}</p>}
    </>}
    {status.handoverPending && !terminal && <p className="notice">Đang đề nghị bàn giao. TNV hiện tại vẫn phụ trách cho đến khi người mới xác nhận.</p>}
    {!terminal && <p className="report-intro">Chọn điều bạn thấy. Chưa chắc thì chọn “Chưa rõ”.</p>}
    {status && ['accepted', 'arrived'].includes(status.status) && <UpdatePatientLocation key={incidentId} incidentId={incidentId} enabled={canSend} />}
    {status?.status === 'dispatching' && <p className="hint">Nếu điểm bệnh nhân ban đầu sai hoặc đã di chuyển: hủy yêu cầu chưa được nhận, rồi mở thẻ để gửi tại điểm đúng. Sau khi TNV nhận, bạn có thể xác nhận cập nhật điểm tại đây.</p>}
    {!terminal && <form className="report-panel" onSubmit={submit}>
      {dirty && <p className="notice" role="status">Đang sửa · chưa gửi TNV. Bấm Gửi thông tin bổ sung để cập nhật ca.</p>}
      {!reportReady && <p role="status">{restoreError || 'Đang tải thông tin đã gửi…'}</p>}
      {(outdated || !!restoreError) && <div className="notice" role="alert"><p>{outdated ? 'Có bản cập nhật mới. Tải lại trước khi gửi để tránh ghi đè.' : 'Chưa khôi phục được bản đã gửi.'}</p><button type="button" className="secondary" disabled={busy || !canSend} onClick={restore}>Tải bản đã gửi · bỏ phần đang sửa</button></div>}
      <p className="observation-progress" role="status">Đã chọn {questions.filter(q => answers[q.key]).length}/3 câu · Có thể chọn Chưa rõ</p>
      {questions.map((question, index) => <fieldset className="observation-question" key={question.key} disabled={busy || !canSend || !reportReady || outdated}><legend><span className="observation-heading"><ObservationIcon kind={question.icon} /><span><small>CÂU {index + 1} / 3</small><strong>{question.title}</strong></span></span></legend><p className="hint">{question.hint}</p>
        <div className="choices">{question.choices.map(choice => <label key={choice.value} className={selectedAnswer(answers, question.key) === choice.value ? 'choice selected' : 'choice'}><input type="radio" name={question.key} value={choice.value} required checked={selectedAnswer(answers, question.key) === choice.value} onChange={() => { edited.current = true; setDirty(true); setAnswers(previous => chooseAnswer(previous, question.key, choice.value)); setSuccess(''); }} /><span><strong>{choice.label}</strong><small>{choice.hint}</small></span></label>)}</div>
      </fieldset>)}
      <label className="phone-label optional-phone" htmlFor="phone">Số điện thoại để TNV liên hệ <span>Không bắt buộc</span></label>
      <input id="phone" type="tel" autoComplete="tel" inputMode="tel" maxLength={40} placeholder="Để trống nếu không muốn cung cấp" value={phone} disabled={busy || !canSend || !reportReady || outdated} onChange={e => { edited.current = true; setDirty(true); setPhone(e.target.value); setSuccess(''); }} />
      <p className="hint">Chỉ TNV được phân công ca mới có thể xem số bạn cung cấp.</p>
      <label htmlFor="meeting-note">Mốc tìm bệnh nhân · không bắt buộc</label>
      <textarea id="meeting-note" maxLength={240} rows={2} value={meetingNote} disabled={busy || !canSend || !reportReady || outdated} placeholder="Ví dụ: cổng B, tầng 2, cạnh cầu thang. Không nhập bệnh án." onChange={e => { edited.current = true; setDirty(true); setMeetingNote(e.target.value); setMeetingNoteEdited(true); setSuccess(''); }} />
      <p className="hint">{meetingNote.length}/240 ký tự · Không sửa ô này sẽ giữ ghi chú đã gửi. Chỉ TNV nhận ca được xem; không tự đổi GPS.</p>
      <button className="primary" type="submit" disabled={busy || !canSend || !reportReady || outdated || questions.some(question => !answers[question.key])}>{busy ? 'Đang gửi…' : 'Gửi thông tin bổ sung'}</button>
      <p className="hint">Bỏ trống số điện thoại vẫn gửi được. Ba câu hỏi đều cần chọn một đáp án. Có thay đổi thì chọn lại và gửi thêm; các lần gửi cập nhật cùng ca, không tạo ca mới.</p>

    </form>}
    {status?.status === 'dispatching' && !terminal && <section className="report-panel"><h2>Đã gửi nhầm yêu cầu?</h2>
      {confirmCancel ? <><p>Chỉ hủy nếu đã gửi nhầm hoặc không còn cần hỗ trợ. Nếu TNV vừa nhận ca, máy chủ sẽ từ chối hủy.</p><button className="secondary danger-action" type="button" disabled={busy || !canSend} onClick={cancel}>Xác nhận hủy yêu cầu</button><button className="secondary" type="button" disabled={busy} onClick={() => setConfirmCancel(false)}>Giữ yêu cầu đang chờ</button></> : <button className="secondary" type="button" disabled={busy || !canSend} onClick={() => setConfirmCancel(true)}>Hủy yêu cầu chưa có TNV nhận</button>}
    </section>}
    <p className="hint">Đây là điều người báo quan sát, không phải kết luận y khoa. Chỉ báo điều bạn thấy; không đoán tên bệnh. Không chờ EHIS nếu cần hỗ trợ khẩn ngay.</p>
  </main>;
}
