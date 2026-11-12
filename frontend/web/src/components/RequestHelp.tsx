'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  callable as httpsCallable,
  firebaseClient,
  readableError,
  reporterSession,
} from '@/lib/firebase-client';
import { DutyContact } from './DutyContact';
import { EmergencyCall } from './EmergencyCall';
import { useOnline } from '@/lib/use-online';
import { confirmedPoint } from '@/lib/location-fix';

type PendingRequest = { requestId: string; location: { latitude: number; longitude: number } };
export function RequestHelp({ cardId }: { cardId: string }) {
  const router = useRouter();
  const online = useOnline();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const pendingRequest = useRef<PendingRequest | null>(null);
  async function send() {
    if (busy || !online) return;
    setBusy(true);
    setError('');
    setMessage('Đang chuẩn bị yêu cầu…');
    try {
      const uid = await reporterSession();
      const key = `ehis-request:${uid}:${cardId}`;
      let stored: string | null = null;
      try {
        stored = sessionStorage.getItem(key);
      } catch {
        /* Private browsing may disable storage; keep the in-memory retry instead. */
      }
      let pending: PendingRequest;
      if (stored) {
        try {
          pendingRequest.current = JSON.parse(stored) as PendingRequest;
        } catch {
          try {
            sessionStorage.removeItem(key);
          } catch {
            /* In-memory fallback. */
          }
        }
      }
      if (pendingRequest.current) pending = pendingRequest.current;
      else {
        setMessage('Đang lấy vị trí bạn đã xác nhận…');
        const location = await new Promise<{ latitude: number; longitude: number }>(
          (resolve, reject) => {
            if (!navigator.geolocation) return reject(new Error('location'));
            navigator.geolocation.getCurrentPosition(
              (position) => {
                try {
                  resolve(confirmedPoint(position, Date.now()));
                } catch (error) {
                  reject(error);
                }
              },
              () => reject(new Error('location')),
              { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
            );
          },
        );
        pending = { requestId: crypto.randomUUID(), location };
        pendingRequest.current = pending;
        // Persist the exact request for safe retries; never store a phone here.
        try {
          sessionStorage.setItem(key, JSON.stringify(pending));
        } catch {
          /* Retry still works while this page remains open. */
        }
      }
      setMessage('Đang gửi đến máy chủ…');
      const result = await httpsCallable<
        PendingRequest & { cardId: string },
        { incidentId: string; status: string }
      >(firebaseClient().functions, 'createIncident', { timeout: 20000 })({ ...pending, cardId });
      if (!['dispatching', 'accepted', 'arrived'].includes(result.data.status)) {
        pendingRequest.current = null;
        try {
          sessionStorage.removeItem(key);
        } catch {
          /* In-memory fallback. */
        }
        setError(
          'Yêu cầu trước đã kết thúc hoặc hết hạn. Bấm gửi lần nữa nếu bạn muốn tạo một yêu cầu mới.',
        );
        setMessage('');
        setBusy(false);
        return;
      }
      pendingRequest.current = null;
      try {
        sessionStorage.removeItem(key);
      } catch {
        /* Backend ownership/card lock also prevents duplicates after acknowledgement. */
      }
      router.push(`/report?id=${encodeURIComponent(result.data.incidentId)}`);
    } catch (err) {
      setError(
        err instanceof Error && err.message === 'location'
          ? 'Chưa lấy được vị trí. Cho phép quyền vị trí và thử lại tại nơi có bệnh nhân.'
          : readableError(err),
      );
      setMessage('');
      setBusy(false);
    }
  }
  return (
    <main className="report-page role-reporter">
      <EmergencyCall />
      <div className="report-brand">
        EHIS <span>Người báo tin</span>
      </div>

      {!online && (
        <p className="error" role="alert">
          Thiết bị đang báo mất mạng. Chưa gửi được yêu cầu qua EHIS. Bạn vẫn có thể dùng điện thoại
          để gọi trợ giúp.
        </p>
      )}
      <p className="step">Bước 1 / 2 · Báo hỗ trợ</p>
      <h1>Báo hỗ trợ</h1>
      <p className="report-intro">Gửi vị trí đến TNV gần bạn. Bổ sung tình trạng ở bước sau.</p>
      <section className="report-panel">
        <h2>Bạn đang ở cạnh bệnh nhân?</h2>
        <p>Chỉ gửi khi đang ở cạnh bệnh nhân. Vị trí điện thoại sẽ là điểm cần hỗ trợ.</p>
        <label className="confirm">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            disabled={busy}
          />
          Tôi đang ở cùng vị trí với bệnh nhân.
        </label>
        <button
          className="primary emergency-action"
          onClick={send}
          disabled={busy || !confirmed || !online}
        >
          {busy ? 'Đang gửi…' : 'Báo tình nguyện viên gần đây'}
        </button>
        <p className="hint">Chưa cần nhập số điện thoại hay trả lời câu hỏi ở bước này.</p>
        {message && <p role="status">{message}</p>}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </section>
      <DutyContact urgent={!online || !!error} />
      <p className="hint">
        Yêu cầu gửi thành công không đồng nghĩa đã có TNV nhận ca. Đây là hỗ trợ cộng đồng, không
        thay thế dịch vụ cấp cứu.
      </p>
    </main>
  );
}
