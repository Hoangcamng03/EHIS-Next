import { guardedCall as onCall } from './guards';
import { cert, getApp, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { setGlobalOptions } from 'firebase-functions/v2';
import { HttpsError, onRequest } from 'firebase-functions/v2/https';
import { parsePatientProfile } from './profile';

const serviceAccount = process.env.EHIS_SERVICE_ACCOUNT_JSON;
if (process.env.VERCEL && (process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST)) throw new Error('Cloud backend must not connect to an emulator.');
if (serviceAccount) {
  const credential = JSON.parse(serviceAccount);
  if (credential.project_id !== 'ehis-next-20261021-hc03') throw new Error('Unexpected Firebase project for EHIS backend.');
  initializeApp({ credential: cert(credential), projectId: credential.project_id });
} else initializeApp();
setGlobalOptions({ region: 'asia-southeast1', maxInstances: 2, minInstances: 0, memory: '256MiB', timeoutSeconds: 30 });

export { createIncident, submitBystanderReport, updateIncidentLocation, acceptIncident, getVolunteerIncidentDetails, setVolunteerAvailability, finishIncident } from './reports';
export { issuePatientCard, revokePatientCard, applyVolunteer, listVolunteerApplications, reviewVolunteerApplication, markIncidentArrived, cancelPatientIncident } from './lifecycle';
export { setVolunteerReferrer, listReferrerApplications, submitVolunteerReferral } from './volunteerVerification';
export { registerVolunteerDevice } from './pushDevices';

// No identities, personal data, or secrets in a public health check.
export const health = onRequest({ cors: true }, (_request, response) => {
  response.json({ service: 'ehis-next', status: 'ok', version: '0.4.11', projectId: getApp().options.projectId || process.env.GCLOUD_PROJECT || null });
});

export const getMyAccess = onCall('getMyAccess', async request => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in first');
  const db = getFirestore(), uid = request.auth.uid;
  const [volunteer, user, patient, application, referrer] = await db.getAll(db.doc(`volunteers/${uid}`), db.doc(`users/${uid}`), db.doc(`patients/${uid}`), db.doc(`volunteerApplications/${uid}`), db.doc(`volunteerReferrers/${uid}`));
  const saved = user.data()?.accountPurpose;
  const accountPurpose = saved === 'patient' || saved === 'volunteer' ? saved : volunteer.exists || application.exists ? 'volunteer' : patient.exists ? 'patient' : null;
  return {
    uid: request.auth.uid,
    isAdmin: request.auth.token.admin === true,
    isVerifiedVolunteer: volunteer.exists && volunteer.data()?.verificationStatus === 'approved',
    isReferrer: referrer.data()?.enabled === true,
    accountPurpose,
  };
});

export const savePatientProfile = onCall('savePatientProfile', async request => {
  if (!request.auth || request.auth.token.firebase?.sign_in_provider === 'anonymous') {
    throw new HttpsError('unauthenticated', 'A registered account is required');
  }
  let profile;
  try {
    profile = parsePatientProfile(request.data);
  } catch (error) {
    throw new HttpsError('invalid-argument', error instanceof Error ? error.message : 'Invalid profile');
  }
  const db = getFirestore(), ref = db.doc(`patients/${request.auth.uid}`);
  await db.runTransaction(async tx => {
    const previous = await tx.get(ref);
    // Older APKs may edit other profile fields, but cannot attach an old contact name to a new phone.
    if (profile.emergencyContactName === undefined && previous.data()?.emergencyContactName &&
        profile.emergencyContactPhone !== previous.data()?.emergencyContactPhone) {
      throw new HttpsError('failed-precondition', 'Cập nhật app hoặc dùng bản web để sửa đầy đủ liên hệ khẩn cấp.');
    }
    tx.set(ref, { ...profile, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  });
  return { saved: true };
});

export { maintenance } from './maintenance';
export { setAccountPurpose } from './account';
