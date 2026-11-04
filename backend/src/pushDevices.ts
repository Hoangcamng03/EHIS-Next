import { createHash } from 'node:crypto';
import { getFirestore } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import { guardedCall } from './guards';
import { validPushToken } from './pushPolicy';
import { verificationInput } from './volunteerVerification';
import { recoverDeviceInvitations } from './pushRecovery';

export const registerVolunteerDevice = guardedCall('registerVolunteerDevice', async request => {
  const data = verificationInput(request.data, ['token', 'enabled', 'replaceToken']);
  if (!validPushToken(data.token) || typeof data.enabled !== 'boolean') throw new HttpsError('invalid-argument', 'Thiết bị không hợp lệ.');
  if (data.replaceToken !== undefined && (!data.enabled || !validPushToken(data.replaceToken))) throw new HttpsError('invalid-argument', 'Mã thay thế không hợp lệ.');
  const uid = request.auth!.uid, token = data.token, db = getFirestore(), key = createHash('sha256').update(token).digest('hex');
  await db.runTransaction(async tx => {
    const ref = db.doc(`pushDevices/${uid}`), owner = db.doc(`pushTokenOwners/${key}`);
    const oldOwner = typeof data.replaceToken === 'string' && data.replaceToken !== token ? db.doc(`pushTokenOwners/${createHash('sha256').update(data.replaceToken).digest('hex')}`) : null;
    const [devices, person, existing, old] = await tx.getAll(ref, db.doc(`volunteers/${uid}`), owner, ...(oldOwner ? [oldOwner] : []));
    if (data.enabled && person.data()?.verificationStatus !== 'approved') throw new HttpsError('permission-denied', 'Chỉ TNV đã duyệt được đăng ký thông báo.');
    if (existing.exists && existing.data()?.uid !== uid) throw new HttpsError('failed-precondition', 'Thiết bị còn gắn với tài khoản khác. Đăng xuất tài khoản cũ trước.');
    if (old?.exists && old.data()?.uid !== uid) throw new HttpsError('permission-denied', 'Không được thay thiết bị của tài khoản khác.');
    const list = ((devices.data()?.devices || []) as { token: string; updatedAt: number }[]).filter(item => item.token !== token && item.token !== data.replaceToken && Date.now() - item.updatedAt < 30 * 86400000);
    if (data.enabled && list.length >= 3) throw new HttpsError('resource-exhausted', 'Tối đa 3 thiết bị. Tắt thông báo trên thiết bị cũ trước.');
    tx.set(ref, { devices: data.enabled ? [...list, { token, updatedAt: Date.now() }] : list });
    if (data.enabled) tx.set(owner, { uid }); else if (existing.data()?.uid === uid) tx.delete(owner);
    if (oldOwner && old?.data()?.uid === uid) tx.delete(oldOwner);
  });
  const recovery = data.enabled ? await recoverDeviceInvitations(uid, key) : { recoveryQueued: 0, recoveryOverflow: false };
  return { registered: data.enabled, pushEnabled: process.env.EHIS_FCM_ENABLED === 'true', ...recovery };
});
