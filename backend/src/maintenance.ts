import { FieldValue, FieldPath, getFirestore, Timestamp, type Query, type QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { flushPushJobs } from './pushJobs';
import { randomUUID } from 'node:crypto';

export async function runMaintenance(now = Date.now()) {
  const db = getFirestore(), started = performance.now(), budgetMs = 35000;
  const counts = { expired: 0, purged: 0, counters: 0, pushJobs: 0, protectedSkipped: 0 };
  const remaining = { expired: false, purged: false, counters: false, pushJobs: false };
  const leaseRef = db.doc('_operations/maintenanceLease'), owner = randomUUID();
  const acquired = await db.runTransaction(async tx => {
    const prior = (await tx.get(leaseRef)).data();
    if (prior?.until > Date.now()) return false;
    tx.set(leaseRef, { owner, until: Date.now() + 55000 }); return true;
  });
  if (!acquired) return { ...counts, remaining, status: 'busy', checkedAtMs: Date.now(), elapsedMs: 0 };
  // Advance the cursor even past protected active records; do not revisit one page forever.
  async function drain(name: keyof typeof remaining, query: Query, size: number, work: (docs: QueryDocumentSnapshot[]) => Promise<void>) {
    let cursor: QueryDocumentSnapshot | undefined;
    for (let page = 0; page < 50; page++) {
      if (performance.now() - started >= budgetMs) { remaining[name] = !(await (cursor ? query.startAfter(cursor) : query).limit(1).get()).empty; return; }
      const snapshot = await (cursor ? query.startAfter(cursor) : query).limit(size).get();
      if (snapshot.empty) return;
      await work(snapshot.docs); cursor = snapshot.docs.at(-1);
      if (snapshot.size < size) return;
    }
    remaining[name] = !(await (cursor ? query.startAfter(cursor) : query).limit(1).get()).empty;
  }
  async function transactions(docs: QueryDocumentSnapshot[], work: (doc: QueryDocumentSnapshot) => Promise<void>) {
    for (let i = 0; i < docs.length; i += 4) await Promise.all(docs.slice(i, i + 4).map(work));
  }
  try {
    await db.doc('_operations/maintenance').set({ status: 'running', checkedAtMs: Date.now() });
    // Private retention takes priority over housekeeping counters.
    await drain('purged', db.collection('incidents').where('purgeAfter', '<=', Timestamp.fromMillis(now)).orderBy('purgeAfter').orderBy(FieldPath.documentId()), 50, docs => transactions(docs, async candidate => {
      const outcome = await db.runTransaction(async tx => {
        const snapshot = await tx.get(candidate.ref), value = snapshot.data();
        if (!value || !value.purgeAfter || value.purgeAfter.toMillis() > now) return 'unchanged';
        if (!['expired', 'completed', 'cancelled'].includes(value.status)) return 'protected';
        tx.delete(candidate.ref.collection('private').doc('location')); tx.delete(candidate.ref.collection('private').doc('reporter'));
        for (const uid of value.invitedVolunteerIds || []) tx.set(db.doc(`volunteers/${uid}/alerts/${snapshot.id}`), { answers: FieldValue.delete() }, { merge: true });
        tx.update(candidate.ref, { purgeAfter: FieldValue.delete(), privatePurgedAt: Timestamp.fromMillis(now) }); return 'purged';
      }); if (outcome === 'purged') counts.purged++; else if (outcome === 'protected') counts.protectedSkipped++;
    }));
    await drain('expired', db.collection('incidents').where('status', '==', 'dispatching').where('offerExpiresAt', '<=', Timestamp.fromMillis(now)).orderBy('offerExpiresAt').orderBy(FieldPath.documentId()), 50, docs => transactions(docs, async candidate => {
      const changed = await db.runTransaction(async tx => {
        const snapshot = await tx.get(candidate.ref), value = snapshot.data();
        if (!value || value.status !== 'dispatching' || value.offerExpiresAt.toMillis() > now) return false;
        const cardRef = db.doc(`cards/${value.cardId}`), card = await tx.get(cardRef);
        tx.update(candidate.ref, { status: 'expired', closedAt: Timestamp.fromMillis(now), purgeAfter: Timestamp.fromMillis(now + 86400000) });
        tx.set(db.doc(`patients/${value.patientId}/incidentStatuses/${snapshot.id}`), { status: 'expired' }, { merge: true });
        tx.update(db.doc(`reporters/${value.reporterUid}/incidentStatuses/${snapshot.id}`), { status: 'expired' });
        for (const uid of value.invitedVolunteerIds) tx.update(db.doc(`volunteers/${uid}/alerts/${snapshot.id}`), { status: 'expired' });
        if (card.data()?.activeIncidentId === snapshot.id) tx.update(cardRef, { activeIncidentId: null }); return true;
      }); if (changed) counts.expired++;
    }));
    for (const [name, collection, field] of [['counters', '_requestLimits', 'expiresAt'], ['pushJobs', 'pushJobs', 'purgeAfter']] as const) {
      await drain(name, db.collection(collection).where(field, '<=', Timestamp.fromMillis(now)).orderBy(field).orderBy(FieldPath.documentId()), 200, async docs => {
        const batch = db.batch(); docs.forEach(doc => batch.delete(doc.ref)); await batch.commit(); counts[name] += docs.length;
      });
    }
    const result = { ...counts, remaining, status: Object.values(remaining).some(Boolean) ? 'partial' : 'complete', checkedAtMs: Date.now(), elapsedMs: Math.round(performance.now() - started) };
    await db.doc('_operations/maintenance').set(result);
    if (performance.now() - started < budgetMs - 5000) await flushPushJobs();
    return result;
  } catch (error) {
    await db.doc('_operations/maintenance').set({ status: 'failed', checkedAtMs: Date.now(), ...counts, remaining }).catch(() => undefined);
    throw error;
  } finally {
    await db.runTransaction(async tx => { const lease = (await tx.get(leaseRef)).data(); if (lease?.owner === owner) tx.delete(leaseRef); }).catch(() => undefined);
  }
}

// Spark/Vercel uses the daily authenticated cron, plus an explicit bounded admin retry.
export const maintenance = onSchedule({ schedule: 'every 24 hours', timeZone: 'Asia/Ho_Chi_Minh', maxInstances: 1, timeoutSeconds: 120, retryCount: 1 }, async () => { await runMaintenance(); });
