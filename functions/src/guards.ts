import { createHash } from 'node:crypto';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { CallableRequest, HttpsError, onCall } from 'firebase-functions/v2/https';

// A small pilot safeguard, not a substitute for App Check or infrastructure quotas.
export async function enforceRequestBudget(uid: string, operation: string, ip?: string) {
  const db = getFirestore(), minute = Math.floor(Date.now() / 60000);
  const keys = [
    { key: `user:${uid}:${minute}`, limit: 120 },
    ...(operation === 'createIncident' ? [{ key: `create:${uid}:${minute}`, limit: 30 }] : []),
    ...(ip ? [{ key: `ip:${ip}:${minute}`, limit: 600 }] : []),
  ].map(item => ({ ref: db.doc(`_requestLimits/${createHash('sha256').update(item.key).digest('hex')}`), limit: item.limit }));
  await db.runTransaction(async tx => {
    const snapshots = await tx.getAll(...keys.map(item => item.ref));
    if (snapshots.some((item, index) => Number(item.data()?.count || 0) >= keys[index].limit)) throw new HttpsError('resource-exhausted', 'Bạn thao tác quá nhanh. Đợi khoảng một phút rồi thử lại.');
    snapshots.forEach((item, index) => tx.set(keys[index].ref, { count: Number(item.data()?.count || 0) + 1, expiresAt: Timestamp.fromMillis((minute + 60) * 60000) }));
  });
}

export function guardedCall<T>(operation: string, handler: (request: CallableRequest<unknown>) => Promise<T>) {
  return onCall({ enforceAppCheck: process.env.EHIS_ENFORCE_APP_CHECK === 'true' }, async request => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Cần phiên đăng nhập.');
    await enforceRequestBudget(request.auth.uid, operation, request.rawRequest.ip);
    return handler(request);
  });
}
