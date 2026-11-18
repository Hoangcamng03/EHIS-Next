'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  callable as httpsCallable,
  firebaseClient,
  readableError,
  reporterSession,
} from '@/lib/firebase-client';
import { PatientPointPicker } from './PatientPointPicker';
import { DutyContact } from './DutyContact';
import { useOnline } from '@/lib/use-online';
import { accuratePosition } from '@/lib/accurate-position';
import { confirmedPoint } from '@/lib/location-fix';

type PendingRequest = {
  requestId: string;
  location: { latitude: number; longitude: number };
  locationSource?: 'reporter_gps' | 'patient_pin';
  patientAddress?: string;
  destinationConfirmed?: boolean;
};
export function RequestHelp({ cardId }: { cardId: string }) {
  const router = useRouter();
  const locationAbort = useRef<AbortController | null>(null);
  useEffect(() => () => locationAbort.current?.abort(), []);
  const online = useOnline();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [mode, setMode] = useState<'nearby' | 'remote'>('nearby');
  const [point, setPoint] = useState<{ latitude: number; longitude: number } | null>(null),
    [address, setAddress] = useState('');
  const pendingRequest = useRef<PendingRequest | null>(null);
  const [retryPending, setRetryPending] = useState<PendingRequest | null>(null);
  async function send(recover = false) {
    if (
      busy ||
      !online ||
      (!recover && (!confirmed || (mode === 'remote' && (!point || address.trim().length < 5))))
    )
      return;
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
      if (pendingRequest.current && !recover) {
        setRetryPending(pendingRequest.current);
        setMessage(
          'Có yêu cầu trước chưa xác nhận. Kiểm tra lại yêu cầu đó trước để tránh tạo trùng hoặc đổi nhầm điểm.',
        );
        setBusy(false);
        return;
      }
      if (pendingRequest.current) pending = pendingRequest.current;
      else {
        setMessage('Đang lấy vị trí bạn đã xác nhận…');
        const location =
          mode === 'remote'
            ? point!
            : confirmedPoint(
                await accuratePosition((locationAbort.current = new AbortController()).signal),
                Date.now(),
              );
        pending = {
          requestId: crypto.randomUUID(),
          location,
          locationSource: mode === 'remote' ? 'patient_pin' : 'reporter_gps',
          ...(mode === 'remote'
            ? { patientAddress: address.trim(), destinationConfirmed: true }
            : {}),
        };
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
          ? 'Chưa có GPS đủ chính xác (sai số tối đa 30 m). Cho phép vị trí chính xác, ra nơi thoáng và thử lại; hoặc chọn điểm bệnh nhân trên bản đồ.'
          : readableError(err),
      );
      setMessage('');
      setBusy(false);
    }
  }
  return (
    <main className="report-page role-reporter">
      <div className="report-brand">
        EHIS <span>Người báo tin</span>
      </div>

      {!online && (
        <p className="error" role="alert">
          Thiết bị đang báo mất mạng. Chưa gửi được yêu cầu qua EHIS. Bạn vẫn có thể dùng điện thoại
          để gọi trợ giúp.
        </p>
      )}

      <h1>Báo hỗ trợ</h1>
      <p className="report-intro">Gửi vị trí bệnh nhân đến tình nguyện viên gần đó.</p>
      <section className="report-panel">
        <h2>Bạn đang ở cạnh bệnh nhân?</h2>
        <div className="location-choice" role="group" aria-label="Bạn có ở cạnh bệnh nhân không?">
          <button
            type="button"
            className={mode === 'nearby' ? 'primary' : 'secondary'}
            disabled={busy}
            aria-pressed={mode === 'nearby'}
            onClick={() => {
              setMode('nearby');
              setConfirmed(false);
            }}
          >
            Có, dùng GPS của tôi
          </button>
          <button
            type="button"
            className={mode === 'remote' ? 'primary' : 'secondary'}
            disabled={busy}
            aria-pressed={mode === 'remote'}
            onClick={() => {
              setMode('remote');
              setConfirmed(false);
            }}
          >
            Không, chọn điểm bệnh nhân
          </button>
        </div>
        {mode === 'remote' ? (
          <>
            <label className="phone-label">
              Địa chỉ / cổng / tầng / điểm hẹn của bệnh nhân
              <input
                maxLength={240}
                value={address}
                disabled={busy}
                onChange={(e) => {
                  setAddress(e.target.value);
                  setConfirmed(false);
                }}
                placeholder="Nhập địa chỉ rõ ràng, không nhập bệnh án"
              />
            </label>
            <PatientPointPicker
              value={point}
              disabled={busy}
              onChange={(value) => {
                setPoint(value);
                setConfirmed(false);
              }}
            />
            <p className="hint">
              Địa chỉ mô tả không tự đổi thành tọa độ. Xác nhận ghim với người tại chỗ; GPS của bạn
              không được dùng làm điểm bệnh nhân.
            </p>
          </>
        ) : (
          <p>GPS điện thoại sẽ là điểm bệnh nhân khi bạn xác nhận ở cùng vị trí.</p>
        )}
        <label className="confirm">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            disabled={busy}
          />
          {mode === 'nearby'
            ? 'Tôi đang ở cùng vị trí với bệnh nhân.'
            : 'Tôi đã xác nhận địa chỉ và ghim đúng vị trí bệnh nhân.'}
        </label>
        <button
          className="primary emergency-action"
          onClick={() => send()}
          disabled={
            busy ||
            !confirmed ||
            !online ||
            (mode === 'remote' && (!point || address.trim().length < 5))
          }
        >
          {busy ? 'Đang gửi…' : 'Gửi yêu cầu hỗ trợ'}
        </button>
        <p className="hint">Chưa cần nhập số điện thoại hay trả lời câu hỏi ở bước này.</p>
        {retryPending && (
          <div className="notice">
            <p>
              Yêu cầu trước dùng{' '}
              {retryPending.locationSource === 'patient_pin' ? 'ghim bệnh nhân' : 'GPS đã xác nhận'}
              : {retryPending.patientAddress || 'điểm đã gửi'}. Chỉnh biểu mẫu không đổi yêu cầu
              đang chờ.
            </p>
            <button
              className="secondary"
              type="button"
              disabled={busy || !online}
              onClick={() => send(true)}
            >
              Kiểm tra yêu cầu trước
            </button>
          </div>
        )}
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
