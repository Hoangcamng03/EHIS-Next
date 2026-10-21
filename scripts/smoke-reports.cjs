const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { createRequire } = require('node:module');
const path = require('node:path');
const webRequire = createRequire(path.resolve(__dirname, '../web/package.json'));
const { initializeApp: clientApp, deleteApp } = webRequire('firebase/app');
const { getAuth, connectAuthEmulator, signInWithEmailAndPassword } = webRequire('firebase/auth');
const { getFirestore: clientDb, connectFirestoreEmulator, onSnapshot, collection, query, orderBy, limit } = webRequire('firebase/firestore');
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8180';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9199';
const functionsRequire = createRequire(path.resolve(__dirname, '../functions/package.json'));
const { initializeApp } = functionsRequire('firebase-admin/app');
const { getFirestore, Timestamp } = functionsRequire('firebase-admin/firestore');
initializeApp({ projectId: 'demo-ehis-next' });
const db = getFirestore();
const authBase = 'http://127.0.0.1:9199/identitytoolkit.googleapis.com/v1';
const functionsBase = 'http://127.0.0.1:5101/demo-ehis-next/asia-southeast1';
const documentsBase = 'http://127.0.0.1:8180/v1/projects/demo-ehis-next/databases/(default)/documents';
const password = 'Synthetic-local-only-4291!';
async function signup(label, anonymous = false) {
  const email = `${label}-${randomUUID()}@example.test`;
  const response = await fetch(`${authBase}/accounts:signUp?key=demo-key`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(anonymous ? { returnSecureToken: true } : { email, password, returnSecureToken: true }),
  });
  assert.equal(response.status, 200); return { ...await response.json(), email };
}
async function call(name, data, user) {
  const response = await fetch(`${functionsBase}/${name}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...(user ? { Authorization: `Bearer ${user.idToken}` } : {}) },
    body: JSON.stringify({ data }), signal: AbortSignal.timeout(20000),
  });
  return { status: response.status, body: await response.json() };
}
async function read(document, user) {
  return fetch(`${documentsBase}/${document}`, { headers: user ? { Authorization: `Bearer ${user.idToken}` } : {} });
}
async function main() {
  const reporter = await signup('reporter', true), other = await signup('other', true);
  const first = await signup('volunteer1'), second = await signup('volunteer2'), outsider = await signup('outsider');
  const patientId = randomUUID(), cardId = randomUUID();
  // Keep automated fixtures far from the interactive trial's 10.875/106.8 location.
  const location = { latitude: -45, longitude: -120 };
  await db.doc(`patients/${patientId}`).set({ fullName: 'Synthetic Patient — no real records' });
  await db.doc(`cards/${cardId}`).set({ patientId, active: true });
  for (const volunteer of [first, second]) await db.doc(`volunteers/${volunteer.localId}`).set({ verificationStatus: 'approved', isAvailable: true, location, lastSeenAt: Timestamp.now() });
  await db.doc(`volunteers/${outsider.localId}`).set({ verificationStatus: 'approved', isAvailable: true, location: { latitude: 0, longitude: 0 }, lastSeenAt: Timestamp.now() });
  const request = { cardId, requestId: randomUUID(), location };
  assert.equal((await call('setVolunteerAvailability', { available: true, location })).status, 401);
  assert.equal((await call('setVolunteerAvailability', { available: true, location }, reporter)).status, 403);
  assert.equal((await call('setVolunteerAvailability', { available: true, location, verificationStatus: 'approved' }, first)).status, 400);
  assert.equal((await call('setVolunteerAvailability', { available: true, location: { latitude: 91, longitude: 0 } }, first)).status, 400);
  assert.equal((await call('setVolunteerAvailability', { available: false }, first)).status, 200);
  assert.equal((await db.doc(`volunteers/${first.localId}`).get()).data().isAvailable, false);
  assert.equal((await call('setVolunteerAvailability', { available: true, location }, first)).status, 200);
  assert.equal((await call('createIncident', request)).status, 401);
  assert.equal((await call('createIncident', { ...request, cardId: randomUUID() }, reporter)).status, 404);
  const created = await call('createIncident', request, reporter);
  assert.equal(created.status, 200, JSON.stringify(created.body));
  const { incidentId, invitedCount } = created.body.result;
  assert.equal(invitedCount, 2);
  const initial = (await db.doc(`incidents/${incidentId}`).get()).data();
  assert.equal(initial.status, 'dispatching'); assert.equal(initial.reportRevision, 0); assert.equal(initial.acceptedBy, null);
  assert.equal((await call('createIncident', request, reporter)).body.result.incidentId, incidentId);
  assert.equal((await call('createIncident', { ...request, requestId: randomUUID() }, other)).status, 409);
  assert.equal((await read(`reporters/${reporter.localId}/incidentStatuses/${incidentId}`, reporter)).status, 200);
  assert.equal((await read(`reporters/${reporter.localId}/incidentStatuses/${incidentId}`, other)).status, 403);
  assert.equal((await read(`incidents/${incidentId}`, reporter)).status, 403);
  assert.equal((await read(`volunteers/${first.localId}/alerts/${incidentId}`, first)).status, 200);
  assert.equal((await read(`volunteers/${first.localId}/alerts/${incidentId}`, second)).status, 403);
  assert.equal((await read(`volunteers/${first.localId}/alerts/${incidentId}`)).status, 403);
  for (const document of [`incidents/${incidentId}`, `cards/${cardId}`, `reporters/${reporter.localId}/incidentStatuses/${incidentId}`, `volunteers/${first.localId}/alerts/${incidentId}`]) {
    const user = document.startsWith('volunteers/') ? first : reporter;
    assert.equal((await fetch(`${documentsBase}/${document}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.idToken}` }, body: JSON.stringify({ fields: { status: { stringValue: 'accepted' } } }) })).status, 403);
    assert.equal((await fetch(`${documentsBase}/${document}`, { method: 'DELETE', headers: { Authorization: `Bearer ${user.idToken}` } })).status, 403);
  }
  assert.equal((await call('acceptIncident', { incidentId }, outsider)).status, 403);
  assert.equal((await call('getVolunteerIncidentDetails', { incidentId }, first)).status, 403);

  // Real Firebase client subscription: observe initial offer, then revision 1 on the same document.
  const app = clientApp({ projectId: 'demo-ehis-next', apiKey: 'demo-key', appId: 'demo-app' }, randomUUID());
  const auth = getAuth(app); connectAuthEmulator(auth, 'http://127.0.0.1:9199', { disableWarnings: true });
  const firestore = clientDb(app); connectFirestoreEmulator(firestore, '127.0.0.1', 8180);
  await signInWithEmailAndPassword(auth, first.email, password);
  const revisions = [];
  let listenerError;
  const unsubscribe = onSnapshot(query(collection(firestore, `volunteers/${first.localId}/alerts`), orderBy('createdAt', 'desc'), limit(30)), snapshot => {
    const alert = snapshot.docs.find(item => item.id === incidentId); if (alert) revisions.push(alert.data().reportRevision);
  }, error => { listenerError = error; });
  async function waitForRevision(revision) {
    const until = Date.now() + 10000;
    while (!revisions.includes(revision) && Date.now() < until && !listenerError) await new Promise(resolve => setTimeout(resolve, 50));
    assert.ifError(listenerError); assert.ok(revisions.includes(revision), `Realtime revision ${revision}: ${revisions}`);
  }
  try {
    await waitForRevision(0);
    const answers = { responsiveness: 'unknown', breathing: 'normal', bleeding: 'none_seen' };
    const report = { incidentId, submissionId: randomUUID(), answers };
    assert.equal((await call('submitBystanderReport', report, other)).status, 403);
    assert.equal((await call('submitBystanderReport', { ...report, answers: {} }, reporter)).status, 400);
    const result = await call('submitBystanderReport', report, reporter);
    assert.equal(result.status, 200, JSON.stringify(result.body)); assert.equal(result.body.result.revision, 1);
    await waitForRevision(1);
    assert.equal((await db.doc(`incidents/${incidentId}/private/reporter`).get()).data().phone, null);
    assert.equal((await call('submitBystanderReport', report, reporter)).body.result.revision, 1);
    assert.equal((await db.doc(`incidents/${incidentId}`).get()).data().reportRevision, 1);
    const withPhone = { ...report, submissionId: randomUUID(), phone: '090 000 0000' };
    assert.equal((await call('submitBystanderReport', withPhone, reporter)).body.result.revision, 2);
    const alertData = (await db.doc(`volunteers/${first.localId}/alerts/${incidentId}`).get()).data();
    assert.equal(alertData.reportRevision, 2); assert.ok(!('phone' in alertData)); assert.ok(!('location' in alertData));
    assert.equal((await read(`incidents/${incidentId}/private/reporter`, first)).status, 403);
    const race = await Promise.all([first, second].map(volunteer => call('acceptIncident', { incidentId }, volunteer)));
    assert.equal(race.filter(result => result.status === 200).length, 1, JSON.stringify(race));
    const winner = race[0].status === 200 ? first : second;
    const loser = winner === first ? second : first;
    assert.equal((await call('getVolunteerIncidentDetails', { incidentId }, winner)).body.result.phone, '0900000000');
    assert.equal((await call('getVolunteerIncidentDetails', { incidentId }, loser)).status, 403);
    assert.equal((await call('acceptIncident', { incidentId }, winner)).status, 200);
    assert.equal((await call('setVolunteerAvailability', { available: true, location }, winner)).body.error.status, 'FAILED_PRECONDITION');
    assert.equal((await call('submitBystanderReport', { ...withPhone, submissionId: randomUUID(), answers: { ...answers, responsiveness: 'responsive' } }, reporter)).body.result.revision, 3);
    assert.equal((await db.doc(`volunteers/${winner.localId}/alerts/${incidentId}`).get()).data().reportRevision, 3);
    assert.equal((await db.doc(`volunteers/${loser.localId}/alerts/${incidentId}`).get()).data().reportRevision, 2);
    assert.equal((await call('getVolunteerIncidentDetails', { incidentId }, winner)).body.result.revision, 3);
    assert.equal((await db.doc(`reporters/${reporter.localId}/incidentStatuses/${incidentId}`).get()).data().status, 'accepted');
    // Revocation must remove assigned-volunteer access too.
    await db.doc(`volunteers/${winner.localId}`).update({ verificationStatus: 'revoked' });
    assert.equal((await read(`volunteers/${winner.localId}/alerts/${incidentId}`, winner)).status, 403);
    assert.equal((await call('getVolunteerIncidentDetails', { incidentId }, winner)).status, 403);
    await db.doc(`volunteers/${winner.localId}`).update({ verificationStatus: 'approved' });
    assert.equal((await call('finishIncident', { incidentId, outcome: 'completed' }, reporter)).status, 403);
    assert.equal((await call('finishIncident', { incidentId, outcome: 'cancelled' }, reporter)).status, 403);
    assert.equal((await call('finishIncident', { incidentId, outcome: 'completed' }, loser)).status, 403);
    assert.equal((await call('finishIncident', { incidentId, outcome: 'completed' }, winner)).status, 200);
    assert.equal((await call('finishIncident', { incidentId, outcome: 'completed' }, winner)).status, 200);
    assert.equal((await db.doc(`cards/${cardId}`).get()).data().activeIncidentId, null);
    assert.equal((await db.doc(`volunteers/${winner.localId}`).get()).data().activeIncidentId, null);
    assert.equal((await call('getVolunteerIncidentDetails', { incidentId }, winner)).status, 403);
    assert.equal((await call('submitBystanderReport', { ...report, submissionId: randomUUID() }, reporter)).body.error.status, 'FAILED_PRECONDITION');
    const secondRequest = { ...request, requestId: randomUUID() };
    const next = await call('createIncident', secondRequest, reporter);
    assert.equal(next.status, 200); assert.notEqual(next.body.result.incidentId, incidentId);
    const nextId = next.body.result.incidentId;
    // Another tab of the same reporter can recover the active ca without knowing its requestId.
    const recoveredRequest = { ...request, requestId: randomUUID() };
    assert.equal((await call('createIncident', recoveredRequest, reporter)).body.result.incidentId, nextId);
    assert.equal((await call('finishIncident', { incidentId: nextId, outcome: 'cancelled' }, other)).status, 403);
    assert.equal((await call('finishIncident', { incidentId: nextId, outcome: 'cancelled' }, reporter)).status, 200);
    const retriedAfterClose = await call('createIncident', recoveredRequest, reporter);
    assert.equal(retriedAfterClose.body.result.incidentId, nextId);
    assert.equal(retriedAfterClose.body.result.status, 'cancelled');
    assert.equal((await call('finishIncident', { incidentId: nextId, outcome: 'cancelled' }, reporter)).status, 200);
    // Zero eligible volunteers is acknowledged honestly; an expired offer cannot lock a card forever.
    for (const person of [first, second]) await call('setVolunteerAvailability', { available: false }, person);
    const noVolunteers = await call('createIncident', { ...request, requestId: randomUUID() }, reporter);
    assert.equal(noVolunteers.status, 200); assert.equal(noVolunteers.body.result.invitedCount, 0);
    const expiredId = noVolunteers.body.result.incidentId;
    await db.doc(`incidents/${expiredId}`).update({ offerExpiresAt: Timestamp.fromMillis(Date.now() - 1000) });
    assert.equal((await call('submitBystanderReport', { ...report, incidentId: expiredId }, reporter)).body.error.status, 'FAILED_PRECONDITION');
    const recovered = await call('createIncident', { ...request, requestId: randomUUID() }, other);
    assert.equal(recovered.status, 200); assert.notEqual(recovered.body.result.incidentId, expiredId);
    assert.equal((await db.doc(`incidents/${expiredId}`).get()).data().status, 'expired');
    assert.equal((await db.doc(`reporters/${reporter.localId}/incidentStatuses/${expiredId}`).get()).data().status, 'expired');
    await call('finishIncident', { incidentId: recovered.body.result.incidentId, outcome: 'cancelled' }, other);
    await db.doc(`cards/${cardId}`).update({ active: false });
    assert.equal((await call('createIncident', { ...request, requestId: randomUUID() }, reporter)).status, 404);
    console.log('PASS reports: initial ack, optional phone, required answers, retry, realtime, private data, acceptance race, revocation, availability, completion/cancel authorization, card reuse, zero volunteers and expiry recovery.');
  } finally { unsubscribe(); await deleteApp(app); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
