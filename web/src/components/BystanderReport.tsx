'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { firebaseClient, readableError, reporterSession } from '@/lib/firebase-client';

const questions = [
  { key: 'responsiveness', title: '1. Bệnh nhân có phản hồi khi bạn gọi?', choices: [['responsive', 'Có phản hồi'], ['unresponsive', 'Không thấy phản hồi'], ['unknown', 'Không rõ']] },
  { key: 'breathing', title: '2. Bạn quan sát thấy nhịp thở thế nào?', choices: [['normal', 'Có vẻ bình thường'], ['abnormal', 'Có vẻ bất thường / không thấy thở'], ['unknown', 'Không rõ']] },
  { key: 'bleeding', title: '3. Có thấy chảy máu bên ngoài?', choices: [['none_seen', 'Không thấy'], ['visible', 'Có thấy'], ['unknown', 'Không rõ']] },
] as const;
type Answers = Record<typeof questions[number]['key'], string>;
type Status = { status: string; invitedCount: number; reportSubmitted: boolean; reportRevision: number };
export function BystanderReport({ incidentId }: { incidentId: string }) {
  const [status, setStatus] = useState<Status>();
  const [answers, setAnswers] = useState<Answers>({ responsiveness: '', breathing: '', bleeding: '' });
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const attempt = useRef<{ fingerprint: string; submissionId: string } | null>(null);
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;
    reporterSession().then(uid => {
      if (cancelled) return;
      unsubscribe = onSnapshot(doc(firebaseClient().db, `reporters/${uid}/incidentStatuses/${incidentId}`), snapshot => {
        if (snapshot.exists()) { setStatus(snapshot.data() as Status); setError(''); }
        else { setStatus(undefined); setError('Không tìm thấy yêu cầu trong phiên này. Hãy dùng trình duyệt đã gửi yêu cầu.'); }
      }, err => { setStatus(undefined); setError(readableError(err)); });
    }).catch(err => { if (!cancelled) setError(readableError(err)); });
    return () => { cancelled = true; unsubscribe?.(); };
  }, [incidentId]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setSuccess('');
    const payload = { incidentId, phone: phone.trim(), answers };
    const fingerprint = JSON.stringify(payload);
    if (attempt.current?.fingerprint !== fingerprint) attempt.current = { fingerprint, submissionId: crypto.randomUUID() };
    try {
      await reporterSession();
      const result = await httpsCallable<typeof payload & { submissionId: string }, { received: boolean; revision: number }>(firebaseClient().functions, 'submitBystanderReport')({ ...payload, submissionId: attempt.current.submissionId });
      setSuccess(`Đã gửi bản bổ sung số ${result.data.revision} đến cùng ca hỗ trợ.`);
    } catch (err) { setError(readableError(err)); }
    finally { setBusy(false); }
  }
  const canSend = !!status && ['dispatching', 'accepted', 'arrived'].includes(status.status);
  return <main className="report-page">
    <div className="report-brand">EHIS NEXT <span>HỖ TRỢ CỘNG ĐỒNG</span></div>
    <p className="step">BƯỚC 2 / 2</p><h1>Bổ sung<br />tình trạng.</h1>
    {status && <div className="status-banner" role="status"><strong>Máy chủ đã nhận yêu cầu.</strong><p>{status.status === 'accepted' ? 'Đã có TNV tiếp nhận ca.' : status.invitedCount > 0 ? `Đã tạo lời mời cho ${status.invitedCount} TNV; đang chờ người tiếp nhận.` : 'Hiện chưa có TNV phù hợp để mời. Chưa có người tiếp nhận.'}</p>{status.reportSubmitted && <p>Đã ghi nhận bản bổ sung số {status.reportRevision}.</p>}</div>}
    <p className="report-intro">Trả lời theo điều bạn quan sát. Nếu chưa chắc, chọn “Không rõ”. Thông tin sẽ cập nhật cho TNV trong ca này.</p>
    <form className="report-panel" onSubmit={submit}>
      <label className="phone-label" htmlFor="phone">Số điện thoại của bạn <span>Không bắt buộc</span></label>
      <input id="phone" type="tel" autoComplete="tel" inputMode="tel" maxLength={40} placeholder="Có thể để trống" value={phone} disabled={busy} onChange={e => { setPhone(e.target.value); setSuccess(''); }} />
      <p className="hint">Chỉ TNV được phân công ca mới có thể xem số bạn cung cấp để liên hệ.</p>
      {questions.map(question => <fieldset key={question.key} disabled={busy || !canSend}><legend>{question.title}</legend>
        <div className="choices">{question.choices.map(([value, label]) => <label key={value} className={answers[question.key] === value ? 'choice selected' : 'choice'}><input type="radio" name={question.key} value={value} required checked={answers[question.key] === value} onChange={() => { setAnswers(previous => ({ ...previous, [question.key]: value })); setSuccess(''); }} />{label}</label>)}</div>
      </fieldset>)}
      <button className="primary" type="submit" disabled={busy || !canSend}>{busy ? 'Đang gửi…' : 'Gửi thông tin bổ sung →'}</button>
      <p className="hint">Bỏ trống số điện thoại vẫn gửi được. Ba câu hỏi đều cần chọn một đáp án.</p>
      {success && <p className="success" role="status">{success}</p>}{error && <p className="error" role="alert">{error}</p>}
    </form>
    <p className="hint">Thông tin tự khai từ người chứng kiến, không phải kết luận y khoa. Nếu TNV chưa mở ứng dụng, bản thử nghiệm này chưa bảo đảm thông báo nền.</p>
  </main>;
}
