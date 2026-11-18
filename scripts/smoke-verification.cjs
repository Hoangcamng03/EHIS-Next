// HTTP/Auth/Firestore checks in the isolated emulator, never clinical credential verification.
const {
  assert,
  actor,
  auth,
  db,
  api,
  ok,
  direct,
  volunteer,
  randomUUID,
  Timestamp,
} = require('./test-support/emulator.cjs');
const { writeFileSync, mkdirSync } = require('node:fs');
async function login(user) {
  const response = await fetch(
    'http://127.0.0.1:9199/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-key',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, password: user.password, returnSecureToken: true }),
    },
  );
  assert.equal(response.status, 200);
  Object.assign(user, await response.json());
}
async function main() {
  const startedAt = new Date().toISOString(),
    checks = [];
  const [admin, trainee, intruder, patient, reporter, specialist] = await Promise.all(
    ['admin', 'trainee', 'intruder', 'patient', 'reporter', 'specialist'].map((x) => actor(x)),
  );
  await auth.setCustomUserClaims(admin.localId, { admin: true });
  await login(admin);
  const form = {
    fullName: 'Nguyễn Anh Khoa',
    phone: '0900000000',
    experience: 'Chứng nhận được cung cấp trong kịch bản local',
    trainingLevel: 'clinical_student',
    clinicalMonths: 2,
    homeAddress: 'Phường Trung Tâm',
    workAddress: 'Đơn vị An Bình',
    serviceArea: 'Khu trung tâm',
    specialties: ['basic_aid', 'cpr'],
  };
  const a = await ok('applyVolunteer', form, trainee);
  const verification = {
    checklist: {
      identityChecked: true,
      affiliationChecked: true,
      trainingChecked: true,
      scopeExplained: true,
    },
    trainingLevel: 'clinical_student',
    clinicalMonths: 2,
    specialties: ['basic_aid', 'cpr'],
    evidence: 'Local fixture evidence; not clinical verification',
  };
  const review = {
    uid: trainee.localId,
    applicationRevision: a.applicationRevision,
    decision: 'approved',
    verification,
  };
  assert.equal((await api('reviewVolunteerApplication', review, trainee)).status, 403);
  assert.equal(
    (await api('reviewVolunteerApplication', { ...review, verification: undefined }, admin)).status,
    400,
  );
  assert.equal(
    (
      await api(
        'reviewVolunteerApplication',
        {
          ...review,
          verification: {
            ...verification,
            checklist: { ...verification.checklist, trainingChecked: false },
          },
        },
        admin,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await api(
        'reviewVolunteerApplication',
        { ...review, verification: { ...verification, specialties: ['doctor'] } },
        admin,
      )
    ).status,
    400,
  );
  const b = await ok('applyVolunteer', { ...form, experience: 'Hồ sơ đã bổ sung' }, trainee);
  assert.equal((await api('reviewVolunteerApplication', review, admin)).status, 400);
  await ok(
    'reviewVolunteerApplication',
    { ...review, applicationRevision: b.applicationRevision },
    admin,
  );
  const approved = (await db.doc(`volunteers/${trainee.localId}`).get()).data();
  assert.equal(approved.verificationPolicyVersion, 3);
  assert.deepEqual(approved.verifiedSpecialties, ['basic_aid', 'cpr']);
  assert.equal(approved.isAvailable, false);
  assert.equal((await direct(`volunteerApplications/${trainee.localId}`, intruder)).status, 403);
  await ok(
    'updateVolunteerRegion',
    {
      uid: trainee.localId,
      serviceArea: 'Khu An Bình',
      specialties: ['cpr'],
      skillsConfirmed: true,
      skillEvidence: 'Căn cứ cập nhật kỹ năng trong fixture local',
    },
    admin,
  );
  assert.deepEqual(
    (await db.doc('volunteers/' + trainee.localId).get()).data().verifiedSpecialties,
    ['cpr'],
  );
  assert.equal(
    (
      await api(
        'updateVolunteerRegion',
        { uid: trainee.localId, serviceArea: 'Khu An Bình', specialties: ['trauma'] },
        admin,
      )
    ).status,
    400,
  );
  checks.push(
    'admin-only direct review without referrer',
    'complete evidence required',
    'self-approval/skill injection denied',
    'stale revision rejected',
  );
  const location = { latitude: 37.2, longitude: 114.5 };
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
  const cardId = (await ok('issuePatientCard', { shareProfile: true, shareHistory: true }, patient))
    .cardId;
  await ok('updatePatientCardConsent', { shareProfile: false }, patient);
  assert.equal((await db.doc(`cards/${cardId}`).get()).data().shareProfile, false);
  assert.equal((await db.doc(`patientCards/${patient.localId}`).get()).data().shareProfile, false);
  assert.equal((await api('updatePatientCardConsent', { shareProfile: true, uid: patient.localId }, intruder)).status, 400);
  assert.equal((await api('updatePatientCardConsent', { shareProfile: true }, intruder)).status, 404);
  await ok('updatePatientCardConsent', { shareProfile: true }, patient);
  checks.push('card sharing toggles atomically for owner only');
  const nearby = await Promise.all(Array.from({ length: 5 }, (_, i) => actor('nearby' + i)));
  for (let i = 0; i < nearby.length; i++)
    await volunteer(
      nearby[i],
      { latitude: location.latitude + 0.0001 * (i + 1), longitude: location.longitude },
      { verifiedSpecialties: ['basic_aid'] },
    );
  await volunteer(
    specialist,
    { latitude: location.latitude + 0.007, longitude: location.longitude },
    { verifiedSpecialties: ['cpr'] },
  );
  const payload = {
    cardId,
    requestId: randomUUID(),
    location,
    locationSource: 'patient_pin',
    patientAddress: 'Cổng chính, tầng trệt, khu An Bình',
    destinationConfirmed: true,
  };
  assert.equal(
    (await api('createIncident', { ...payload, destinationConfirmed: false }, reporter)).status,
    400,
  );
  const created = await ok('createIncident', payload, reporter),
    incidentId = created.incidentId;
  assert.equal(created.invitedCount, 5);
  assert(
    !(await db.doc(`incidents/${incidentId}`).get())
      .data()
      .invitedVolunteerIds.includes(specialist.localId),
  );
  const retry = await ok('createIncident', payload, reporter);
  assert.equal(retry.incidentId, incidentId);
  assert.equal((await api('updatePatientCardConsent', { shareProfile: false }, patient)).status, 400);
  assert.equal((await api('declineIncident', { incidentId }, intruder)).status, 403);
  await ok('declineIncident', { incidentId }, nearby[0]);
  await ok('declineIncident', { incidentId }, nearby[0]);
  assert.equal((await api('acceptIncident', { incidentId }, nearby[0])).status, 400);
  await ok(
    'submitBystanderReport',
    {
      incidentId,
      submissionId: randomUUID(),
      answers: {
        responsiveness: 'unresponsive',
        breathing: 'abnormal',
        breathingDetail: 'not_seen',
        bleeding: 'unknown',
      },
    },
    reporter,
  );
  const dispatched = (await db.doc(`incidents/${incidentId}`).get()).data();
  assert(dispatched.invitedVolunteerIds.includes(specialist.localId));
  assert.equal(dispatched.invitedVolunteerIds.length, 6);
  assert.equal((await db.doc(`volunteers/${nearby[0].localId}/alerts/${incidentId}`).get()).data().status, 'declined');
  checks.push('active-case sharing change denied', 'invitation decline idempotent and not revived by updates', 'declined invitation cannot be accepted');
  checks.push(
    'remote pin confirmation required',
    'idempotent remote request',
    'nearest fallback first',
    'verified specialist invited after observations',
  );
  assert.equal((await api('getVolunteerIncidentDetails', { incidentId }, specialist)).status, 403);
  await ok('acceptIncident', { incidentId }, specialist);
  assert.equal((await api('declineIncident', { incidentId }, specialist)).status, 400);
  checks.push('decline cannot abandon an assigned incident');
  const details = await ok('getVolunteerIncidentDetails', { incidentId }, specialist);
  assert.equal(details.destination.source, 'patient_pin');
  assert.equal(details.destination.address, payload.patientAddress);
  assert.deepEqual(details.location, location);
  assert.equal((await api('acceptIncident', { incidentId }, nearby[0])).status, 400);
  await ok(
    'updateIncidentLocation',
    {
      incidentId,
      updateId: randomUUID(),
      location: { latitude: 37.201, longitude: 114.501 },
      locationSource: 'patient_pin',
      patientAddress: 'Cổng B, tầng trệt, khu An Bình',
      destinationConfirmed: true,
    },
    reporter,
  );
  assert.equal(
    (await ok('getVolunteerIncidentDetails', { incidentId }, specialist)).destination.address,
    'Cổng B, tầng trệt, khu An Bình',
  );
  const activeHistory = await ok('getCaseHistory', { role: 'volunteer' }, specialist);
  assert.equal(activeHistory.cases[0].clinicalSummary, null);
  await ok('finishIncident', { incidentId, outcome: 'completed' }, specialist);
  await Promise.all(
    Array.from({ length: 35 }, (_, i) =>
      db
        .doc('volunteers/' + specialist.localId + '/alerts/never-assigned-' + i)
        .set({ createdAt: Timestamp.now(), status: 'closed' }),
    ),
  );
  const history = await ok('getCaseHistory', { role: 'volunteer' }, specialist);
  const row = history.cases.find((x) => x.incidentId === incidentId);
  assert.deepEqual(row.clinicalSummary.medicalConditions, ['Hen phế quản']);
  assert.equal(row.clinicalSummary.answers.responsiveness, 'unresponsive');
  assert.equal(JSON.stringify(row).includes('patientAddress'), false);
  assert.equal(JSON.stringify(row).includes('latitude'), false);
  assert.equal(JSON.stringify(row).includes('phone'), false);
  const bystander = await ok('getCaseHistory', { role: 'volunteer' }, nearby[0]);
  assert(!bystander.cases.some((x) => x.incidentId === incidentId));
  assert.equal(
    (await api('getCaseHistory', { role: 'patient', uid: patient.localId }, intruder)).status,
    400,
  );
  await ok(
    'savePatientProfile',
    {
      fullName: 'Nguyễn Minh An',
      medicalConditions: ['Tăng huyết áp'],
      allergies: [],
      emergencyContactPhone: '',
    },
    patient,
  );
  assert.deepEqual(
    (await ok('getCaseHistory', { role: 'patient' }, patient)).cases.find(
      (x) => x.incidentId === incidentId,
    ).clinicalSummary.medicalConditions,
    ['Hen phế quản'],
  );
  await db
    .doc(`incidents/${incidentId}`)
    .update({
      closedAt: Timestamp.fromMillis(Date.now() - 31 * 86400000),
      historyPurgeAfter: Timestamp.fromMillis(Date.now() - 1),
    });
  assert.equal(
    (await ok('getCaseHistory', { role: 'volunteer' }, specialist)).cases.find(
      (x) => x.incidentId === incidentId,
    ).clinicalSummary,
    null,
  );
  await ok('runMaintenanceNow', {}, admin);
  assert.equal((await db.doc(`incidents/${incidentId}/private/history`).get()).exists, false);
  checks.push(
    'private destination assigned-only',
    'one assignee wins',
    'remote destination update after acceptance',
    'admin can verify skills for previously approved accounts',
    'history survives 35 newer invitations',
    'history only actual participants',
    'immutable at-incident profile snapshot',
    'no contact/coordinates in history',
    '30-day access cutoff before cleanup',
    'expired snapshot physically deleted',
  );
  await auth.setCustomUserClaims(admin.localId, {});
  assert.equal((await api('listVolunteerApplications', {}, admin)).status, 403);
  checks.push('revoked admin blocked with stale token');
  const result = {
    status: 'PASS',
    environment:
      'LOCAL EMULATOR; synthetic profiles and controlled locations, not real GPS/native acceptance',
    startedAt,
    endedAt: new Date().toISOString(),
    checks,
  };
  mkdirSync('.local', { recursive: true });
  writeFileSync('.local/product-update-20261118.json', JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
  await db.terminate();
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
