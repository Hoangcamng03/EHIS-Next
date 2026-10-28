import { guardedCall as onCall } from './guards';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import { identifier, objectValue } from './reportValidation';

export const trainingLevels = ['first_aid', 'clinical_student', 'clinical_staff'] as const;
export function verificationInput(value: unknown, keys: string[]) {
  try { return objectValue(value, keys); } catch { throw new HttpsError('invalid-argument', 'Thông tin không hợp lệ.'); }
}
export function text(value: unknown, max: number) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) throw new HttpsError('invalid-argument', 'Điền đủ thông tin và kiểm tra độ dài.');
  return value.trim();
}
export function clinicalLevel(value: unknown) {
  if (!trainingLevels.includes(value as typeof trainingLevels[number])) throw new HttpsError('invalid-argument', 'Phân loại đào tạo không hợp lệ.');
  return value as typeof trainingLevels[number];
}
export function clinicalMonths(value: unknown) {
  if (!Number.isInteger(value) || Number(value) < 0 || Number(value) > 600) throw new HttpsError('invalid-argument', 'Số tháng lâm sàng phải từ 0 đến 600.');
  return Number(value);
}
export function parseApplication(value: unknown) {
  const data = verificationInput(value, ['fullName', 'phone', 'experience', 'trainingLevel', 'clinicalMonths', 'homeAddress', 'workAddress', 'serviceArea', 'referrerEmail']);
  const phone = text(data.phone, 16), email = text(data.referrerEmail, 254).toLowerCase();
  if (!/^\+?[0-9]{8,15}$/.test(phone) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpsError('invalid-argument', 'Số điện thoại hoặc email người giới thiệu chưa đúng.');
  const level = clinicalLevel(data.trainingLevel), months = clinicalMonths(data.clinicalMonths);
  if (level === 'first_aid' && months !== 0) throw new HttpsError('invalid-argument', 'Chọn mức có thực hành lâm sàng nếu đã có kinh nghiệm lâm sàng.');
  return { fullName: text(data.fullName, 100), phone, experience: text(data.experience, 500), trainingLevel: level, clinicalMonths: months,
    homeAddress: text(data.homeAddress, 200), workAddress: text(data.workAddress, 200), serviceArea: text(data.serviceArea, 100), referrerEmail: email };
}
export const checklistKeys = ['identityChecked', 'affiliationChecked', 'trainingChecked', 'scopeExplained'] as const;
async function referrerAccount(uid: string) {
  const account = await getAuth().getUser(uid).catch(() => null);
  if (!account || account.disabled || !account.emailVerified) throw new HttpsError('permission-denied', 'Tài khoản người giới thiệu chưa đủ điều kiện.');
  return account;
}

// Registry is checked on every call, rather than trusting a stale client/JWT role.
export const setVolunteerReferrer = onCall('setVolunteerReferrer', async request => {
  if (request.auth?.token.admin !== true) throw new HttpsError('permission-denied', 'Cần quản trị xác minh người quản lý tại đơn vị.');
  const data = verificationInput(request.data, ['email', 'fullName', 'phone', 'organisation', 'position', 'verificationNote', 'enabled']);
  const email = text(data.email, 254).toLowerCase();
  if (typeof data.enabled !== 'boolean') throw new HttpsError('invalid-argument', 'Thiếu trạng thái.');
  const account = await getAuth().getUserByEmail(email).catch(() => { throw new HttpsError('not-found', 'Người giới thiệu cần đăng ký tài khoản EHIS trước.'); });
  if (account.disabled && data.enabled) throw new HttpsError('failed-precondition', 'Tài khoản bị khóa.');
  if (data.enabled && !account.emailVerified) throw new HttpsError('failed-precondition', 'Người giới thiệu cần xác minh email của chính mình trước.');
  const record = { email, fullName: text(data.fullName, 100), phone: text(data.phone, 16), organisation: text(data.organisation, 150),
    position: text(data.position, 100), verificationNote: text(data.verificationNote, 500), enabled: data.enabled,
    verifiedBy: request.auth.uid, updatedAt: FieldValue.serverTimestamp() };
  if (!/^\+?[0-9]{8,15}$/.test(record.phone)) throw new HttpsError('invalid-argument', 'Số liên hệ chưa đúng.');
  const db = getFirestore();
  await db.runTransaction(async tx => {
    tx.set(db.doc(`volunteerReferrers/${account.uid}`), record);
    tx.create(db.collection('auditLogs').doc(), { actor: request.auth!.uid, subject: account.uid, action: record.enabled ? 'enable-referrer' : 'disable-referrer', createdAt: FieldValue.serverTimestamp() });
  });
  return { uid: account.uid, enabled: record.enabled };
});

export const listReferrerApplications = onCall('listReferrerApplications', async request => {
  verificationInput(request.data, []);
  const account = await referrerAccount(request.auth!.uid);
  const db = getFirestore();
  return db.runTransaction(async tx => {
    const referrer = await tx.get(db.doc(`volunteerReferrers/${request.auth!.uid}`));
    if (referrer.data()?.enabled !== true || referrer.data()?.email !== account.email?.toLowerCase()) throw new HttpsError('permission-denied', 'Chưa được cấp quyền người giới thiệu.');
    const apps = await tx.get(db.collection('volunteerApplications').where('referrerUid', '==', request.auth!.uid).where('status', '==', 'pending').limit(50));
    return { organisation: referrer.data()!.organisation, applications: apps.docs.map(item => ({ uid: item.id, ...item.data() })) };
  });
});

export const submitVolunteerReferral = onCall('submitVolunteerReferral', async request => {
  const data = verificationInput(request.data, ['uid', 'applicationRevision', 'decision', 'checklist', 'confirmedLevel', 'confirmedClinicalMonths', 'evidence']);
  if (!Number.isInteger(data.applicationRevision) || Number(data.applicationRevision) < 1) throw new HttpsError('invalid-argument', 'Thiếu phiên bản đơn.');
  let uid: string;
  try { uid = identifier(data.uid); } catch { throw new HttpsError('invalid-argument', 'Mã hồ sơ không hợp lệ.'); }
  const actor = request.auth!.uid;
  if (uid === actor) throw new HttpsError('permission-denied', 'Không tự giới thiệu chính mình.');
  const account = await referrerAccount(actor);
  if (data.decision !== 'recommended' && data.decision !== 'not_recommended') throw new HttpsError('invalid-argument', 'Thiếu kết quả.');
  const checklist = verificationInput(data.checklist, [...checklistKeys]);
  for (const key of checklistKeys) if (typeof checklist[key] !== 'boolean') throw new HttpsError('invalid-argument', 'Điền đầy đủ checklist.');
  if (data.decision === 'recommended' && checklistKeys.some(key => checklist[key] !== true)) throw new HttpsError('failed-precondition', 'Chỉ giới thiệu khi đủ bốn mục xác minh.');
  const level = clinicalLevel(data.confirmedLevel), months = clinicalMonths(data.confirmedClinicalMonths), evidence = text(data.evidence, 500);
  if (level === 'first_aid' && months !== 0) throw new HttpsError('invalid-argument', 'Phân loại và số tháng chưa khớp.');
  const db = getFirestore();
  return db.runTransaction(async tx => {
    const ref = db.doc(`volunteerApplications/${uid}`), [app, manager] = await tx.getAll(ref, db.doc(`volunteerReferrers/${actor}`));
    if (manager.data()?.enabled !== true || manager.data()?.email !== account.email?.toLowerCase() || app.data()?.referrerUid !== actor) throw new HttpsError('permission-denied', 'Chỉ người được chỉ định còn quyền mới xác nhận đơn.');
    if (app.data()?.status !== 'pending' || app.data()?.applicationRevision !== data.applicationRevision) throw new HttpsError('failed-precondition', 'Đơn đã thay đổi. Tải lại trước khi xác nhận.');
    tx.update(ref, { referral: { decision: data.decision, checklist, confirmedLevel: level, confirmedClinicalMonths: months, evidence,
      reviewedBy: actor, organisation: manager.data()!.organisation, position: manager.data()!.position, reviewedAt: FieldValue.serverTimestamp() } });
    tx.create(db.collection('auditLogs').doc(), { actor, subject: uid, action: 'submit-referral', createdAt: FieldValue.serverTimestamp() });
    return { saved: true };
  });
});
