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
import {
  readPendingRequest,
  isDefinitiveRequestRejection,
  type PendingRequest,
} from '@/lib/pending-request';
export function RequestHelp({ cardId }: { cardId: string }) {
  const router = useRouter();
  const locationAbort = useRef<AbortController | null>(null);
  const epoch = useRef(0);
  useEffect(
    () => () => {
      epoch.current++;
      locationAbort.current?.abort();
    },
    [],
  );
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
  const [restoring, setRestoring] = useState(true);
  const [locating, setLocating] = useState(false);
  const locked = busy || restoring || retryPending !== null;
  useEffect(() => {
    let cancelled = false;
    const auth = firebaseClient().auth;
    auth
      .authStateReady()
      .then(() => {
        if (cancelled || !auth.currentUser) return;
        const key = `ehis-request:${auth.currentUser.uid}:${cardId}`;
        try {
          const raw = sessionStorage.getItem(key);
          const pending = raw ? readPendingRequest(JSON.parse(raw)) : null;
          if (pending) {
            pendingRequest.current = pending;
            setRetryPending(pending);
          } else if (raw) sessionStorage.removeItem(key);
        } catch {
          try {
            sessionStorage.removeItem(key);
          } catch {
            /* Storage may be unavailable. */
          }
        }
      })
      .catch(() => {
        if (!cancelled) setError('Chưa khôi phục được phiên. Kiểm tra kết nối rồi thử gửi lại.');
      })
      .finally(() => {
        if (!cancelled) setRestoring(false);
      });
    return () => {
      cancelled = true;
    };
  }, [cardId]);
  function clearPending(key?: string) {
    pendingRequest.current = null;
    setRetryPending(null);
    if (key)
      try {
        sessionStorage.removeItem(key);
      } catch {
        /* In-memory fallback. */
      }
  }
  function cancelGps() {
    epoch.current++;
    locationAbort.current?.abort();
    setLocating(false);
    setBusy(false);
    setError('');
    setMessage('Đã dừng lấy GPS. Chưa gửi yêu cầu hỗ trợ.');
  }
  async function send(recover = false) {
    if (
      busy ||
      restoring ||
      !online ||
      (!recover && (!confirmed || (mode === 'remote' && (!point || address.trim().length < 5))))
    )
      return;
    setBusy(true);
    setError('');
    setMessage('Đang chuẩn bị yêu cầu…');
    const current = ++epoch.current;
    let storageKey: string | undefined;
    try {
      const uid = await reporterSession();
      if (current !== epoch.current) return;
      const key = `ehis-request:${uid}:${cardId}`;
      storageKey = key;
      let stored: string | null = null;
      try {
        stored = sessionStorage.getItem(key);
      } catch {
        /* Private browsing may disable storage; keep the in-memory retry instead. */
      }
      let pending: PendingRequest;
      if (stored) {
        try {
          pendingRequest.current = readPendingRequest(JSON.parse(stored));
          if (!pendingRequest.current) sessionStorage.removeItem(key);
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
        setLocating(mode === 'nearby');
        const location =
          mode === 'remote'
            ? point!
            : confirmedPoint(
                await accuratePosition((locationAbort.current = new AbortController()).signal),
                Date.now(),
              );
        if (current !== epoch.current) return;
        setLocating(false);
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
      if (current !== epoch.current) return;
      if (!['dispatching', 'accepted', 'arrived'].includes(result.data.status)) {
        clearPending(key);
        setConfirmed(false);
        setError(
          'Yêu cầu trước đã kết thúc hoặc hết hạn. Bấm gửi lần nữa nếu bạn muốn tạo một yêu cầu mới.',
        );
        setMessage('');
        setBusy(false);
        return;
      }
      clearPending(key);
      router.push(`/report?id=${encodeURIComponent(result.data.incidentId)}`);
    } catch (err) {
      if (current !== epoch.current) return;
      // A rejection of a retry cannot prove that the earlier uncertain call
      // was not committed. Keep its ID until the server resolves that request.
      if (!recover && isDefinitiveRequestRejection(err)) clearPending(storageKey);
      else if (pendingRequest.current) setRetryPending(pendingRequest.current);
      setError(
        err instanceof Error && err.message === 'location'
          ? 'Chưa có GPS đủ chính xác (sai số tối đa 30 m). Cho phép vị trí chính xác, ra nơi thoáng và thử lại; hoặc chọn điểm bệnh nhân trên bản đồ.'
          : readableError(err),
      );
      setMessage('');
      setBusy(false);
    } finally {
      if (current === epoch.current) {
        setBusy(false);
        setLocating(false);
      }
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
            disabled={locked}
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
            disabled={locked}
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
                disabled={locked}
                onChange={(e) => {
                  setAddress(e.target.value);
                  setConfirmed(false);
                }}
                placeholder="Nhập địa chỉ rõ ràng, không nhập bệnh án"
              />
            </label>
            <PatientPointPicker
              value={point}
              disabled={locked}
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
            disabled={locked}
          />
          {mode === 'nearby'
            ? 'Tôi đang ở cùng vị trí với bệnh nhân.'
            : 'Tôi đã xác nhận địa chỉ và ghim đúng vị trí bệnh nhân.'}
        </label>
        <button
          className="primary emergency-action"
          onClick={() => send()}
          disabled={
            locked ||
            !confirmed ||
            !online ||
            (mode === 'remote' && (!point || address.trim().length < 5))
          }
        >
          {locating ? 'Đang lấy GPS…' : busy ? 'Đang gửi…' : 'Gửi yêu cầu hỗ trợ'}
        </button>
        {restoring && <p role="status">Đang kiểm tra yêu cầu trước…</p>}
        {locating && (
          <button type="button" className="secondary" onClick={cancelGps}>
            Hủy lấy GPS
          </button>
        )}
        <p className="hint">Chưa cần nhập số điện thoại hay trả lời câu hỏi ở bước này.</p>
        {retryPending && (
          <div className="notice">
            <p>
              Yêu cầu trước dùng{' '}
              {retryPending.locationSource === 'patient_pin' ? 'ghim bệnh nhân' : 'GPS đã xác nhận'}
              : {retryPending.patientAddress || 'điểm đã gửi'}. Chưa rõ máy chủ đã nhận chưa. Kiểm
              tra yêu cầu này trước; hệ thống giữ nguyên điểm và không tạo mã yêu cầu khác.
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
