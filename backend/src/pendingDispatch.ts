import { type Firestore, type Transaction, Timestamp } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import { distanceMeters } from './reportValidation';
import { queuePush } from './pushJobs';

// Bounded pilot catch-up, not a scan on every 30-second location heartbeat.
// All reads precede writes so accept/cancel/observations race safely with joining.
export async function offerPendingIncidents(tx: Transaction, db: Firestore, uid: string, location: { latitude: number; longitude: number }, now: number) {
  const pending = await tx.get(db.collection('incidents').where('status', '==', 'dispatching')
    .where('offerExpiresAt', '>', Timestamp.fromMillis(now)).orderBy('offerExpiresAt').limit(101));
  if (pending.size > 100) throw new HttpsError('resource-exhausted', 'Có quá nhiều ca chờ để đồng bộ an toàn. Thử lại sau.', { reason: 'pending-dispatch-capacity' });
  const candidates = pending.docs.filter(item => {
    const value = item.data();
    return !value.acceptedBy && value.patientId !== uid && Array.isArray(value.invitedVolunteerIds) &&
      !value.invitedVolunteerIds.includes(uid) && value.invitedVolunteerIds.length < 20;
  });
  if (!candidates.length) return 0;
  const privateData = await tx.getAll(...candidates.flatMap(item => [item.ref.collection('private').doc('location'), item.ref.collection('private').doc('reporter')]));
  const matched = candidates.flatMap((item, index) => {
    const point = privateData[index * 2].data(), report = privateData[index * 2 + 1].data();
    if (!point || !Number.isFinite(point.latitude) || !Number.isFinite(point.longitude) || Math.abs(point.latitude) > 85 || Math.abs(point.longitude) > 180) return [];
    const distance = distanceMeters(location, point as { latitude: number; longitude: number });
    return distance <= 5000 ? [{ item, report, distance }] : [];
  });
  for (const { item, report, distance } of matched) {
    const value = item.data(), invitedVolunteerIds = [...value.invitedVolunteerIds, uid];
    queuePush(tx, db, uid, item.id, 'request', 0, value.offerExpiresAt);
    tx.update(item.ref, { invitedVolunteerIds });
    tx.update(db.doc(`reporters/${value.reporterUid}/incidentStatuses/${item.id}`), { invitedCount: invitedVolunteerIds.length });
    tx.set(db.doc(`patients/${value.patientId}/incidentStatuses/${item.id}`), { invitedCount: invitedVolunteerIds.length }, { merge: true });
    tx.create(db.doc(`volunteers/${uid}/alerts/${item.id}`), {
      incidentId: item.id, status: 'offered', distanceMeters: Math.round(distance), createdAt: value.createdAt,
      offeredAt: Timestamp.fromMillis(now), offerExpiresAt: value.offerExpiresAt,
      reportRevision: value.reportRevision ?? 0, answers: report?.answers ?? null,
    });
  }
  return matched.length;
}
