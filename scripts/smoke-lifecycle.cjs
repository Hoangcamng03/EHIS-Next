const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { createRequire } = require('node:module');
const path = require('node:path');
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8180';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9199';
const requireFunctions = createRequire(path.resolve(__dirname, '../backend/package.json'));
const { initializeApp } = requireFunctions('firebase-admin/app');
const { getAuth } = requireFunctions('firebase-admin/auth');
const { getFirestore } = requireFunctions('firebase-admin/firestore');
initializeApp({ projectId: 'demo-ehis-next' });
const db = getFirestore(), authBase = 'http://127.0.0.1:9199/identitytoolkit.googleapis.com/v1';
const apiBase = 'http://127.0.0.1:5101/demo-ehis-next/asia-southeast1';
const docsBase = 'http://127.0.0.1:8180/v1/projects/demo-ehis-next/databases/(default)/documents';
async function account(label, anonymous = false) {
  const email = `lifecycle-${label}-${randomUUID()}@example.test`, password = 'Synthetic-trial-only-4291!';
  const response = await fetch(`${authBase}/accounts:signUp?key=demo-key`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(anonymous ? { returnSecureToken: true } : { email, password, returnSecureToken: true }) });
  assert.equal(response.status, 200); return { ...await response.json(), email, password };
}
async function call(name, data, user) {
  const response = await fetch(`${apiBase}/${name}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(user ? { Authorization: `Bearer ${user.idToken}` } : {}) }, body: JSON.stringify({ data }) });
  return { status: response.status, body: await response.json() };
}
async function allowed(name, data, user) { const response = await call(name, data, user); assert.equal(response.status, 200, `${name}: ${JSON.stringify(response.body)}`); return response.body.result; }
async function read(relative, user, method = 'GET', body) {
  return fetch(`${docsBase}/${relative}`, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.idToken}` }, body: body && JSON.stringify(body) });
}
async function main() {
  const [patient, volunteer, other, reporter, admin] = await Promise.all([account('patient'), account('volunteer'), account('other'), account('reporter', true), account('admin')]);
  await getAuth().setCustomUserClaims(admin.localId, { admin: true });
  Object.assign(admin, await (await fetch(`${authBase}/accounts:signInWithPassword?key=demo-key`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: admin.email, password: admin.password, returnSecureToken: true }) })).json());
  assert.equal((await call('issuePatientCard', { shareProfile: true }, reporter)).status, 401);
  assert.equal((await call('issuePatientCard', { shareProfile: true }, patient)).status, 400);
  await allowed('savePatientProfile', { fullName: 'Synthetic Patient Lifecycle', allergies: ['Synthetic allergy'], emergencyContactPhone: '0900000000' }, patient);
  assert.equal((await call('issuePatientCard', { shareProfile: true, patientId: other.localId }, patient)).status, 400);
  const cards = await Promise.all([allowed('issuePatientCard', { shareProfile: true }, patient), allowed('issuePatientCard', { shareProfile: true }, patient)]);
  assert.equal(cards[0].cardId, cards[1].cardId); const cardId = cards[0].cardId;
  assert.equal((await read(`patientCards/${patient.localId}`, patient)).status, 200);
  assert.equal((await read(`patientCards/${patient.localId}`, other)).status, 403);
  assert.equal((await read(`cards/${cardId}`, reporter)).status, 403);
  assert.equal((await read(`patientCards/${patient.localId}`, patient, 'PATCH', { fields: { active: { booleanValue: false } } })).status, 403);
  assert.equal((await call('revokePatientCard', { cardId }, other)).status, 403);
  assert.equal((await call('applyVolunteer', { fullName: 'Injected', phone: '0900000000', experience: 'Trial', verificationStatus: 'approved' }, volunteer)).status, 400);
  const application = { fullName: 'Synthetic Volunteer', phone: '0900000000', experience: 'Synthetic first-aid course for local testing only' };
  for (const person of [volunteer, patient]) await allowed('applyVolunteer', application, person);
  assert.equal((await call('setVolunteerAvailability', { available: true, location: { latitude: 10.7769, longitude: 106.7009 } }, volunteer)).status, 403);
  assert.equal((await call('reviewVolunteerApplication', { uid: volunteer.localId, decision: 'approved' }, volunteer)).status, 403);
  assert.equal((await call('listVolunteerApplications', {}, other)).status, 403);
  assert.equal((await read(`volunteerApplications/${volunteer.localId}`, other)).status, 403);
  const pending = await allowed('listVolunteerApplications', {}, admin); assert(pending.applications.some(item => item.uid === volunteer.localId));
  for (const person of [volunteer, patient]) await allowed('reviewVolunteerApplication', { uid: person.localId, decision: 'approved' }, admin);
  for (const person of [volunteer, patient]) await allowed('setVolunteerAvailability', { available: true, location: { latitude: 10.7769, longitude: 106.7009 } }, person);
  const request = { cardId, requestId: randomUUID(), location: { latitude: 10.779, longitude: 106.699 } };
  const created = await allowed('createIncident', request, reporter), id = created.incidentId;
  const incident = (await db.doc(`incidents/${id}`).get()).data();
  assert(!incident.invitedVolunteerIds.includes(patient.localId), 'Patient cannot be dispatched to their own incident');
  assert(incident.invitedVolunteerIds.includes(volunteer.localId));
  assert.equal((await call('getVolunteerIncidentDetails', { incidentId: id }, volunteer)).status, 403);
  assert.equal((await call('revokePatientCard', { cardId }, patient)).status, 400);
  assert.equal((await read(`patients/${patient.localId}/incidentStatuses/${id}`, patient)).status, 200);
  assert.equal((await read(`patients/${patient.localId}/incidentStatuses/${id}`, other)).status, 403);
  await allowed('submitBystanderReport', { incidentId: id, submissionId: randomUUID(), answers: { responsiveness: 'unknown', breathing: 'unknown', bleeding: 'unknown' } }, reporter);
  await allowed('acceptIncident', { incidentId: id }, volunteer);
  const details = await allowed('getVolunteerIncidentDetails', { incidentId: id }, volunteer);
  assert.equal(details.phone, null); assert.equal(details.patientProfile.fullName, 'Synthetic Patient Lifecycle');
  assert.deepEqual(details.patientProfile.allergies, ['Synthetic allergy']);
  assert.equal((await call('cancelPatientIncident', { incidentId: id }, patient)).status, 400);
  assert.equal((await call('markIncidentArrived', { incidentId: id }, other)).status, 403);
  await allowed('markIncidentArrived', { incidentId: id }, volunteer);
  await allowed('markIncidentArrived', { incidentId: id }, volunteer);
  assert.equal((await db.doc(`patients/${patient.localId}/incidentStatuses/${id}`).get()).data().status, 'arrived');
  await allowed('finishIncident', { incidentId: id, outcome: 'completed' }, volunteer);
  assert.equal((await call('getVolunteerIncidentDetails', { incidentId: id }, volunteer)).status, 403);
  await allowed('revokePatientCard', { cardId }, patient);
  assert.equal((await call('createIncident', { ...request, requestId: randomUUID() }, reporter)).status, 404);
  const privateCard = await allowed('issuePatientCard', { shareProfile: false }, patient); assert.notEqual(privateCard.cardId, cardId);
  await allowed('setVolunteerAvailability', { available: true, location: request.location }, volunteer);
  const second = await allowed('createIncident', { ...request, cardId: privateCard.cardId, requestId: randomUUID() }, reporter);
  await allowed('acceptIncident', { incidentId: second.incidentId }, volunteer);
  assert.equal((await allowed('getVolunteerIncidentDetails', { incidentId: second.incidentId }, volunteer)).patientProfile, null);
  await allowed('finishIncident', { incidentId: second.incidentId, outcome: 'completed' }, volunteer);
  const third = await allowed('createIncident', { ...request, cardId: privateCard.cardId, requestId: randomUUID() }, reporter);
  assert.equal((await call('cancelPatientIncident', { incidentId: third.incidentId }, other)).status, 403);
  await allowed('cancelPatientIncident', { incidentId: third.incidentId }, patient);
  await allowed('cancelPatientIncident', { incidentId: third.incidentId }, patient);
  assert.equal((await db.doc(`cards/${privateCard.cardId}`).get()).data().activeIncidentId, null);
  await allowed('setVolunteerAvailability', { available: false }, patient);
  await allowed('revokePatientCard', { cardId: privateCard.cardId }, patient);
  console.log('PASS lifecycle: registered Patient profile, concurrent idempotent card issue, QR revocation/reissue, sharing consent, role-injection denial, admin-only volunteer approval, no self-dispatch, owner history, arrived, completion, private-access expiry and Patient cancellation.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
