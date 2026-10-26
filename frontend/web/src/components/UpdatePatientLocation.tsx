'use client';
import { useEffect, useRef, useState } from 'react';
import { callable, firebaseClient, readableError } from '@/lib/firebase-client';
import { confirmedPoint } from '@/lib/location-fix';

type Candidate = { location: { latitude: number; longitude: number }; accuracy: number; timestamp: number; updateId: string };
export function UpdatePatientLocation({ incidentId, enabled }: { incidentId: string; enabled: boolean }) {
  const [candidate, setCandidate] = useState<Candidate | null>(null), [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('');
  const epoch = useRef(0);
  useEffect(() => () => { epoch.current++; }, []);
  async function locate() {
    const id = ++epoch.current; setBusy(true); setError(''); setMessage(''); setCandidate(null); setConfirmed(false);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }));
      if (id !== epoch.current) return;
      const location = confirmedPoint(position, Date.now());
      setCandidate({ location, accuracy: position.coords.accuracy, timestamp: position.timestamp, updateId: crypto.randomUUID() });
    } catch { if (id === epoch.current) setError('Chưa có vị trí đủ chính xác. Cho phép vị trí, ra nơi thoáng và thử lại. Điểm cũ chưa thay đổi.'); }
    finally { if (id === epoch.current) setBusy(false); }
  }
  async function send() {
    if (!candidate || !confirmed || busy || !enabled) return;
    if (Date.now() - candidate.timestamp > 60000) { setError('Điểm vừa lấy đã quá 1 phút. Lấy lại GPS trước khi xác nhận.'); return; }
    setBusy(true); setError('');
    try {
      await callable(firebaseClient().functions, 'updateIncidentLocation', { timeout: 20000 })({ incidentId, updateId: candidate.updateId, location: candidate.location });
      setMessage('Máy chủ đã cập nhật điểm bệnh nhân và báo lại TNV phụ trách.'); setCandidate(null); setConfirmed(false);
    } catch (err) { setError(readableError(err)); }
    finally { setBusy(false); }
  }
  return <details className="report-panel"><summary style={{ minHeight: 56, cursor: 'pointer', fontWeight: 700 }}>Bệnh nhân đã đổi vị trí? Cập nhật điểm</summary><p>Chỉ cập nhật khi bạn đang đứng cạnh bệnh nhân tại điểm mới. Điện thoại của bạn di chuyển không tự làm thay đổi điểm đến.</p>
    <button className="secondary" type="button" disabled={!enabled || busy} onClick={locate}>{busy ? 'Đang xử lý vị trí…' : 'Lấy GPS để xác nhận điểm mới'}</button>
    {candidate && <><p>Điểm mới: {candidate.location.latitude.toFixed(6)}, {candidate.location.longitude.toFixed(6)} · sai số ước tính ±{Math.round(candidate.accuracy)} m.</p><label className="confirm"><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} disabled={busy || !enabled} />Tôi đang ở cạnh bệnh nhân và xác nhận dùng điểm mới này.</label><button className="primary" type="button" disabled={!enabled || busy || !confirmed} onClick={send}>Xác nhận đổi điểm và báo TNV</button></>}
    {!!error && <p role="alert" className="error">{error}</p>}{!!message && <p role="status" className="success">{message}</p>}
  </details>;
}
