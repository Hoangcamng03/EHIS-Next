import { FieldPath, FieldValue, getFirestore } from 'firebase-admin/firestore';
import { HttpsError, type CallableRequest } from 'firebase-functions/v2/https';
import { guardedCall } from './guards';
import { identifier } from './reportValidation';
import { verificationInput } from './volunteerVerification';
import { volunteerReadiness } from './readiness';
function administrator(auth: CallableRequest<unknown>['auth']) {
  if (auth?.token.admin !== true) throw new HttpsError('permission-denied', 'Chỉ quản trị được quản lý danh sách TNV.');
}
function region(value: unknown, required = false, maximum = 100) {
  if (value === undefined && !required) return '';
  if (typeof value !== 'string' || value.trim().length > maximum || (required && value.trim().length < 2)) throw new HttpsError('invalid-argument', 'Tên khu vực chưa hợp lệ.');
  return value.trim();
}
export const listVolunteerRoster = guardedCall('listVolunteerRoster', async request => {
  administrator(request.auth); const data = verificationInput(request.data, ['serviceArea', 'organisation', 'after']);
  const area = region(data.serviceArea), organisation = region(data.organisation, false, 150);
  let query = getFirestore().collection('volunteers').where('verificationStatus', 'in', ['approved', 'suspended']).orderBy(FieldPath.documentId());
  if (area) query = query.where('serviceArea', '==', area);
  if (organisation) query = query.where('organisation', '==', organisation);
  if (data.after !== undefined) { try { query = query.startAfter(identifier(data.after)); } catch { throw new HttpsError('invalid-argument', 'Mốc tải danh sách không hợp lệ.'); } }
  const page = await query.limit(51).get(), docs = page.docs.slice(0, 50), now = Date.now();
  return { checkedAtMs: now, volunteers: docs.map(doc => { const v = doc.data(); return { uid: doc.id, fullName: v.fullName || 'Tài khoản diễn tập cũ', phone: v.phone || '', homeAddress: v.homeAddress || '', workAddress: v.workAddress || '', organisation: v.organisation || '', serviceArea: v.serviceArea || '', trainingLevel: v.trainingLevel || null, clinicalMonths: v.clinicalMonths ?? null, verificationStatus: v.verificationStatus, verificationPolicyVersion: v.verificationPolicyVersion ?? null, isAvailable: v.isAvailable === true, hasActiveCase: !!v.activeIncidentId, ...volunteerReadiness(v, now) }; }), next: page.size > 50 ? docs.at(-1)!.id : null };
});
export const updateVolunteerRegion = guardedCall('updateVolunteerRegion', async request => {
  administrator(request.auth); const data = verificationInput(request.data, ['uid', 'serviceArea']);
  let uid: string; try { uid = identifier(data.uid); } catch { throw new HttpsError('invalid-argument', 'Mã TNV chưa hợp lệ.'); }
  const serviceArea = region(data.serviceArea, true), db = getFirestore();
  await db.runTransaction(async tx => {
    const ref = db.doc(`volunteers/${uid}`), snapshot = await tx.get(ref);
    if (!snapshot.exists || !['approved', 'suspended'].includes(snapshot.data()?.verificationStatus)) throw new HttpsError('failed-precondition', 'TNV chưa có hồ sơ được duyệt.');
    tx.update(ref, { serviceArea, regionReviewedBy: request.auth!.uid, regionReviewedAt: FieldValue.serverTimestamp() });
    tx.create(db.collection('auditLogs').doc(), { actor: request.auth!.uid, subject: uid, action: 'update-volunteer-region', createdAt: FieldValue.serverTimestamp() });
  });
  return { serviceArea };
});
export const setVolunteerSuspension = guardedCall('setVolunteerSuspension', async request => {
  administrator(request.auth); const data = verificationInput(request.data, ['uid', 'suspended', 'reason']);
  let uid: string; try { uid = identifier(data.uid); } catch { throw new HttpsError('invalid-argument', 'Mã TNV chưa hợp lệ.'); }
  if (typeof data.suspended !== 'boolean' || typeof data.reason !== 'string' || data.reason.trim().length < 10 || data.reason.length > 300) throw new HttpsError('invalid-argument', 'Ghi lý do quản lý tối thiểu 10 ký tự.');
  const reason = data.reason.trim(), db = getFirestore();
  await db.runTransaction(async tx => {
    const ref = db.doc(`volunteers/${uid}`), v = (await tx.get(ref)).data();
    if (!v || !['approved', 'suspended'].includes(v.verificationStatus)) throw new HttpsError('failed-precondition', 'Không có TNV đã duyệt.');
    if (v.activeIncidentId) throw new HttpsError('failed-precondition', 'TNV đang phụ trách ca. Cần bàn giao/kết thúc ca qua người phụ trách, không bỏ ca bằng cách khóa tài khoản.');
    tx.update(ref, { verificationStatus: data.suspended ? 'suspended' : 'approved', isAvailable: false, suspensionReason: reason, suspensionReviewedBy: request.auth!.uid, suspensionReviewedAt: FieldValue.serverTimestamp() });
    tx.create(db.collection('auditLogs').doc(), { actor: request.auth!.uid, subject: uid, action: data.suspended ? 'suspend-volunteer' : 'restore-volunteer', createdAt: FieldValue.serverTimestamp() });
  });
  return { suspended: data.suspended };
});
