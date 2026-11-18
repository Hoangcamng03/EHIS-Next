const fs = require('node:fs'),
  path = require('node:path');
const { db, auth, actor, ok, card, Timestamp } = require('./emulator.cjs');
(async () => {
  const patient = await actor('ui-patient'),
    volunteer = await actor('ui-volunteer');
  await ok(
    'savePatientProfile',
    {
      fullName: 'Nguyễn Minh An',
      medicalConditions: ['Hen phế quản'],
      allergies: ['Penicillin'],
      emergencyContactPhone: '',
    },
    patient,
  );
  const cardId = (await ok('issuePatientCard', { shareProfile: true }, patient)).cardId;
  await ok('setAccountPurpose', { purpose: 'volunteer' }, volunteer);
  await db.doc('volunteers/' + volunteer.localId).set({
    verificationStatus: 'approved',
    verificationPolicyVersion: 2,
    isAvailable: false,
    fullName: 'Nguyễn Anh Khoa',
    lastSeenAt: Timestamp.now(),
  });
  const remotePatient = await actor('remote-ui-patient'),
    admin = await actor('ui-admin'),
    applicant = await actor('ui-applicant');
  const remoteCardId = await card(remotePatient);
  await auth.setCustomUserClaims(admin.localId, { admin: true });
  await ok('setAccountPurpose', { purpose: 'volunteer' }, applicant);
  const dir = path.resolve(__dirname, '../../.local/product-review-20261112');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, 'ui-fixtures.private.json'),
    JSON.stringify({ patient, volunteer, cardId, remoteCardId, admin, applicant }, null, 2),
  );
  console.log(
    'Local UI fixtures ready: patient profile/card and preapproved volunteer. No credentials printed.',
  );
  await db.terminate();
})().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
