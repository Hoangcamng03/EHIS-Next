export const PUSH_CHANNEL = 'ehis_emergency_v1';
// The lock screen never receives names, health answers, phone numbers or GPS.
export function pushMessage(incidentId: string, kind: string, expiresAt: number, now: number) {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(incidentId) || !['request', 'update', 'location'].includes(kind) || expiresAt <= now) throw new Error('invalid-push');
  return { notification: { title: kind === 'request' ? 'EHIS · Có yêu cầu hỗ trợ' : 'EHIS · Ca hỗ trợ có cập nhật', body: 'Mở EHIS để xem và xác nhận trạng thái mới nhất.' },
    data: { incidentId, screen: 'volunteer', kind }, android: { priority: 'HIGH', ttl: `${Math.max(1, Math.min(600, Math.floor((expiresAt - now) / 1000)))}s`,
      notification: { channel_id: PUSH_CHANNEL, sound: 'emergency_tone', tag: `ehis-${incidentId}`, visibility: 'PRIVATE', notification_priority: 'PRIORITY_HIGH', default_vibrate_timings: true } } };
}
export function validPushToken(value: unknown): value is string { return typeof value === 'string' && value.length >= 20 && value.length <= 4096 && /^[A-Za-z0-9_:.-]+$/.test(value); }
