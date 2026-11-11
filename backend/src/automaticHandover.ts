import { type DocumentData, type Firestore, type Transaction, Timestamp } from 'firebase-admin/firestore';
import { dispatchBounds } from './dispatchBounds';
import { distanceMeters } from './reportValidation';
import { volunteerReadiness } from './readiness';
import { queuePush } from './pushJobs';
import { handoverTargets } from './handoverPolicy';

// Plan every read before writing progress. A failed lookup never relinquishes assignment.
export async function planAutomaticHandover(tx: Transaction, db: Firestore, c: DocumentData, incidentId: string, uid: string, handoverId: string, now: number) {
  if (c.handover?.expiresAt?.toMillis() > now && handoverTargets(c.handover).length > 0) return { summary: { handoverInvitedCount: handoverTargets(c.handover).length, handoverExpiresAtMs: c.handover.expiresAt.toMillis(), handoverStatus: 'pending' }, write: () => undefined };
  const ref = db.doc(`incidents/${incidentId}`);
  const [location, report] = await tx.getAll(ref.collection('private').doc('location'), ref.collection('private').doc('reporter'));
  const point = location.data() as { latitude: number; longitude: number } | undefined;
  const pages = point ? await Promise.all(dispatchBounds(point).map(w => tx.get(db.collection('volunteers')
    .where('verificationStatus', '==', 'approved').where('isAvailable', '==', true)
    .where('location.latitude', '>=', w.south).where('location.latitude', '<=', w.north)
    .where('location.longitude', '>=', w.west).where('location.longitude', '<=', w.east)
    .where('lastSeenAt', '>=', Timestamp.fromMillis(now - 300000)).where('lastSeenAt', '<=', Timestamp.fromMillis(now + 60000))
    .orderBy('location.latitude').orderBy('location.longitude').orderBy('lastSeenAt').limit(1001)))) : [];
  const people = [...new Map(pages.flatMap(p => p.docs).map(d => [d.id, d])).values()];
  const capacity = people.length > 1000 || (c.invitedVolunteerIds?.length || 0) > 35;
  const selected = !point || capacity ? [] : people.flatMap(d => {
    const v = d.data(); if (d.id === uid || d.id === c.patientId || !volunteerReadiness(v, now).readyForDispatch) return [];
    const distance = distanceMeters(point, v.location); return distance <= 5000 ? [{ uid: d.id, distance }] : [];
  }).sort((a, b) => a.distance - b.distance || a.uid.localeCompare(b.uid)).slice(0, 5);
  const targetUids = selected.map(p => p.uid), expiresAt = Timestamp.fromMillis(now + 300000), sequence = Number(c.handoverSequence || 0) + 1;
  const summary = { handoverInvitedCount: selected.length, handoverExpiresAtMs: expiresAt.toMillis(), handoverStatus: capacity ? 'capacity' : selected.length ? 'pending' : 'no_candidates' };
  return { summary, write: () => {
    if (c.handover) {
      tx.update(ref.collection('handoverRequests').doc(c.handover.id), { status: c.handover.expiresAt.toMillis() > now ? 'replaced' : 'expired' });
      for (const previous of handoverTargets(c.handover)) if (!targetUids.includes(previous)) tx.set(db.doc(`volunteers/${previous}/alerts/${incidentId}`), { status: 'closed' }, { merge: true });
    }
    const proposal = { id: handoverId, fromUid: uid, targetUid: targetUids[0] || null, targetUids, expiresAt, mode: 'automatic' };
    tx.create(ref.collection('handoverRequests').doc(handoverId), { ...proposal, status: 'pending', reason: 'TNV phụ trách xác nhận không thể tiếp tục; tự tìm người nhận thay.', requestedBy: uid, requestedAt: Timestamp.fromMillis(now) });
    tx.update(ref, { handover: proposal, handoverSequence: sequence, invitedVolunteerIds: [...new Set([...(c.invitedVolunteerIds || []), ...targetUids])] });
    for (const person of selected) {
      tx.set(db.doc(`volunteers/${person.uid}/alerts/${incidentId}`), { incidentId, status: 'offered', offerKind: 'handover', handoverId, createdAt: Timestamp.fromMillis(now), offeredAt: Timestamp.fromMillis(now), offerExpiresAt: expiresAt, distanceMeters: Math.round(person.distance), reportRevision: c.reportRevision || 0, locationRevision: c.locationRevision || 0, answers: report.data()?.answers || null });
      queuePush(tx, db, person.uid, incidentId, 'request', sequence, expiresAt, undefined, handoverId);
    }
    for (const p of [`reporters/${c.reporterUid}/incidentStatuses/${incidentId}`, `patients/${c.patientId}/incidentStatuses/${incidentId}`]) tx.set(db.doc(p), { handoverPending: true }, { merge: true });
    tx.create(db.collection('auditLogs').doc(), { action: 'automatic-handover-requested', actorUid: uid, incidentId, handoverId, invitedCount: selected.length, capacity, createdAt: Timestamp.fromMillis(now) });
  } };
}
