const fs = require('node:fs'),
  path = require('node:path');
const { db, actor, ok, card, Timestamp } = require('./emulator.cjs');
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
  const dir = path.resolve(__dirname, '../../.local/product-review-20261112');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, 'ui-fixtures.private.json'),
    JSON.stringify({ patient, volunteer, cardId }, null, 2),
  );
  console.log(
    'Local UI fixtures ready: patient profile/card and preapproved volunteer. No credentials printed.',
  );
  await db.terminate();
})().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
