import { initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { setGlobalOptions } from 'firebase-functions/v2';
import { HttpsError, onCall, onRequest } from 'firebase-functions/v2/https';
import { parsePatientProfile } from './profile';

initializeApp();
setGlobalOptions({ region: 'asia-southeast1', maxInstances: 2 });

export { createIncident, submitBystanderReport, acceptIncident, getVolunteerIncidentDetails } from './reports';

// No identities, personal data, or secrets in a public health check.
export const health = onRequest({ cors: true }, (_request, response) => {
  response.json({ service: 'ehis-next', status: 'ok', version: '0.1.0' });
});

export const getMyAccess = onCall(async request => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in first');
  const volunteer = await getFirestore().doc(`volunteers/${request.auth.uid}`).get();
  return {
    uid: request.auth.uid,
    isAdmin: request.auth.token.admin === true,
    isVerifiedVolunteer: volunteer.exists && volunteer.data()?.verificationStatus === 'approved',
  };
});

export const savePatientProfile = onCall(async request => {
  if (!request.auth || request.auth.token.firebase?.sign_in_provider === 'anonymous') {
    throw new HttpsError('unauthenticated', 'A registered account is required');
  }
  let profile;
  try {
    profile = parsePatientProfile(request.data);
  } catch (error) {
    throw new HttpsError('invalid-argument', error instanceof Error ? error.message : 'Invalid profile');
  }
  await getFirestore().doc(`patients/${request.auth.uid}`).set({
    ...profile,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  return { saved: true };
});
