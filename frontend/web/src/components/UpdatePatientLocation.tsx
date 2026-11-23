'use client';
import { useEffect, useRef, useState } from 'react';
import { callable, firebaseClient, readableError } from '@/lib/firebase-client';
import { PatientPointPicker } from './PatientPointPicker';
import { accuratePosition } from '@/lib/accurate-position';
import { confirmedPoint } from '@/lib/location-fix';

type Candidate = {
  location: { latitude: number; longitude: number };
  accuracy: number;
  timestamp: number;
  updateId: string;
};
type PendingUpdate = {
  incidentId: string;
  updateId: string;
  location: Candidate['location'];
  locationSource: 'patient_pin' | 'reporter_gps';
  patientAddress?: string;
  destinationConfirmed?: boolean;
  locationFix?: { accuracyMeters: number; capturedAtMs: number };
};
export function UpdatePatientLocation({
  incidentId,
  enabled,
}: {
  incidentId: string;
  enabled: boolean;
}) {
  const [candidate, setCandidate] = useState<Candidate | null>(null),
    [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [message, setMessage] = useState('');
  const [remote, setRemote] = useState(false),
    [address, setAddress] = useState('');
  const [pending, setPending] = useState<PendingUpdate | null>(null);
  const [locating, setLocating] = useState(false);
  const locked = busy || !enabled || pending !== null;
  const epoch = useRef(0);
  const locationAbort = useRef<AbortController | null>(null);
  useEffect(
    () => () => {
      epoch.current++;
      locationAbort.current?.abort();
    },
    [],
  );
  async function locate() {
    if (locked) return;
    const id = ++epoch.current;
    setBusy(true);
    setLocating(true);
    setError('');
    setMessage('');
    setCandidate(null);
    setConfirmed(false);
    try {
      locationAbort.current?.abort();
      const position = await accuratePosition(
        (locationAbort.current = new AbortController()).signal,
      );
      if (id !== epoch.current) return;
      const location = confirmedPoint(position, Date.now());
      setCandidate({
        location,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
        updateId: crypto.randomUUID(),
      });
    } catch {
      if (id === epoch.current)
        setError(
          'Chưa có vị trí đủ chính xác. Cho phép vị trí, ra nơi thoáng và thử lại. Điểm cũ chưa thay đổi.',
        );
    } finally {
      if (id === epoch.current) {
        setBusy(false);
        setLocating(false);
      }
    }
  }
  function cancelLocation() {
    epoch.current++;
    locationAbort.current?.abort();
    setBusy(false);
    setLocating(false);
    setMessage('Đã dừng lấy GPS. Điểm bệnh nhân chưa thay đổi.');
  }
  async function send() {
    if (busy || !enabled) return;
    let payload = pending;
    if (!payload) {
      if (!candidate || !confirmed || (remote && address.trim().length < 5)) return;
      if (!remote) {
        try {
          confirmedPoint(
            {
              coords: { ...candidate.location, accuracy: candidate.accuracy },
              timestamp: candidate.timestamp,
            },
            Date.now(),
          );
        } catch {
          setError('GPS đã quá 10 giây hoặc chưa đủ chính xác. Lấy lại GPS và xác nhận điểm mới.');
          return;
        }
      }
      payload = {
        incidentId,
        updateId: candidate.updateId,
        location: candidate.location,
        locationSource: remote ? 'patient_pin' : 'reporter_gps',
        ...(remote
          ? { patientAddress: address.trim(), destinationConfirmed: true }
          : {
              locationFix: {
                accuracyMeters: candidate.accuracy,
                capturedAtMs: candidate.timestamp,
              },
            }),
      };
      setPending(payload);
    }
    setBusy(true);
    setError('');
    try {
      await callable(firebaseClient().functions, 'updateIncidentLocation', { timeout: 20000 })(
        payload,
      );
      setMessage('Máy chủ đã cập nhật điểm bệnh nhân và báo lại TNV phụ trách.');
      setPending(null);
      setCandidate(null);
      setConfirmed(false);
    } catch (err) {
      setError(readableError(err));
      if (
        [
          'functions/invalid-argument',
          'functions/failed-precondition',
          'functions/permission-denied',
          'functions/not-found',
          'functions/unauthenticated',
        ].includes((err as { code?: string }).code || '')
      )
        setPending(null);
    } finally {
      setBusy(false);
    }
  }
  return (
    <details className="report-panel">
      <summary style={{ minHeight: 56, cursor: 'pointer', fontWeight: 700 }}>
        Bệnh nhân đã đổi vị trí? Cập nhật điểm
      </summary>
      <p>
        Xác nhận điểm bệnh nhân với người tại chỗ. Điện thoại người báo di chuyển không tự đổi điểm
        đến.
      </p>
      <label className="confirm">
        <input
          type="checkbox"
          checked={remote}
          disabled={locked}
          onChange={(e) => {
            epoch.current++;
            setRemote(e.target.checked);
            setCandidate(null);
            setConfirmed(false);
          }}
        />
        Tôi ở xa, chọn điểm do người tại chỗ cung cấp
      </label>
      {remote ? (
        <>
          <label>
            Địa chỉ bệnh nhân
            <input
              value={address}
              disabled={locked}
              maxLength={240}
              onChange={(e) => {
                setAddress(e.target.value);
                setConfirmed(false);
              }}
            />
          </label>
          <PatientPointPicker
            value={candidate?.location ?? null}
            disabled={locked}
            onChange={(location) => {
              setCandidate({
                location,
                accuracy: 0,
                timestamp: Date.now(),
                updateId: crypto.randomUUID(),
              });
              setConfirmed(false);
            }}
          />
        </>
      ) : (
        <>
          <button className="secondary" type="button" disabled={locked} onClick={locate}>
            {locating ? 'Đang xử lý vị trí…' : 'Lấy GPS để xác nhận điểm mới'}
          </button>
          {locating && (
            <button className="secondary" type="button" onClick={cancelLocation}>
              Hủy lấy GPS
            </button>
          )}
        </>
      )}
      {candidate && !pending && (
        <>
          <p>
            Điểm mới: {candidate.location.latitude.toFixed(6)},{' '}
            {candidate.location.longitude.toFixed(6)}
            {!remote && <> · sai số ước tính ±{Math.round(candidate.accuracy)} m</>}.
          </p>
          <label className="confirm">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
              disabled={busy || !enabled}
            />
            {remote
              ? 'Tôi đã kiểm tra địa chỉ và ghim bệnh nhân với người tại chỗ.'
              : 'Tôi đang ở cạnh bệnh nhân và xác nhận dùng điểm mới này.'}
          </label>
          <button
            className="primary"
            type="button"
            disabled={!enabled || busy || !confirmed || (remote && address.trim().length < 5)}
            onClick={send}
          >
            Xác nhận đổi điểm và báo TNV
          </button>
        </>
      )}
      {pending && (
        <div className="notice" role="status">
          <p>
            {busy
              ? 'Đang xác nhận điểm mới với máy chủ…'
              : 'Chưa rõ kết quả lần gửi trước. Kiểm tra lại trước khi chọn điểm khác; hệ thống giữ nguyên thông tin đã gửi.'}
          </p>
          {!busy && (
            <button className="secondary" type="button" disabled={!enabled} onClick={send}>
              Kiểm tra lần gửi trước
            </button>
          )}
        </div>
      )}
      {!!error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {!!message && (
        <p role="status" className="success">
          {message}
        </p>
      )}
    </details>
  );
}
