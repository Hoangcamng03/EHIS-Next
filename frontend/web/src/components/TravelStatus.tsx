import { travelState, type TravelProgress } from '@/lib/travel-progress';
const obstacles: Record<string, string> = { traffic: 'Giao thông/đường đi', vehicle: 'Phương tiện', cannot_continue: 'Không thể tiếp tục; cần liên hệ bàn giao', other: 'Trở ngại khác' };
export function TravelStatus({ progress, acceptedAtMs, now }: { progress?: TravelProgress | null; acceptedAtMs?: number | null; now: number }) {
  const state = travelState(progress, acceptedAtMs, now);
  return <section className={state.needsAttention ? 'notice' : 'status-banner'} aria-label="Tiến độ tình nguyện viên"><strong>{state.title}</strong>
    {progress?.state === 'going' && !!progress.etaAtMs && <p>Dự kiến đến khoảng {new Date(progress.etaAtMs).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} · do TNV xác nhận, có thể thay đổi.</p>}
    {!!progress?.firstEtaAtMs && progress.firstEtaAtMs !== progress.etaAtMs && <p>Mốc dự kiến ban đầu: {new Date(progress.firstEtaAtMs).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} · không xóa khi đổi giờ.</p>}
    {progress?.state === 'blocked' && <p>{obstacles[progress.obstacle || 'other'] || obstacles.other}. Người hiện tại vẫn phụ trách cho đến khi bàn giao được xác nhận.</p>}
    {progress && <p className="hint">{state.stale ? 'Chưa có cập nhật kết nối mới từ app TNV.' : `App TNV kết nối lúc ${new Date(progress.checkInAtMs).toLocaleTimeString('vi-VN')}.`} Đây không phải xác nhận vị trí hoặc đã đến nơi.</p>}
    {state.needsAttention && <p role="alert">Cần người phụ trách liên hệ kiểm tra. Không tự chuyển hoặc kết thúc ca vì quá giờ.</p>}
  </section>;
}
