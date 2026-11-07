export type TravelProgress = { state: 'going' | 'blocked'; etaAtMs: number | null; firstEtaAtMs?: number | null; obstacle: string | null; revision: number; updatedAtMs: number; checkInAtMs: number };
export function travelState(progress: TravelProgress | null | undefined, acceptedAtMs: number | null | undefined, now: number) {
  if (!progress) return { title: 'TNV đã nhận · chưa xác nhận lên đường', stale: false, overdue: false, needsAttention: !!acceptedAtMs && now - acceptedAtMs > 180000 };
  const stale = !Number.isFinite(progress.checkInAtMs) || now - progress.checkInAtMs > 180000 || progress.checkInAtMs > now + 60000;
  const overdue = progress.state === 'going' && typeof progress.etaAtMs === 'number' && progress.etaAtMs <= now;
  const firstEtaMissed = typeof progress.firstEtaAtMs === 'number' && progress.firstEtaAtMs <= now;
  return { title: progress.state === 'blocked' ? 'TNV báo gặp trở ngại' : overdue ? 'Đã qua giờ đến dự kiến' : firstEtaMissed ? 'TNV đã đổi giờ đến · quá mốc ban đầu' : 'TNV xác nhận đang lên đường', stale, overdue, needsAttention: stale || overdue || firstEtaMissed || progress.state === 'blocked' };
}
