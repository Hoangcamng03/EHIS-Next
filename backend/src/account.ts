import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import { guardedCall } from './guards';

export type AccountPurpose = 'patient' | 'volunteer';
export function parseAccountPurpose(data: unknown): AccountPurpose {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new HttpsError('invalid-argument', 'Choose an account purpose');
  const input = data as Record<string, unknown>;
  if (Object.keys(input).length !== 1 || (input.purpose !== 'patient' && input.purpose !== 'volunteer')) throw new HttpsError('invalid-argument', 'Invalid account purpose');
  return input.purpose as AccountPurpose;
}

// A navigation preference, never a role, approval or permission grant.
export const setAccountPurpose = guardedCall('setAccountPurpose', async request => {
  if (!request.auth || request.auth.token.firebase?.sign_in_provider === 'anonymous') throw new HttpsError('unauthenticated', 'A registered account is required');
  const purpose = parseAccountPurpose(request.data);
  const db = getFirestore(), ref = db.doc(`users/${request.auth.uid}`);
  await db.runTransaction(async tx => {
    const user = await tx.get(ref);
    const current = user.data()?.accountPurpose;
    if (current && current !== purpose) throw new HttpsError('failed-precondition', 'Account purpose is already registered');
    if (!current) tx.set(ref, { accountPurpose: purpose, accountPurposeUpdatedAt: FieldValue.serverTimestamp() }, { merge: true });
  });
  return { accountPurpose: purpose };
});
