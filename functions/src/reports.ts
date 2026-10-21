import { createHash } from 'node:crypto';
import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { distanceMeters, identifier, objectValue, parseBystanderReport, parseCreateIncident } from './reportValidation';

const makeId = (value: string) => createHash('sha256').update(value).digest('hex').slice(0, 40);
function validate<T>(parser: (input: unknown) => T, input: unknown): T {
  try { return parser(input); } catch (error) {
    throw new HttpsError('invalid-argument', error instanceof Error ? error.message : 'Invalid request');
  }
}
function requiredUid(auth: { uid: string } | undefined): string {
  if (!auth) throw new HttpsError('unauthenticated', 'A reporter or volunteer session is required');
  return auth.uid;
}
function incidentInput(input: unknown) { return identifier(objectValue(input, ['incidentId']).incidentId); }

export const createIncident = onCall(async request => {
  const uid = requiredUid(request.auth);
  const data = validate(parseCreateIncident, request.data);
  const db = getFirestore();
  const id = makeId(`${uid}:${data.requestId}`);
  const incidentRef = db.doc(`incidents/${id}`);
  const receiptRef = db.doc(`reporters/${uid}/requestReceipts/${makeId(data.requestId)}`);
  const fingerprint = makeId(JSON.stringify(data));
  return db.runTransaction(async tx => {
    const receipt = await tx.get(receiptRef);
    if (receipt.exists) {
      if (receipt.data()!.fingerprint !== fingerprint) throw new HttpsError('invalid-argument', 'Request ID already used');
      const recorded = await tx.get(db.doc(`incidents/${receipt.data()!.incidentId}`));
      if (!recorded.exists) throw new HttpsError('internal', 'Request receipt has no incident');
      const value = recorded.data()!;
      return { incidentId: recorded.id, status: value.status === 'dispatching' && value.offerExpiresAt.toMillis() <= Date.now() ? 'expired' : value.status,
        invitedCount: value.invitedVolunteerIds.length };
    }
    const existing = await tx.get(incidentRef);
    if (existing.exists) {
      if (existing.data()?.requestFingerprint !== fingerprint) throw new HttpsError('invalid-argument', 'Request ID already used');
      const value = existing.data()!;
      const status = value.status === 'dispatching' && value.offerExpiresAt.toMillis() <= Date.now() ? 'expired' : value.status;
      tx.create(receiptRef, { incidentId: id, fingerprint });
      return { incidentId: id, status, invitedCount: value.invitedVolunteerIds.length };
    }
    const cardRef = db.doc(`cards/${data.cardId}`);
    const card = await tx.get(cardRef);
    if (!card.exists || card.data()?.active !== true || typeof card.data()?.patientId !== 'string') {
      throw new HttpsError('not-found', 'Thẻ không tồn tại hoặc đã bị thu hồi.');
    }
    const patient = await tx.get(db.doc(`patients/${card.data()!.patientId}`));
    if (!patient.exists) throw new HttpsError('failed-precondition', 'Thẻ chưa có hồ sơ hợp lệ.');
    const now = Date.now();
    let expired: { id: string; reporterUid: string; invitedVolunteerIds: string[] } | undefined;
    if (card.data()?.activeIncidentId) {
      const active = await tx.get(db.doc(`incidents/${card.data()!.activeIncidentId}`));
      if (active.exists && ['dispatching', 'accepted', 'arrived'].includes(active.data()!.status)) {
        if (active.data()!.status === 'dispatching' && active.data()!.offerExpiresAt.toMillis() <= now) {
          expired = { id: active.id, reporterUid: active.data()!.reporterUid, invitedVolunteerIds: active.data()!.invitedVolunteerIds };
        } else if (active.data()!.reporterUid === uid) {
          tx.create(receiptRef, { incidentId: active.id, fingerprint });
          return { incidentId: active.id, status: active.data()!.status, invitedCount: active.data()!.invitedVolunteerIds.length };
        } else throw new HttpsError('already-exists', 'Thẻ này đang có một yêu cầu hỗ trợ. Không tạo thêm ca trùng.');
      }
    }
    const candidates = await tx.get(db.collection('volunteers').where('verificationStatus', '==', 'approved').where('isAvailable', '==', true).limit(100));
    const selected = candidates.docs.flatMap(doc => {
      const volunteer = doc.data();
      const location = volunteer.location;
      if (volunteer.activeIncidentId || !location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number' ||
          !Number.isFinite(location.latitude) || !Number.isFinite(location.longitude) || Math.abs(location.latitude) > 90 || Math.abs(location.longitude) > 180 ||
          typeof volunteer.lastSeenAt?.toMillis !== 'function' || now - volunteer.lastSeenAt.toMillis() > 300000 || volunteer.lastSeenAt.toMillis() > now + 60000) return [];
      const distance = distanceMeters(data.location, location);
      return distance <= 5000 ? [{ uid: doc.id, distance }] : [];
    }).sort((a, b) => a.distance - b.distance).slice(0, 5);
    const invitedVolunteerIds = selected.map(item => item.uid);
    const createdAt = Timestamp.fromMillis(now);
    const offerExpiresAt = Timestamp.fromMillis(now + 10 * 60 * 1000);
    if (expired) {
      tx.update(db.doc(`incidents/${expired.id}`), { status: 'expired', closedAt: createdAt });
      tx.update(db.doc(`reporters/${expired.reporterUid}/incidentStatuses/${expired.id}`), { status: 'expired' });
      for (const recipient of expired.invitedVolunteerIds) tx.update(db.doc(`volunteers/${recipient}/alerts/${expired.id}`), { status: 'expired' });
    }
    tx.create(incidentRef, { reporterUid: uid, cardId: data.cardId, patientId: patient.id, status: 'dispatching',
      acceptedBy: null, invitedVolunteerIds, createdAt, offerExpiresAt, reportRevision: 0, requestFingerprint: fingerprint });
    tx.create(receiptRef, { incidentId: id, fingerprint });
    tx.create(incidentRef.collection('private').doc('location'), data.location);
    tx.set(cardRef, { activeIncidentId: id }, { merge: true });
    tx.create(db.doc(`reporters/${uid}/incidentStatuses/${id}`), {
      status: 'dispatching', createdAt, offerExpiresAt, reportRevision: 0, reportSubmitted: false, invitedCount: selected.length,
    });
    for (const candidate of selected) tx.create(db.doc(`volunteers/${candidate.uid}/alerts/${id}`), {
      incidentId: id, status: 'offered', distanceMeters: Math.round(candidate.distance), createdAt, offerExpiresAt,
      reportRevision: 0, answers: null,
    });
    return { incidentId: id, status: 'dispatching', invitedCount: selected.length };
  });
});

export const submitBystanderReport = onCall(async request => {
  const uid = requiredUid(request.auth);
  const data = validate(parseBystanderReport, request.data);
  const db = getFirestore();
  const ref = db.doc(`incidents/${data.incidentId}`);
  const event = ref.collection('reportEvents').doc(makeId(`${uid}:${data.submissionId}`));
  const fingerprint = makeId(JSON.stringify(data));
  return db.runTransaction(async tx => {
    const incident = await tx.get(ref);
    if (!incident.exists || incident.data()?.reporterUid !== uid) throw new HttpsError('permission-denied', 'Phiên này không sở hữu yêu cầu.');
    const prior = await tx.get(event);
    if (prior.exists) {
      if (prior.data()?.fingerprint !== fingerprint) throw new HttpsError('invalid-argument', 'Submission ID already used');
      return { received: true, revision: prior.data()!.revision };
    }
    if (!['dispatching', 'accepted', 'arrived'].includes(incident.data()!.status)) throw new HttpsError('failed-precondition', 'Ca đã đóng, không nhận bổ sung.');
    if (incident.data()!.status === 'dispatching' && incident.data()!.offerExpiresAt.toMillis() <= Date.now()) throw new HttpsError('failed-precondition', 'Lời mời đã hết hạn.');
    const revision = Number(incident.data()!.reportRevision ?? 0) + 1;
    const updatedAt = FieldValue.serverTimestamp();
    tx.set(ref.collection('private').doc('reporter'), { phone: data.phone, answers: data.answers, revision, updatedAt });
    tx.update(ref, { reportRevision: revision });
    tx.create(event, { revision, fingerprint, createdAt: updatedAt });
    tx.update(db.doc(`reporters/${uid}/incidentStatuses/${data.incidentId}`), { reportRevision: revision, reportSubmitted: true });
    // Observations go to offered volunteers; the optional phone stays private until assignment.
    const recipients: string[] = incident.data()!.acceptedBy ? [incident.data()!.acceptedBy] : incident.data()!.invitedVolunteerIds;
    for (const volunteerUid of recipients) tx.set(db.doc(`volunteers/${volunteerUid}/alerts/${data.incidentId}`), {
      reportRevision: revision, answers: data.answers, reportUpdatedAt: updatedAt,
    }, { merge: true });
    return { received: true, revision };
  });
});

export const acceptIncident = onCall(async request => {
  const uid = requiredUid(request.auth);
  const id = validate(incidentInput, request.data);
  const db = getFirestore();
  return db.runTransaction(async tx => {
    const ref = db.doc(`incidents/${id}`);
    const incident = await tx.get(ref);
    const volunteerRef = db.doc(`volunteers/${uid}`);
    const volunteer = await tx.get(volunteerRef);
    const alert = await tx.get(db.doc(`volunteers/${uid}/alerts/${id}`));
    if (!incident.exists || volunteer.data()?.verificationStatus !== 'approved' || !alert.exists ||
        !(incident.data()!.invitedVolunteerIds as string[]).includes(uid)) throw new HttpsError('permission-denied', 'Không có quyền nhận ca.');
    if (incident.data()!.acceptedBy === uid && ['accepted', 'arrived'].includes(incident.data()!.status)) return { incidentId: id, status: incident.data()!.status };
    if (incident.data()!.status !== 'dispatching' || incident.data()!.offerExpiresAt.toMillis() <= Date.now() ||
        alert.data()!.status !== 'offered' || volunteer.data()?.isAvailable !== true || (volunteer.data()?.activeIncidentId && volunteer.data()!.activeIncidentId !== id)) {
      throw new HttpsError('failed-precondition', 'Ca đã được nhận, hết hạn hoặc TNV đang bận.');
    }
    tx.update(ref, { status: 'accepted', acceptedBy: uid, acceptedAt: FieldValue.serverTimestamp() });
    tx.update(volunteerRef, { activeIncidentId: id, isAvailable: false });
    tx.update(db.doc(`reporters/${incident.data()!.reporterUid}/incidentStatuses/${id}`), { status: 'accepted' });
    for (const recipient of incident.data()!.invitedVolunteerIds as string[]) tx.update(db.doc(`volunteers/${recipient}/alerts/${id}`), { status: recipient === uid ? 'accepted' : 'closed' });
    return { incidentId: id, status: 'accepted' };
  });
});

export const setVolunteerAvailability = onCall(async request => {
  const uid = requiredUid(request.auth);
  const data = validate(input => {
    const value = objectValue(input, ['available', 'location']);
    if (typeof value.available !== 'boolean') throw new Error('Invalid availability');
    const location = value.available ? parseCreateIncident({ cardId: 'location-only', requestId: 'location-only', location: value.location }).location : null;
    return { available: value.available, location };
  }, request.data);
  const db = getFirestore();
  return db.runTransaction(async tx => {
    const ref = db.doc(`volunteers/${uid}`);
    const volunteer = await tx.get(ref);
    if (volunteer.data()?.verificationStatus !== 'approved') throw new HttpsError('permission-denied', 'TNV chưa được duyệt.');
    if (data.available && volunteer.data()?.activeIncidentId) throw new HttpsError('failed-precondition', 'Bạn đang phụ trách một ca.');
    tx.update(ref, { isAvailable: data.available, lastSeenAt: FieldValue.serverTimestamp(),
      ...(data.location ? { location: data.location } : {}) });
    return { available: data.available };
  });
});

export const finishIncident = onCall(async request => {
  const uid = requiredUid(request.auth);
  const data = validate(input => {
    const value = objectValue(input, ['incidentId', 'outcome']);
    if (value.outcome !== 'completed' && value.outcome !== 'cancelled') throw new Error('Invalid outcome');
    return { incidentId: identifier(value.incidentId), outcome: value.outcome };
  }, request.data);
  const db = getFirestore();
  return db.runTransaction(async tx => {
    const ref = db.doc(`incidents/${data.incidentId}`);
    const incident = await tx.get(ref);
    if (!incident.exists) throw new HttpsError('permission-denied', 'Không có quyền với ca.');
    const value = incident.data()!;
    const volunteerRef = db.doc(`volunteers/${uid}`);
    const volunteer = await tx.get(volunteerRef);
    const permitted = data.outcome === 'cancelled' ? value.reporterUid === uid && !value.acceptedBy :
      value.acceptedBy === uid && volunteer.data()?.verificationStatus === 'approved';
    if (!permitted) throw new HttpsError('permission-denied', 'Không có quyền kết thúc ca.');
    if (value.status === data.outcome) return { status: value.status };
    if (data.outcome === 'cancelled' ? value.status !== 'dispatching' : !['accepted', 'arrived'].includes(value.status)) {
      throw new HttpsError('failed-precondition', 'Trạng thái ca đã thay đổi.');
    }
    const cardRef = db.doc(`cards/${value.cardId}`);
    const card = await tx.get(cardRef);
    tx.update(ref, { status: data.outcome, closedAt: FieldValue.serverTimestamp(), closedBy: uid });
    tx.update(db.doc(`reporters/${value.reporterUid}/incidentStatuses/${data.incidentId}`), { status: data.outcome });
    if (card.data()?.activeIncidentId === data.incidentId) tx.update(cardRef, { activeIncidentId: null });
    if (data.outcome === 'completed' && volunteer.data()?.activeIncidentId === data.incidentId) tx.update(volunteerRef, { activeIncidentId: null, isAvailable: false });
    for (const recipient of value.invitedVolunteerIds as string[]) tx.update(db.doc(`volunteers/${recipient}/alerts/${data.incidentId}`), { status: recipient === value.acceptedBy ? data.outcome : 'closed' });
    return { status: data.outcome };
  });
});

export const getVolunteerIncidentDetails = onCall(async request => {
  const uid = requiredUid(request.auth);
  const id = validate(incidentInput, request.data);
  const db = getFirestore();
  // Authorization and report are read together, so reassignment cannot race the access check.
  return db.runTransaction(async tx => {
    const incident = await tx.get(db.doc(`incidents/${id}`));
    const volunteer = await tx.get(db.doc(`volunteers/${uid}`));
    if (!incident.exists || incident.data()?.acceptedBy !== uid || !['accepted', 'arrived'].includes(incident.data()!.status) ||
        volunteer.data()?.verificationStatus !== 'approved') throw new HttpsError('permission-denied', 'Chỉ TNV phụ trách ca được xem.');
    const report = await tx.get(db.doc(`incidents/${id}/private/reporter`));
    const location = await tx.get(db.doc(`incidents/${id}/private/location`));
    return { incidentId: id, phone: report.data()?.phone ?? null, answers: report.data()?.answers ?? null,
      revision: report.data()?.revision ?? 0, location: location.data() ?? null };
  });
});
