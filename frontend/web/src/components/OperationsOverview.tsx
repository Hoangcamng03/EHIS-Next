'use client';
import { useState } from 'react';
import { adminClient, callable, readableError } from '@/lib/firebase-client';
type Overview = { checkedAtMs: number; counts: { dispatching: number; accepted: number; arrived: number; expiredWaiting: number; pendingNotifications: number; dueNotifications: number; expiredPendingNotifications: number; failedNotifications: number }; oldestWaiting: { incidentId: string; invitedCount: number; expiresAtMs: number | null }[]; pushEnabled: boolean };
export function OperationsOverview() {
  const [data, setData] = useState<Overview>(), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  async function load(retry = false) {
    setBusy(true); setMessage('');
    try {
      if (retry) { const r = await callable<unknown, { skipped?: boolean; scanned?: number; acceptedByFcm?: number }>(adminClient().functions, 'retryPendingNotifications', { timeout: 25000 })({}); setMessage(r.data.skipped ? 'Môi trường này không gửi FCM thật.' : `Đã kiểm tra ${r.data.scanned || 0} lượt gửi; FCM chấp nhận ${r.data.acceptedByFcm || 0}. Chưa xác nhận điện thoại đã nhận hoặc reo.`); }
      setData((await callable<unknown, Overview>(adminClient().functions, 'getOperationsOverview', { timeout: 20000 })({})).data);
    } catch (e) { setMessage(readableError(e)); } finally { setBusy(false); }
  }
  return <section className="report-panel"><h2>Theo dõi buổi diễn tập</h2><p className="hint">Người phụ trách kiểm tra ca chờ và lượt gửi lỗi. Không hiển thị bệnh án, số điện thoại hay GPS ở đây.</p><button className="primary" disabled={busy} onClick={() => load()}>{busy ? 'Đang cập nhật…' : 'Cập nhật tình trạng ca'}</button>
    {data && <><p className="hint">Tải lúc {new Date(data.checkedAtMs).toLocaleTimeString('vi-VN')} · Bấm cập nhật để xem thay đổi.</p><dl className="operations-counts">{([['Ca chờ chưa đóng',data.counts.dispatching],['Đã có người nhận',data.counts.accepted],['Đã xác nhận đến',data.counts.arrived],['Ca chờ đã quá hạn',data.counts.expiredWaiting],['Lượt gửi chưa đóng',data.counts.pendingNotifications],['Lượt gửi đã quá hạn',data.counts.expiredPendingNotifications],['Lượt gửi đến hạn thử lại',data.counts.dueNotifications],['Lượt gửi lỗi / hết hạn',data.counts.failedNotifications]] as const).map(([name,value])=><div key={name}><dt>{name}</dt><dd>{value}</dd></div>)}</dl>
      {!!data.oldestWaiting.length && <><h3>Năm ca chờ gần hết hạn nhất</h3><ul>{data.oldestWaiting.map(c=><li key={c.incidentId}>Ca {c.incidentId.slice(0,10)} · {c.invitedCount} lời mời · {c.expiresAtMs && c.expiresAtMs <= data.checkedAtMs ? 'Đã quá hạn · cần người phụ trách kiểm tra' : `Hạn nhận ${c.expiresAtMs ? new Date(c.expiresAtMs).toLocaleTimeString('vi-VN') : 'chưa rõ'}`}</li>)}</ul></>}
      <button className="secondary" disabled={busy || !data.pushEnabled || !data.counts.dueNotifications} onClick={() => load(true)}>Thử lại thông báo đến hạn</button><p className="hint">Tối đa 20 lượt mỗi lần, giữ thời hạn và quyền nhận ca. Đây là thao tác có người trực, chưa phải cơ chế gửi lại liên tục.</p></>}
    {message && <p role="status">{message}</p>}
  </section>;
}
