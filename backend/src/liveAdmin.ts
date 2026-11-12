import { getAuth } from 'firebase-admin/auth';
import { HttpsError } from 'firebase-functions/v2/https';

const privileged = new Set([
  'listVolunteerApplications',
  'reviewVolunteerApplication',
  'setVolunteerReferrer',
  'listVolunteerRoster',
  'updateVolunteerRegion',
  'setVolunteerSuspension',
  'getOperationsOverview',
  'retryPendingNotifications',
  'runMaintenanceNow',
  'listHandoverHistory',
  'listHandoverCases',
  'listHandoverCandidates',
  'proposeIncidentHandover',
  'cancelIncidentHandover',
]);
export async function verifyLiveAdmin(operation: string, uid: string, tokenAdmin: unknown) {
  if (!privileged.has(operation)) return;
  if (tokenAdmin !== true) throw new HttpsError('permission-denied', 'Cần quyền quản trị.');
  const user = await getAuth()
    .getUser(uid)
    .catch(() => null);
  if (!user || user.disabled || user.customClaims?.admin !== true) {
    throw new HttpsError(
      'permission-denied',
      'Quyền quản trị đã thay đổi. Đăng nhập lại để cập nhật.',
    );
  }
}
