export function formatCountdown(seconds: number) {
  const value = Number.isFinite(seconds) ? Math.max(0, Math.ceil(seconds)) : 0;
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;
}
export function formatDistance(metres: number) {
  if (!Number.isFinite(metres) || metres < 0) return 'chưa rõ khoảng cách';
  if (metres < 10) return 'dưới 10 m';
  const rounded = Math.round(metres / 10) * 10;
  return rounded < 1000 ? `${rounded} m` : `${(metres / 1000).toFixed(1)} km`;
}
export function formatClock(milliseconds: number) {
  return new Date(milliseconds).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}
