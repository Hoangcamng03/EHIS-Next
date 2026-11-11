'use client';
import { dutyContact } from '@/lib/duty-contact';
export function DutyContact({ urgent = false }: { urgent?: boolean }) {
  const contact = dutyContact(process.env.NEXT_PUBLIC_DUTY_CONTACT_NAME, process.env.NEXT_PUBLIC_DUTY_CONTACT_PHONE);
  if (!contact && !urgent) return null;
  return <section className={urgent ? 'report-panel awaiting-help' : 'report-panel'} aria-label="Đầu mối hoạt động hỗ trợ"><h2>Người phụ trách hoạt động hỗ trợ</h2>{contact ? <><p>{contact.name}</p><a className="primary" href={contact.href}>Gọi đầu mối · {contact.phone}</a><p className="hint">Dùng khi cần người phụ trách hỗ trợ. Cuộc gọi do thiết bị của bạn thực hiện.</p></> : <p>Chưa cấu hình đầu mối trực. Báo trực tiếp người phụ trách hoạt động hỗ trợ; không tiếp tục chờ ứng dụng nếu cần hỗ trợ ngay.</p>}</section>;
}
