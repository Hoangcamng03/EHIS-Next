import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';

export async function runMaintenance(now = Date.now()) {
  const db = getFirestore();
  const expired = await db.collection('incidents').where('status', '==', 'dispatching').where('offerExpiresAt', '<=', Timestamp.fromMillis(now)).limit(50).get();
  for (const candidate of expired.docs) await db.runTransaction(async tx => {
    const snapshot = await tx.get(candidate.ref), value = snapshot.data();
    if (!value || value.status !== 'dispatching' || value.offerExpiresAt.toMillis() > now) return;
    const cardRef = db.doc(`cards/${value.cardId}`), card = await tx.get(cardRef);
    tx.update(candidate.ref, { status: 'expired', closedAt: Timestamp.fromMillis(now), purgeAfter: Timestamp.fromMillis(now + 86400000) });
    tx.set(db.doc(`patients/${value.patientId}/incidentStatuses/${snapshot.id}`), { status: 'expired' }, { merge: true });
    tx.update(db.doc(`reporters/${value.reporterUid}/incidentStatuses/${snapshot.id}`), { status: 'expired' });
    for (const uid of value.invitedVolunteerIds) tx.update(db.doc(`volunteers/${uid}/alerts/${snapshot.id}`), { status: 'expired' });
    if (card.data()?.activeIncidentId === snapshot.id) tx.update(cardRef, { activeIncidentId: null });
  });
  const purge = await db.collection('incidents').where('purgeAfter', '<=', Timestamp.fromMillis(now)).limit(50).get();
  for (const candidate of purge.docs) await db.runTransaction(async tx => {
    const snapshot = await tx.get(candidate.ref), value = snapshot.data();
    if (!value || !['expired', 'completed', 'cancelled'].includes(value.status) || !value.purgeAfter || value.purgeAfter.toMillis() > now) return;
    tx.delete(candidate.ref.collection('private').doc('location'));
    tx.delete(candidate.ref.collection('private').doc('reporter'));
    for (const uid of value.invitedVolunteerIds) tx.set(db.doc(`volunteers/${uid}/alerts/${snapshot.id}`), { answers: FieldValue.delete() }, { merge: true });
    tx.update(candidate.ref, { purgeAfter: FieldValue.delete(), privatePurgedAt: Timestamp.fromMillis(now) });
  });
  const counters = await db.collection('_requestLimits').where('expiresAt', '<=', Timestamp.fromMillis(now)).limit(200).get();
  if (!counters.empty) { const batch = db.batch(); counters.docs.forEach(item => batch.delete(item.ref)); await batch.commit(); }
  return { expired: expired.size, purged: purge.size, counters: counters.size };
}

// Optional Firebase deployment only. Spark/Vercel uses the authenticated daily cron instead.
export const maintenance = onSchedule({ schedule: 'every 24 hours', timeZone: 'Asia/Ho_Chi_Minh', maxInstances: 1, timeoutSeconds: 120, retryCount: 1 }, async () => { await runMaintenance(); });
