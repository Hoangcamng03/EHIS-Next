'use client';
import { useState } from 'react';
import { adminClient, callable, readableError } from '@/lib/firebase-client';

type Overview = {
  checkedAtMs: number;
  counts: {
    dispatching: number;
    accepted: number;
    arrived: number;
    expiredWaiting: number;
  };
  oldestWaiting: { incidentId: string; invitedCount: number; expiresAtMs: number | null }[];
};

export function OperationsOverview() {
  const [data, setData] = useState<Overview>(),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState('');

  async function load() {
    setBusy(true);
    setMessage('');
    try {
      setData(
        (
          await callable<unknown, Overview>(adminClient().functions, 'getOperationsOverview', {
            timeout: 20000,
          })({})
        ).data,
      );
    } catch (e) {
      setMessage(readableError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="report-panel">
      <h2>Tổng quan ca hỗ trợ</h2>
      <p className="hint">
        Xem nhanh số ca đang chờ và đang được xử lý. Không hiển thị bệnh án, SĐT hay tọa độ GPS.
      </p>
      <button className="primary" disabled={busy} onClick={() => void load()}>
        {busy ? 'Đang cập nhật…' : 'Cập nhật tình trạng ca'}
      </button>
      {data && (
        <>
          <p className="hint">
            Cập nhật lúc {new Date(data.checkedAtMs).toLocaleTimeString('vi-VN')}.
          </p>
          <dl className="operations-counts">
            {(
              [
                ['Ca đang chờ TNV', data.counts.dispatching],
                ['Đang có TNV nhận', data.counts.accepted],
                ['Đã xác nhận đến', data.counts.arrived],
              ] as const
            ).map(([name, value]) => (
              <div key={name}>
                <dt>{name}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          {!!data.oldestWaiting.length && (
            <>
              <h3>Ca đang chờ cần chú ý</h3>
              <ul>
                {data.oldestWaiting.map((c) => (
                  <li key={c.incidentId}>
                    Ca {c.incidentId.slice(0, 10)} · {c.invitedCount} lời mời ·{' '}
                    {c.expiresAtMs && c.expiresAtMs <= data.checkedAtMs
                      ? 'Đã quá hạn · cần kiểm tra'
                      : `Hạn nhận ${c.expiresAtMs ? new Date(c.expiresAtMs).toLocaleTimeString('vi-VN') : 'chưa rõ'}`}
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
      {message && <p role="status">{message}</p>}
    </section>
  );
}
