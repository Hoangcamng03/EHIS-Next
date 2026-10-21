'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { httpsCallable } from 'firebase/functions';
import { firebaseClient, readableError, reporterSession } from '@/lib/firebase-client';

type PendingRequest = { requestId: string; location: { latitude: number; longitude: number } };
export function RequestHelp({ cardId }: { cardId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [syntheticLocation, setSyntheticLocation] = useState(false);
  const pendingRequest = useRef<PendingRequest | null>(null);
  const localDemo = process.env.NEXT_PUBLIC_USE_EMULATORS === 'true' && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID === 'demo-ehis-next';
  async function send() {
    setBusy(true); setError(''); setMessage('Đang chuẩn bị yêu cầu…');
    try {
      const uid = await reporterSession();
      const key = `ehis-request:${uid}:${cardId}`;
      let stored: string | null = null;
      try { stored = sessionStorage.getItem(key); } catch { /* Private browsing may disable storage; keep the in-memory retry instead. */ }
      let pending: PendingRequest;
      if (stored) {
        try { pendingRequest.current = JSON.parse(stored) as PendingRequest; }
        catch { try { sessionStorage.removeItem(key); } catch { /* In-memory fallback. */ } }
      }
      if (pendingRequest.current) pending = pendingRequest.current;
      else {
        setMessage('Đang lấy vị trí bạn đã xác nhận…');
        const location = localDemo && syntheticLocation ? { latitude: 10.875, longitude: 106.8 } : await new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
          if (!navigator.geolocation) return reject(new Error('location'));
          navigator.geolocation.getCurrentPosition(position => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }), () => reject(new Error('location')), { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
        });
        pending = { requestId: crypto.randomUUID(), location };
        pendingRequest.current = pending;
        // Persist the exact request for safe retries; never store a phone here.
        try { sessionStorage.setItem(key, JSON.stringify(pending)); } catch { /* Retry still works while this page remains open. */ }
      }
      setMessage('Đang gửi đến máy chủ…');
      const result = await httpsCallable<PendingRequest & { cardId: string }, { incidentId: string; status: string }>(firebaseClient().functions, 'createIncident', { timeout: 20000 })({ ...pending, cardId });
      if (!['dispatching', 'accepted', 'arrived'].includes(result.data.status)) {
        pendingRequest.current = null;
        try { sessionStorage.removeItem(key); } catch { /* In-memory fallback. */ }
        setError('Yêu cầu trước đã kết thúc hoặc hết hạn. Bấm gửi lần nữa nếu bạn muốn tạo một yêu cầu mới.');
        setMessage(''); setBusy(false); return;
      }
      pendingRequest.current = null;
      try { sessionStorage.removeItem(key); } catch { /* Backend ownership/card lock also prevents duplicates after acknowledgement. */ }
      router.push(`/report/${result.data.incidentId}`);
    } catch (err) {
      setError(err instanceof Error && err.message === 'location' ? 'Chưa lấy được vị trí. Cho phép quyền vị trí và thử lại tại nơi có bệnh nhân.' : readableError(err));
      setMessage(''); setBusy(false);
    }
  }
  return <main className="report-page">
    <div className="report-brand">EHIS NEXT <span>HỖ TRỢ CỘNG ĐỒNG</span></div>
    <p className="step">BƯỚC 1 / 2</p><h1>Gửi yêu cầu<br />hỗ trợ.</h1>
    <p className="report-intro">Thông báo trước cho tình nguyện viên gần đây. Sau khi máy chủ nhận yêu cầu, bạn có thể bổ sung tình trạng bệnh nhân.</p>
    <section className="report-panel"><h2>Bạn đang ở cạnh bệnh nhân?</h2>
      <p>Vị trí thiết bị sẽ được dùng làm điểm cần hỗ trợ. Trang này không hiển thị hồ sơ y tế của chủ thẻ.</p>
      <label className="confirm"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} disabled={busy} />Tôi đang ở cùng vị trí với bệnh nhân.</label>
      {localDemo && <label className="confirm"><input type="checkbox" checked={syntheticLocation} onChange={e => setSyntheticLocation(e.target.checked)} disabled={busy} />THỬ NGHIỆM LOCAL: dùng vị trí giả 10.875, 106.8 thay cho GPS.</label>}
      <button className="primary" onClick={send} disabled={busy || !confirmed}>{busy ? 'Đang gửi…' : 'Gửi yêu cầu hỗ trợ →'}</button>
      <p className="hint">Chưa cần nhập số điện thoại hay trả lời câu hỏi ở bước này.</p>
      {message && <p role="status">{message}</p>}{error && <p className="error" role="alert">{error}</p>}
    </section>
    <p className="hint">Yêu cầu gửi thành công không đồng nghĩa đã có TNV nhận ca. Đây là hỗ trợ cộng đồng, không thay thế dịch vụ cấp cứu.</p>
  </main>;
}
