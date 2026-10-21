// Synthetic fixture only. Hard-coded loopback emulator hosts prevent cloud writes.
const { randomBytes } = require('node:crypto');
const { mkdirSync, writeFileSync } = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const functionsRequire = createRequire(path.resolve(__dirname, '../functions/package.json'));
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8180';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9199';
const { initializeApp } = functionsRequire('firebase-admin/app');
const { getAuth } = functionsRequire('firebase-admin/auth');
const { getFirestore, Timestamp } = functionsRequire('firebase-admin/firestore');
initializeApp({ projectId: 'demo-ehis-next' });
async function main() {
  const latitude = Number(process.argv[2]), longitude = Number(process.argv[3]);
  if (!process.argv[2] || !process.argv[3] || !Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    throw new Error('Usage: node scripts/seed-report-demo.cjs <latitude> <longitude> (synthetic volunteer location; match your test site)');
  }
  const db = getFirestore(), auth = getAuth();
  const patientId = 'synthetic-patient-demo';
  await db.doc(`patients/${patientId}`).set({ fullName: 'Synthetic Patient — local demo only' });
  const cardId = `synthetic-card-${randomBytes(8).toString('hex')}`;
  await db.doc(`cards/${cardId}`).set({ patientId, active: true });
  const email = `volunteer-${randomBytes(4).toString('hex')}@example.test`;
  const password = `Local-${randomBytes(12).toString('hex')}!`;
  const volunteer = await auth.createUser({ email, password });
  await db.doc(`volunteers/${volunteer.uid}`).set({ verificationStatus: 'approved', isAvailable: true,
    location: { latitude, longitude }, lastSeenAt: Timestamp.now() });
  const folder = path.resolve(__dirname, '../.local'); mkdirSync(folder, { recursive: true });
  const result = { environment: 'LOCAL EMULATORS ONLY', webPath: `/c/${cardId}`, email, password,
    note: 'Location freshness is 5 minutes. Re-run seed for a new fixture before testing. Old fixtures are not deleted.' };
  writeFileSync(path.join(folder, 'report-demo.json'), JSON.stringify(result, null, 2));
  console.log('Created synthetic local card + approved volunteer. Details in ignored .local/report-demo.json; expires for selection after 5 minutes.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
