import { createHash } from 'node:crypto';
import { FieldPath, FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';
import { HttpsError, type CallableRequest } from 'firebase-functions/v2/https';
import { guardedCall } from './guards';
import { identifier, objectValue, distanceMeters } from './reportValidation';
import { dispatchBounds } from './dispatchBounds';
import { volunteerReadiness } from './readiness';
import { queuePush } from './pushJobs';
function admin(request: CallableRequest<unknown>) { if (request.auth?.token.admin !== true) throw new HttpsError('permission-denied', 'Chỉ quản trị được đề nghị bàn giao.'); }
function input(value: unknown, keys: string[]) { try { return objectValue(value, keys); } catch { throw new HttpsError('invalid-argument', 'Thông tin bàn giao chưa hợp lệ.'); } }
function id(value: unknown) { try { return identifier(value); } catch { throw new HttpsError('invalid-argument', 'Mã chưa hợp lệ.'); } }
function live(value: { status?: string } | undefined) { return !!value && ['accepted', 'arrived'].includes(value.status || ''); }

export const listHandoverCases = guardedCall('listHandoverCases', async request => {
  admin(request); const data = input(request.data, ['after']), db = getFirestore();
  let query = db.collection('incidents').where('status', 'in', ['accepted', 'arrived']).orderBy(FieldPath.documentId());
  if (data.after !== undefined) query = query.startAfter(id(data.after));
  const page = await query.limit(26).get(), docs = page.docs.slice(0, 25);
  const uids = [...new Set(docs.map(d => d.data().acceptedBy as string))];
  const people = uids.length ? await db.getAll(...uids.map(uid => db.doc(`volunteers/${uid}`))) : [];
  const names = new Map(people.map(p => [p.id, p.data()?.fullName || 'TNV diễn tập']));
  return { checkedAtMs: Date.now(), cases: docs.map(d => { const v = d.data(); return { incidentId: d.id, status: v.status, responsibleName: names.get(v.acceptedBy), acceptedAtMs: v.acceptedAt?.toMillis?.() ?? null,
    handover: v.handover ? { id: v.handover.id, expiresAtMs: v.handover.expiresAt.toMillis() } : null }; }), next: page.size > 25 ? docs.at(-1)!.id : null };
});

export const listHandoverHistory = guardedCall('listHandoverHistory', async request => {
  admin(request); const data = input(request.data, ['incidentId', 'after']), incidentId = id(data.incidentId), db = getFirestore();
  let query = db.collection(`incidents/${incidentId}/handoverRequests`).orderBy(FieldPath.documentId());
  if (data.after !== undefined) query = query.startAfter(id(data.after));
  const page = await query.limit(26).get(), docs = page.docs.slice(0, 25);
  const uids = [...new Set(docs.flatMap(d => [d.data().fromUid as string, d.data().targetUid as string]))];
  const people = uids.length ? await db.getAll(...uids.map(uid => db.doc(`volunteers/${uid}`))) : [];
  const names = new Map(people.map(p => [p.id, p.data()?.fullName || 'TNV diễn tập']));
  return { history: docs.map(d => { const v = d.data(); return { id: d.id, fromName: names.get(v.fromUid), targetName: names.get(v.targetUid), reason: v.reason,
    status: v.status === 'pending' && v.expiresAt.toMillis() <= Date.now() ? 'expired' : v.status,
    requestedAtMs: v.requestedAt?.toMillis?.() ?? null, acceptedAtMs: v.acceptedAt?.toMillis?.() ?? null, cancelledAtMs: v.cancelledAt?.toMillis?.() ?? null }; }), next: page.size > 25 ? docs.at(-1)!.id : null };
});

export const listHandoverCandidates = guardedCall('listHandoverCandidates', async request => {
  admin(request); const data = input(request.data, ['incidentId']), db = getFirestore(), incidentId = id(data.incidentId);
  return db.runTransaction(async tx => {
    const c = (await tx.get(db.doc(`incidents/${incidentId}`))).data();
    if (!live(c)) throw new HttpsError('failed-precondition', 'Ca không còn cần bàn giao.');
    const point = (await tx.get(db.doc(`incidents/${incidentId}/private/location`))).data() as { latitude: number; longitude: number } | undefined;
    if (!point) throw new HttpsError('failed-precondition', 'Chưa có điểm bệnh nhân được xác nhận.');
    const now = Date.now();
    const pages = await Promise.all(dispatchBounds(point).map(w => tx.get(db.collection('volunteers').where('verificationStatus', '==', 'approved').where('isAvailable', '==', true)
      .where('location.latitude', '>=', w.south).where('location.latitude', '<=', w.north).where('location.longitude', '>=', w.west).where('location.longitude', '<=', w.east)
      .where('lastSeenAt', '>=', Timestamp.fromMillis(now - 300000)).where('lastSeenAt', '<=', Timestamp.fromMillis(now + 60000)).orderBy('location.latitude').orderBy('location.longitude').orderBy('lastSeenAt').limit(1001))));
    const people = [...new Map(pages.flatMap(p => p.docs).map(d => [d.id, d])).values()];
    if (people.length > 1000) throw new HttpsError('resource-exhausted', 'Vượt giới hạn tìm TNV của buổi thử.');
    const candidates = people.flatMap(d => { const v = d.data(); if (d.id === c!.acceptedBy || d.id === c!.patientId || !volunteerReadiness(v, now).readyForDispatch || !v.location) return [];
      const distance = distanceMeters(point, v.location); return distance <= 5000 ? [{ uid: d.id, fullName: v.fullName || 'TNV diễn tập', distanceMeters: Math.round(distance) }] : []; }).sort((a, b) => a.distanceMeters - b.distanceMeters);
    return { candidates: candidates.slice(0, 50), overflow: candidates.length > 50, checkedAtMs: now };
  });
});

export const proposeIncidentHandover = guardedCall('proposeIncidentHandover', async request => {
  admin(request); const data = input(request.data, ['incidentId', 'targetUid', 'requestId', 'reason']);
  const incidentId = id(data.incidentId), targetUid = id(data.targetUid), handoverId = id(data.requestId);
  if (typeof data.reason !== 'string' || data.reason.trim().length < 10 || data.reason.length > 300) throw new HttpsError('invalid-argument', 'Ghi lý do từ 10 đến 300 ký tự.');
  const reason = data.reason.trim(), fingerprint = createHash('sha256').update(JSON.stringify({ incidentId, targetUid, reason })).digest('hex'), db = getFirestore();
  return db.runTransaction(async tx => {
    const ref = db.doc(`incidents/${incidentId}`), record = ref.collection('handoverRequests').doc(handoverId);
    const [incident, prior, target, location, report] = await tx.getAll(ref, record, db.doc(`volunteers/${targetUid}`), ref.collection('private').doc('location'), ref.collection('private').doc('reporter'));
    if (prior.exists) { if (prior.data()!.fingerprint !== fingerprint) throw new HttpsError('invalid-argument', 'Mã đề nghị đã dùng cho nội dung khác.'); return { incidentId, handoverId, status: prior.data()!.status }; }
    const c = incident.data(), v = target.data(), now = Date.now();
    if (!live(c) || targetUid === c!.acceptedBy || targetUid === c!.patientId) throw new HttpsError('failed-precondition', 'Ca hoặc người nhận không phù hợp.');
    if (c!.handover?.expiresAt?.toMillis() > now) throw new HttpsError('failed-precondition', 'Đã có đề nghị đang chờ; hủy đề nghị đó trước.');
    if (!v || !volunteerReadiness(v, now).readyForDispatch || !location.exists || !v.location || distanceMeters(location.data() as { latitude: number; longitude: number }, v.location) > 5000) throw new HttpsError('failed-precondition', 'TNV cần sẵn sàng, GPS mới và ở trong 5 km.');
    const recipients = [...new Set([...(c!.invitedVolunteerIds as string[]), targetUid])];
    if (recipients.length > 40) throw new HttpsError('resource-exhausted', 'Ca đã có quá nhiều người được mời; cần người phụ trách kiểm tra.');
    const expiresAt = Timestamp.fromMillis(now + 300000), sequence = Number(c!.handoverSequence || 0) + 1;
    if (c!.handover) {
      tx.update(ref.collection('handoverRequests').doc(c!.handover.id), { status: 'expired' });
      if (c!.handover.targetUid !== targetUid) tx.set(db.doc(`volunteers/${c!.handover.targetUid}/alerts/${incidentId}`), { status: 'closed' }, { merge: true });
    }
    tx.create(record, { fromUid: c!.acceptedBy, targetUid, reason, fingerprint, status: 'pending', expiresAt, requestedBy: request.auth!.uid, requestedAt: Timestamp.fromMillis(now) });
    tx.update(ref, { handover: { id: handoverId, fromUid: c!.acceptedBy, targetUid, expiresAt }, handoverSequence: sequence, invitedVolunteerIds: recipients });
    tx.set(db.doc(`volunteers/${targetUid}/alerts/${incidentId}`), { incidentId, status: 'offered', offerKind: 'handover', handoverId, createdAt: Timestamp.fromMillis(now), offeredAt: Timestamp.fromMillis(now), offerExpiresAt: expiresAt, distanceMeters: Math.round(distanceMeters(location.data() as { latitude: number; longitude: number }, v.location)), reportRevision: c!.reportRevision || 0, answers: report.data()?.answers || null });
    tx.set(db.doc(`reporters/${c!.reporterUid}/incidentStatuses/${incidentId}`), { handoverPending: true }, { merge: true });
    tx.create(db.collection('auditLogs').doc(), { action: 'handover-proposed', actorUid: request.auth!.uid, incidentId, handoverId, createdAt: Timestamp.fromMillis(now) });
    queuePush(tx, db, targetUid, incidentId, 'request', sequence, expiresAt, undefined, handoverId);
    return { incidentId, handoverId, status: 'pending' };
  });
});

export const acceptIncidentHandover = guardedCall('acceptIncidentHandover', async request => {
  const data = input(request.data, ['incidentId', 'handoverId']), incidentId = id(data.incidentId), handoverId = id(data.handoverId), uid = request.auth!.uid, db = getFirestore();
  return db.runTransaction(async tx => {
    const ref = db.doc(`incidents/${incidentId}`), record = ref.collection('handoverRequests').doc(handoverId);
    const [incident, proposal, target, alert] = await tx.getAll(ref, record, db.doc(`volunteers/${uid}`), db.doc(`volunteers/${uid}/alerts/${incidentId}`));
    const c = incident.data(), p = proposal.data(), v = target.data();
    if (!p || p.targetUid !== uid || !v || v.verificationStatus !== 'approved') throw new HttpsError('permission-denied', 'Không có quyền nhận bàn giao.');
    if (p.status === 'accepted' && c?.acceptedBy === uid && live(c) && v.activeIncidentId === incidentId) return { incidentId, status: c!.status };
    const old = c?.acceptedBy ? await tx.get(db.doc(`volunteers/${c.acceptedBy}`)) : null;
    const [location, report] = await tx.getAll(ref.collection('private').doc('location'), ref.collection('private').doc('reporter'));
    if (!live(c) || p.status !== 'pending' || c!.handover?.id !== handoverId || c!.handover.targetUid !== uid || c!.acceptedBy !== p.fromUid || p.expiresAt.toMillis() <= Date.now() || old?.data()?.activeIncidentId !== incidentId || alert.data()?.handoverId !== handoverId || alert.data()?.status !== 'offered') throw new HttpsError('failed-precondition', 'Đề nghị đã đóng, thay đổi hoặc hết hạn.');
    if (!volunteerReadiness(v, Date.now()).readyForDispatch || !location.exists || !v.location || distanceMeters(location.data() as { latitude: number; longitude: number }, v.location) > 5000) throw new HttpsError('failed-precondition', 'Bạn đang bận, GPS cũ hoặc ngoài 5 km.');
    tx.update(record, { status: 'accepted', acceptedAt: FieldValue.serverTimestamp() });
    tx.update(ref, { acceptedBy: uid, status: 'accepted', acceptedAt: FieldValue.serverTimestamp(), handover: FieldValue.delete() });
    tx.update(db.doc(`volunteers/${p.fromUid}`), { activeIncidentId: null, isAvailable: false });
    tx.update(db.doc(`volunteers/${uid}`), { activeIncidentId: incidentId, isAvailable: false });
    for (const recipient of c!.invitedVolunteerIds as string[]) tx.set(db.doc(`volunteers/${recipient}/alerts/${incidentId}`), { status: recipient === uid ? 'accepted' : 'closed' }, { merge: true });
    tx.set(db.doc(`volunteers/${uid}/alerts/${incidentId}`), { reportRevision: c!.reportRevision || 0, locationRevision: c!.locationRevision || 0, answers: report.data()?.answers || null }, { merge: true });
    tx.set(db.doc(`reporters/${c!.reporterUid}/incidentStatuses/${incidentId}`), { status: 'accepted', handoverPending: false }, { merge: true });
    tx.set(db.doc(`patients/${c!.patientId}/incidentStatuses/${incidentId}`), { status: 'accepted' }, { merge: true });
    tx.create(db.collection('auditLogs').doc(), { action: 'handover-accepted', actorUid: uid, incidentId, handoverId, fromUid: p.fromUid, createdAt: FieldValue.serverTimestamp() });
    return { incidentId, status: 'accepted' };
  });
});

export const cancelIncidentHandover = guardedCall('cancelIncidentHandover', async request => {
  admin(request); const data = input(request.data, ['incidentId', 'handoverId']), incidentId = id(data.incidentId), handoverId = id(data.handoverId), db = getFirestore();
  return db.runTransaction(async tx => {
    const ref = db.doc(`incidents/${incidentId}`), record = ref.collection('handoverRequests').doc(handoverId), [incident, proposal] = await tx.getAll(ref, record), c = incident.data(), p = proposal.data();
    if (p?.status === 'cancelled') return { cancelled: true };
    if (!p || p.status !== 'pending' || !live(c) || c!.handover?.id !== handoverId) throw new HttpsError('failed-precondition', 'Đề nghị đã thay đổi; tải lại trước khi hủy.');
    tx.update(record, { status: 'cancelled', cancelledBy: request.auth!.uid, cancelledAt: FieldValue.serverTimestamp() }); tx.update(ref, { handover: FieldValue.delete() });
    tx.set(db.doc(`volunteers/${p.targetUid}/alerts/${incidentId}`), { status: 'closed' }, { merge: true });
    tx.set(db.doc(`reporters/${c!.reporterUid}/incidentStatuses/${incidentId}`), { handoverPending: false }, { merge: true });
    tx.create(db.collection('auditLogs').doc(), { action: 'handover-cancelled', actorUid: request.auth!.uid, incidentId, handoverId, createdAt: FieldValue.serverTimestamp() }); return { cancelled: true };
  });
});
