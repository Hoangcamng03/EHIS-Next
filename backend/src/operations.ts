import { getFirestore, Timestamp, type Query } from 'firebase-admin/firestore';
import { HttpsError, type CallableRequest } from 'firebase-functions/v2/https';
import { guardedCall } from './guards';
import { objectValue } from './reportValidation';
import { flushPushJobs } from './pushJobs';
import { runMaintenance } from './maintenance';
function operator(request: CallableRequest<unknown>) {
  if (request.auth?.token.admin !== true) throw new HttpsError('permission-denied', 'Chỉ quản trị được theo dõi vận hành.');
  try { objectValue(request.data, []); } catch { throw new HttpsError('invalid-argument', 'Không nhận dữ liệu bổ sung.'); }
}
export const getOperationsOverview = guardedCall('getOperationsOverview', async request => {
  operator(request); const db = getFirestore(), now = Date.now(), incidents = db.collection('incidents'), jobs = db.collection('pushJobs');
  const count = async (query: Query) => (await query.count().get()).data().count;
  const waiting = incidents.where('status', '==', 'dispatching');
  const [dispatching, accepted, arrived, expiredWaiting, pendingNotifications, dueNotifications, expiredPendingNotifications, failedNotifications, oldest] = await Promise.all([
    count(waiting), count(incidents.where('status', '==', 'accepted')), count(incidents.where('status', '==', 'arrived')),
    count(waiting.where('offerExpiresAt', '<=', Timestamp.fromMillis(now))), count(jobs.where('status', '==', 'pending')),
    count(jobs.where('status', '==', 'pending').where('leaseUntil', '<=', now).where('expiresAt', '>', Timestamp.fromMillis(now)).orderBy('leaseUntil').orderBy('expiresAt')),
    count(jobs.where('status', '==', 'pending').where('expiresAt', '<=', Timestamp.fromMillis(now))), count(jobs.where('status', 'in', ['failed', 'expired'])),
    waiting.orderBy('offerExpiresAt', 'asc').limit(5).get(),
  ]);
  const maintenance = (await db.doc('_operations/maintenance').get()).data() ?? null;
  return { checkedAtMs: now, counts: { dispatching, accepted, arrived, expiredWaiting, pendingNotifications, dueNotifications, expiredPendingNotifications, failedNotifications }, maintenance,
    oldestWaiting: oldest.docs.map(doc => ({ incidentId: doc.id, invitedCount: Number(doc.data().invitedVolunteerIds?.length || 0), expiresAtMs: doc.data().offerExpiresAt?.toMillis?.() ?? null })),
    pushEnabled: process.env.EHIS_FCM_ENABLED === 'true' && !process.env.FIRESTORE_EMULATOR_HOST };
});
export const retryPendingNotifications = guardedCall('retryPendingNotifications', async request => {
  operator(request); return flushPushJobs();
});
export const runMaintenanceNow = guardedCall('runMaintenanceNow', async request => {
  operator(request); return runMaintenance();
}, { timeoutSeconds: 45 });
