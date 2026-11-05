import { createHash } from 'node:crypto';
export type DeviceReceipt = { key: string; status: 'accepted' | 'invalid-token' | 'invalid-request'; at: number };
export const pushDeviceKey = (token: string) => createHash('sha256').update(token).digest('hex');
export function pendingPushDevices(devices: { token: string; updatedAt: number }[], receipts: DeviceReceipt[], now: number, target?: string) {
  const terminal = new Set(receipts.map(item => item.key));
  return devices.filter(item => typeof item.token === 'string' && Number.isFinite(item.updatedAt) && now - item.updatedAt <= 30 * 86400000 && item.updatedAt <= now + 60000)
    .map(item => ({ token: item.token, key: pushDeviceKey(item.token) }))
    .filter((item, i, all) => (!target || item.key === target) && !terminal.has(item.key) && all.findIndex(other => other.key === item.key) === i).slice(0, 3);
}
