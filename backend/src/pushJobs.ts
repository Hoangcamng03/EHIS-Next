import { handoverTargets } from './handoverPolicy';
import { createHash, randomUUID } from 'node:crypto';
import { getApp } from 'firebase-admin/app';
import { getFirestore, Timestamp, type Transaction, type Firestore } from 'firebase-admin/firestore';
import { pushMessage } from './pushPolicy';
import { pendingPushDevices, type DeviceReceipt } from './pushDelivery';
type ClaimedJob = { uid: string; incidentId: string; kind: string; expiresAt: Timestamp; leaseOwner: string; deviceKey?: string; deviceResults?: DeviceReceipt[]; handoverId?: string };

// Persist only hashed device outcomes. A stale worker cannot overwrite a newer lease.
export async function recordPushDeviceResult(db: Firestore, jobId: string, leaseOwner: string, receipt: DeviceReceipt) {
  return db.runTransaction(async tx => {
    const ref = db.doc(`pushJobs/${jobId}`), snapshot = await tx.get(ref), job = snapshot.data();
    if (!job || job.leaseOwner !== leaseOwner || job.status !== 'pending') return false;
    const receipts = (job.deviceResults || []) as DeviceReceipt[];
    tx.update(ref, { deviceResults: [...receipts.filter(item => item.key !== receipt.key), receipt].slice(-15) });
    return true;
  });
}

export function pushJobId(uid: string, incidentId: string, kind: string, revision: number, deviceKey?: string) {
  return createHash('sha256').update(`${uid}:${incidentId}:${kind}:${revision}${deviceKey ? ':device:' + deviceKey : ''}`).digest('hex');
}
export function queuePush(tx: Transaction, db: Firestore, uid: string, incidentId: string, kind: string, revision: number, expiresAt: Timestamp, deviceKey?: string, handoverId?: string) {
  const id = pushJobId(uid, incidentId, kind, revision, deviceKey);
  tx.set(db.doc(`pushJobs/${id}`), { uid, incidentId, kind, revision, expiresAt, ...(deviceKey ? { deviceKey } : {}), ...(handoverId ? { handoverId } : {}), status: 'pending', leaseUntil: 0, attempts: 0, purgeAfter: Timestamp.fromMillis(expiresAt.toMillis() + 86400000) });
}
export function eligiblePushJobs(db: Firestore, now: number) {
  return db.collection('pushJobs').where('status', '==', 'pending').where('leaseUntil', '<=', now)
    .where('expiresAt', '>', Timestamp.fromMillis(now)).orderBy('leaseUntil').orderBy('expiresAt').limit(20);
}
export async function flushPushJobs() {
  if (process.env.EHIS_FCM_ENABLED !== 'true' || process.env.FIRESTORE_EMULATOR_HOST) return { skipped: true };
  const db = getFirestore(), now = Date.now();
  // Expired backlog must not occupy the bounded batch ahead of still-valid notifications.
  const jobs = await eligiblePushJobs(db, now).get();
  const credential = getApp().options.credential;
  if (!credential) throw new Error('missing-fcm-credential');
  // This work runs after the response on Vercel. Jobs remain retryable if interrupted.
  const token = await credential.getAccessToken();
  const results = await Promise.all(jobs.docs.map(async doc => {
    const job = await db.runTransaction(async tx => {
      const current = await tx.get(doc.ref), value = current.data();
      if (!value || value.status !== 'pending' || value.leaseUntil > Date.now()) return null;
      if (value.expiresAt.toMillis() <= Date.now() || value.attempts >= 5) { tx.update(doc.ref, { status: 'expired' }); return null; }
      const leaseOwner = randomUUID();
      tx.update(doc.ref, { leaseUntil: Date.now() + 30000, leaseOwner, attempts: value.attempts + 1 }); return { ...value, leaseOwner } as ClaimedJob;
    });
    if (!job) return 'skipped';
    const finish = async (status: string) => db.runTransaction(async tx => {
      const current = (await tx.get(doc.ref)).data();
      if (current?.leaseOwner !== job.leaseOwner || current.status !== 'pending') return false;
      tx.update(doc.ref, { status, leaseUntil: status === 'pending' ? Date.now() + 15000 : 0, lastAttemptAt: Timestamp.now() }); return true;
    });
    const [incident, volunteer, alert, device] = await db.getAll(db.doc(`incidents/${job.incidentId}`), db.doc(`volunteers/${job.uid}`), db.doc(`volunteers/${job.uid}/alerts/${job.incidentId}`), db.doc(`pushDevices/${job.uid}`));
    const value = incident.data(), person = volunteer.data(), offer = alert.data();
    const offered = value?.status === 'dispatching' && !value.acceptedBy && offer?.status === 'offered' && person?.isAvailable === true && !person.activeIncidentId && Date.now() - (person.lastSeenAt?.toMillis?.() || 0) <= 300000;
    const handoverOffered = ['accepted', 'arrived'].includes(value?.status) && !!value?.handover && handoverTargets(value.handover).includes(job.uid) && value.handover.id === job.handoverId && value.handover.expiresAt.toMillis() > Date.now() && offer?.status === 'offered' && offer.handoverId === job.handoverId && person?.isAvailable === true && !person.activeIncidentId && Date.now() - (person.lastSeenAt?.toMillis?.() || 0) <= 300000;
    const assigned = ['accepted', 'arrived'].includes(value?.status) && value?.acceptedBy === job.uid && person?.activeIncidentId === job.incidentId;
    if (person?.verificationStatus !== 'approved' || (!offered && !handoverOffered && !assigned) || (job.kind === 'request' && !offered && !handoverOffered)) { await finish('obsolete'); return 'obsolete'; }
    const devices = (device.data()?.devices || []) as { token: string; updatedAt: number }[];
    const receipts = (job.deviceResults || []) as DeviceReceipt[];
    const tokens = pendingPushDevices(devices, receipts, Date.now(), job.deviceKey);
    if (!tokens.length) { const status = receipts.some(r => r.status === 'accepted') ? 'accepted-by-fcm' : receipts.length ? 'failed' : 'no-device'; await finish(status); return status; }
    const expiry = assigned ? Math.min(job.expiresAt.toMillis(), Date.now() + 120000) : job.expiresAt.toMillis();
    const responses = await Promise.all(tokens.map(async device => {
      try {
        const response = await fetch(`https://fcm.googleapis.com/v1/projects/${getApp().options.projectId}/messages:send`, { method: 'POST', headers: { Authorization: `Bearer ${token.access_token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: { ...pushMessage(job.incidentId, job.kind, expiry, Date.now()), token: device.token } }), signal: AbortSignal.timeout(5000) });
        // Only retain status; never log FCM request/response bodies or device tokens.
        const outcome = response.ok ? 'accepted' : response.status === 404 ? 'invalid-token' : response.status === 400 ? 'invalid-request' : 'retry';
        if (outcome !== 'retry') await recordPushDeviceResult(db, doc.id, job.leaseOwner, { key: device.key, status: outcome, at: Date.now() });
        return outcome;
      } catch { return 'retry'; }
    }));
    const status = responses.includes('retry') ? 'pending' : responses.includes('accepted') || receipts.some(r => r.status === 'accepted') ? 'accepted-by-fcm' : 'failed';
    await finish(status);
    return status;
  }));
  return { scanned: jobs.size, acceptedByFcm: results.filter(value => value === 'accepted-by-fcm').length };
}
