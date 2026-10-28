import { guardedCall as onCall } from './guards';
import { randomBytes } from 'node:crypto';
import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import { identifier, objectValue } from './reportValidation';
import { getAuth } from 'firebase-admin/auth';
import { checklistKeys, parseApplication } from './volunteerVerification';

function registered(auth: { uid: string; token: { firebase?: { sign_in_provider?: string } } } | undefined) {
  if (!auth || auth.token.firebase?.sign_in_provider === 'anonymous') throw new HttpsError('unauthenticated', 'Cần tài khoản đã đăng ký.');
  return auth.uid;
}
function input<T>(parse: () => T) { try { return parse(); } catch { throw new HttpsError('invalid-argument', 'Thông tin không hợp lệ.'); } }

export const issuePatientCard = onCall('issuePatientCard', async request => {
  const uid = registered(request.auth);
  const shareProfile = input(() => {
    const data = objectValue(request.data, ['shareProfile']);
    if (typeof data.shareProfile !== 'boolean') throw new Error('consent');
    return data.shareProfile;
  });
  const db = getFirestore(), pointer = db.doc(`patientCards/${uid}`);
  const newId = randomBytes(24).toString('hex');
  return db.runTransaction(async tx => {
    const profile = await tx.get(db.doc(`patients/${uid}`));
    const current = await tx.get(pointer);
    if (!profile.exists) throw new HttpsError('failed-precondition', 'Lưu hồ sơ trước khi cấp thẻ.');
    const currentId = current.data()?.cardId;
    const previous = typeof currentId === 'string' ? await tx.get(db.doc(`cards/${currentId}`)) : null;
    // Retry returns the existing active card; changing consent requires revoking first.
    if (previous?.data()?.active === true) {
      if (previous.data()?.shareProfile !== shareProfile) throw new HttpsError('failed-precondition', 'Thu hồi thẻ hiện tại trước khi đổi lựa chọn chia sẻ.');
      return { cardId: currentId, active: true, shareProfile };
    }
    const value = { cardId: newId, active: true, shareProfile, createdAt: FieldValue.serverTimestamp() };
    tx.create(db.doc(`cards/${newId}`), { patientId: uid, active: true, shareProfile, activeIncidentId: null, createdAt: FieldValue.serverTimestamp() });
    tx.set(pointer, value);
    tx.create(db.collection('auditLogs').doc(), { actor: uid, action: 'issue-card', createdAt: FieldValue.serverTimestamp() });
    return { cardId: newId, active: true, shareProfile };
  });
});

export const revokePatientCard = onCall('revokePatientCard', async request => {
  const uid = registered(request.auth);
  const cardId = input(() => identifier(objectValue(request.data, ['cardId']).cardId));
  const db = getFirestore();
  return db.runTransaction(async tx => {
    const ref = db.doc(`cards/${cardId}`), card = await tx.get(ref);
    if (!card.exists || card.data()?.patientId !== uid) throw new HttpsError('permission-denied', 'Không sở hữu thẻ.');
    if (card.data()?.activeIncidentId) {
      const incident = await tx.get(db.doc(`incidents/${card.data()!.activeIncidentId}`));
      if (['dispatching', 'accepted', 'arrived'].includes(incident.data()?.status)) throw new HttpsError('failed-precondition', 'Thẻ đang có ca hỗ trợ; kết thúc hoặc hủy ca trước khi thu hồi.');
    }
    if (!card.data()?.active) return { active: false };
    tx.update(ref, { active: false, revokedAt: FieldValue.serverTimestamp() });
    tx.set(db.doc(`patientCards/${uid}`), { active: false }, { merge: true });
    tx.create(db.collection('auditLogs').doc(), { actor: uid, action: 'revoke-card', createdAt: FieldValue.serverTimestamp() });
    return { active: false };
  });
});

export const applyVolunteer = onCall('applyVolunteer', async request => {
  const uid = registered(request.auth);
  const data = parseApplication(request.data);
  const managerAccount = await getAuth().getUserByEmail(data.referrerEmail).catch(() => null);
  if (!managerAccount || managerAccount.disabled || !managerAccount.emailVerified || managerAccount.uid === uid) throw new HttpsError('failed-precondition', 'Người giới thiệu chưa được xác minh hoặc không hợp lệ.', { reason: 'referrer-unavailable' });
  const db = getFirestore();
  return db.runTransaction(async tx => {
    const ref = db.doc(`volunteerApplications/${uid}`);
    const [application, volunteer, manager] = await tx.getAll(ref, db.doc(`volunteers/${uid}`), db.doc(`volunteerReferrers/${managerAccount.uid}`));
    if (manager.data()?.enabled !== true) throw new HttpsError('failed-precondition', 'Người giới thiệu chưa được xác minh.', { reason: 'referrer-unavailable' });
    if (volunteer.data()?.verificationStatus === 'approved') throw new HttpsError('failed-precondition', 'Đã được duyệt.');
    const applicationRevision = Number(application.data()?.applicationRevision || 0) + 1;
    tx.set(ref, { ...data, referrerUid: managerAccount.uid, organisation: manager.data()!.organisation, policyVersion: 2, applicationRevision, referral: null,
      status: 'pending', submittedAt: FieldValue.serverTimestamp(), reviewedAt: null });
    tx.create(db.collection('auditLogs').doc(), { actor: uid, action: 'apply-volunteer', createdAt: FieldValue.serverTimestamp() });
    return { status: 'pending', applicationRevision };
  });
});

export const listVolunteerApplications = onCall('listVolunteerApplications', async request => {
  registered(request.auth);
  if (request.auth?.token.admin !== true) throw new HttpsError('permission-denied', 'Cần quyền quản trị.');
  input(() => objectValue(request.data, []));
  const applications = await getFirestore().collection('volunteerApplications').where('status', '==', 'pending').limit(50).get();
  return { applications: applications.docs.map(doc => ({ uid: doc.id, ...doc.data() })) };
});

export const reviewVolunteerApplication = onCall('reviewVolunteerApplication', async request => {
  const adminUid = registered(request.auth);
  if (request.auth?.token.admin !== true) throw new HttpsError('permission-denied', 'Cần quyền quản trị.');
  const data = input(() => {
    const value = objectValue(request.data, ['uid', 'decision', 'applicationRevision']);
    if (value.decision !== 'approved' && value.decision !== 'rejected') throw new Error('decision');
    if (!Number.isInteger(value.applicationRevision) || Number(value.applicationRevision) < 1) throw new Error('revision');
    return { uid: identifier(value.uid), decision: value.decision, applicationRevision: value.applicationRevision };
  });
  const db = getFirestore();
  const currentApplication = await db.doc(`volunteerApplications/${data.uid}`).get();
  const referrerAccount = data.decision === 'approved' && typeof currentApplication.data()?.referrerUid === 'string' ? await getAuth().getUser(currentApplication.data()!.referrerUid).catch(() => null) : null;
  return db.runTransaction(async tx => {
    const ref = db.doc(`volunteerApplications/${data.uid}`), volunteerRef = db.doc(`volunteers/${data.uid}`);
    const application = await tx.get(ref), volunteer = await tx.get(volunteerRef);
    if (!application.exists) throw new HttpsError('not-found', 'Không có đơn đăng ký.');
    if (application.data()?.applicationRevision !== data.applicationRevision) throw new HttpsError('failed-precondition', 'Đơn đã thay đổi. Tải lại trước khi duyệt.');
    if (application.data()?.status === data.decision) return { status: data.decision };
    if (application.data()?.status !== 'pending' || volunteer.data()?.activeIncidentId) throw new HttpsError('failed-precondition', 'Đơn đã xử lý hoặc TNV đang phụ trách ca.');
    const value = application.data()!, referral = value.referral;
    const manager = typeof value.referrerUid === 'string' ? await tx.get(db.doc(`volunteerReferrers/${value.referrerUid}`)) : null;
    if (data.decision === 'approved' && (value.policyVersion !== 2 || !referrerAccount || referrerAccount.disabled || !referrerAccount.emailVerified || referrerAccount.uid !== value.referrerUid || manager?.data()?.email !== referrerAccount.email?.toLowerCase() || manager?.data()?.enabled !== true ||
        referral?.decision !== 'recommended' || referral.reviewedBy !== value.referrerUid || checklistKeys.some(key => referral.checklist?.[key] !== true))) {
      throw new HttpsError('failed-precondition', 'Cần người quản lý được xác minh hoàn tất checklist trước khi duyệt.', { reason: 'referral-required' });
    }
    tx.update(ref, { status: data.decision, reviewedBy: adminUid, reviewedAt: FieldValue.serverTimestamp() });
    tx.set(volunteerRef, { verificationStatus: data.decision, isAvailable: false, verificationPolicyVersion: 2,
      ...(data.decision === 'approved' ? { trainingLevel: referral.confirmedLevel, clinicalMonths: referral.confirmedClinicalMonths, organisation: value.organisation, serviceArea: value.serviceArea } : {}) }, { merge: true });
    tx.create(db.collection('auditLogs').doc(), { actor: adminUid, subject: data.uid, action: `volunteer-${data.decision}`, createdAt: FieldValue.serverTimestamp() });
    return { status: data.decision };
  });
});

export const markIncidentArrived = onCall('markIncidentArrived', async request => {
  const uid = registered(request.auth);
  const id = input(() => identifier(objectValue(request.data, ['incidentId']).incidentId));
  const db = getFirestore();
  return db.runTransaction(async tx => {
    const ref = db.doc(`incidents/${id}`), incident = await tx.get(ref), volunteer = await tx.get(db.doc(`volunteers/${uid}`));
    const value = incident.data();
    if (!value || value.acceptedBy !== uid || volunteer.data()?.verificationStatus !== 'approved') throw new HttpsError('permission-denied', 'Chỉ TNV phụ trách được xác nhận.');
    if (value.status === 'arrived') return { status: 'arrived' };
    if (value.status !== 'accepted') throw new HttpsError('failed-precondition', 'Ca không ở trạng thái đang di chuyển.');
    tx.update(ref, { status: 'arrived', arrivedAt: FieldValue.serverTimestamp() });
    tx.update(db.doc(`volunteers/${uid}/alerts/${id}`), { status: 'arrived' });
    tx.update(db.doc(`reporters/${value.reporterUid}/incidentStatuses/${id}`), { status: 'arrived' });
    tx.set(db.doc(`patients/${value.patientId}/incidentStatuses/${id}`), { status: 'arrived' }, { merge: true });
    return { status: 'arrived' };
  });
});

export const cancelPatientIncident = onCall('cancelPatientIncident', async request => {
  const uid = registered(request.auth);
  const id = input(() => identifier(objectValue(request.data, ['incidentId']).incidentId));
  const db = getFirestore();
  return db.runTransaction(async tx => {
    const ref = db.doc(`incidents/${id}`), incident = await tx.get(ref), value = incident.data();
    if (!value || value.patientId !== uid) throw new HttpsError('permission-denied', 'Không sở hữu ca.');
    if (value.status === 'cancelled') return { status: 'cancelled' };
    if (value.status !== 'dispatching' || value.acceptedBy) throw new HttpsError('failed-precondition', 'Chỉ hủy trước khi TNV nhận ca.');
    const cardRef = db.doc(`cards/${value.cardId}`), card = await tx.get(cardRef);
    tx.update(ref, { status: 'cancelled', closedBy: uid, closedAt: FieldValue.serverTimestamp(), purgeAfter: Timestamp.fromMillis(Date.now() + 86400000) });
    tx.update(db.doc(`reporters/${value.reporterUid}/incidentStatuses/${id}`), { status: 'cancelled' });
    tx.set(db.doc(`patients/${uid}/incidentStatuses/${id}`), { status: 'cancelled' }, { merge: true });
    if (card.data()?.activeIncidentId === id) tx.update(cardRef, { activeIncidentId: null });
    for (const recipient of value.invitedVolunteerIds) tx.update(db.doc(`volunteers/${recipient}/alerts/${id}`), { status: 'closed' });
    tx.create(db.collection('auditLogs').doc(), { actor: uid, action: 'patient-cancel-incident', incidentId: id, createdAt: FieldValue.serverTimestamp() });
    return { status: 'cancelled' };
  });
});
