import { createHash } from 'node:crypto';
import { getApp } from 'firebase-admin/app';
import { getFirestore, Timestamp, type Transaction, type Firestore } from 'firebase-admin/firestore';
import { pushMessage } from './pushPolicy';

export function queuePush(tx: Transaction, db: Firestore, uid: string, incidentId: string, kind: string, revision: number, expiresAt: Timestamp) {
  const id = createHash('sha256').update(`${uid}:${incidentId}:${kind}:${revision}`).digest('hex');
  tx.set(db.doc(`pushJobs/${id}`), { uid, incidentId, kind, revision, expiresAt, status: 'pending', leaseUntil: 0, attempts: 0, purgeAfter: Timestamp.fromMillis(expiresAt.toMillis() + 86400000) });
}
export async function flushPushJobs() {
  if (process.env.EHIS_FCM_ENABLED !== 'true' || process.env.FIRESTORE_EMULATOR_HOST) return { skipped: true };
  const db = getFirestore(), jobs = await db.collection('pushJobs').where('status', '==', 'pending').where('leaseUntil', '<=', Date.now()).orderBy('leaseUntil').limit(20).get();
  const credential = getApp().options.credential;
  if (!credential) throw new Error('missing-fcm-credential');
  // This work runs after the response on Vercel. Jobs remain retryable if interrupted.
  const token = await credential.getAccessToken();
  const results = await Promise.all(jobs.docs.map(async doc => {
    const job = await db.runTransaction(async tx => {
      const current = await tx.get(doc.ref), value = current.data();
      if (!value || value.status !== 'pending' || value.leaseUntil > Date.now()) return null;
      if (value.expiresAt.toMillis() <= Date.now() || value.attempts >= 5) { tx.update(doc.ref, { status: 'expired' }); return null; }
      tx.update(doc.ref, { leaseUntil: Date.now() + 30000, attempts: value.attempts + 1 }); return value;
    });
    if (!job) return 'skipped';
    const [incident, volunteer, alert, device] = await db.getAll(db.doc(`incidents/${job.incidentId}`), db.doc(`volunteers/${job.uid}`), db.doc(`volunteers/${job.uid}/alerts/${job.incidentId}`), db.doc(`pushDevices/${job.uid}`));
    const value = incident.data(), person = volunteer.data(), offer = alert.data();
    const offered = value?.status === 'dispatching' && !value.acceptedBy && offer?.status === 'offered' && person?.isAvailable === true && !person.activeIncidentId && Date.now() - (person.lastSeenAt?.toMillis?.() || 0) <= 300000;
    const assigned = ['accepted', 'arrived'].includes(value?.status) && value?.acceptedBy === job.uid && person?.activeIncidentId === job.incidentId;
    if (person?.verificationStatus !== 'approved' || (!offered && !assigned) || (job.kind === 'request' && !offered)) { await doc.ref.update({ status: 'obsolete', leaseUntil: 0 }); return 'obsolete'; }
    const devices = (device.data()?.devices || []) as { token: string; updatedAt: number }[];
    const tokens = devices.filter(item => Date.now() - item.updatedAt <= 30 * 86400000).map(item => item.token).slice(0, 3);
    if (!tokens.length) { await doc.ref.update({ status: 'no-device', leaseUntil: 0 }); return 'no-device'; }
    const expiry = assigned ? Math.min(job.expiresAt.toMillis(), Date.now() + 120000) : job.expiresAt.toMillis();
    const responses = await Promise.all(tokens.map(async deviceToken => {
      try {
        const response = await fetch(`https://fcm.googleapis.com/v1/projects/${getApp().options.projectId}/messages:send`, { method: 'POST', headers: { Authorization: `Bearer ${token.access_token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: { ...pushMessage(job.incidentId, job.kind, expiry, Date.now()), token: deviceToken } }), signal: AbortSignal.timeout(5000) });
        // Only retain status; never log FCM request/response bodies or device tokens.
        return response.ok ? 'accepted' : response.status === 404 ? 'invalid-token' : response.status === 400 ? 'invalid-request' : 'retry';
      } catch { return 'retry'; }
    }));
    const status = responses.includes('retry') ? 'pending' : responses.includes('accepted') ? 'accepted-by-fcm' : 'failed';
    await doc.ref.update({ status, leaseUntil: status === 'pending' ? Date.now() + 15000 : 0, lastAttemptAt: Timestamp.now() });
    return status;
  }));
  return { scanned: jobs.size, acceptedByFcm: results.filter(value => value === 'accepted-by-fcm').length };
}
