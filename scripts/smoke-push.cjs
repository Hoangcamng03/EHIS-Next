// Exercises real outbox writes and API authorization; does NOT simulate FCM/device success.
const { assert, actor, db, api, ok, card, volunteer, randomUUID, req } = require('./test-support/emulator.cjs');
async function main() {
  const [v, late, patient, reporter] = await Promise.all([actor('push-v'), actor('push-late'), actor('push-p'), actor('push-r', true)]), point = { latitude: -35, longitude: -130 };
  await volunteer(v, point); await volunteer(late, point, { isAvailable: false });
  const cardId = await card(patient), payload = { cardId, requestId: randomUUID(), location: point };
  const incident = await ok('createIncident', payload, reporter), jobs = () => db.collection('pushJobs').where('incidentId', '==', incident.incidentId).get();
  let queue = await jobs(); assert.equal(queue.size, 1); assert.equal(queue.docs[0].data().uid, v.localId);
  await queue.docs[0].ref.update({ attempts: 2 }); await ok('createIncident', payload, reporter); queue = await jobs(); assert.equal(queue.size, 1); assert.equal(queue.docs[0].data().attempts, 2);
  await ok('setVolunteerAvailability', { available: true, location: point }, late); queue = await jobs(); assert.equal(queue.size, 2);
  await ok('setVolunteerAvailability', { available: true, location: point }, late); assert.equal((await jobs()).size, 2);
  const report = { incidentId: incident.incidentId, submissionId: randomUUID(), phone: '0900000000', answers: { responsiveness: 'unknown', breathing: 'unknown', bleeding: 'unknown' } };
  await ok('submitBystanderReport', report, reporter); await ok('submitBystanderReport', report, reporter); assert.equal((await jobs()).size, 4);
  await ok('acceptIncident', { incidentId: incident.incidentId }, v);
  await ok('updateIncidentLocation', { incidentId: incident.incidentId, updateId: randomUUID(), location: { latitude: -35.001, longitude: -130 } }, reporter);
  queue = await jobs(); assert.equal(queue.size, 5);
  for (const item of queue.docs) { const text = JSON.stringify(item.data()); for (const prohibited of ['0900000000', 'responsiveness', 'allergies', 'latitude', 'Synthetic Patient']) assert(!text.includes(prohibited)); }
  for (let i = 0; i < 3; i++) await ok('registerVolunteerDevice', { token: `synthetic-push-device-token-${i}`, enabled: true }, v);
  assert.equal((await api('registerVolunteerDevice', { token: 'synthetic-push-device-token-4', enabled: true }, v)).status, 429);
  await ok('registerVolunteerDevice', { token: 'synthetic-push-device-token-0', enabled: true }, v); assert.equal((await db.doc(`pushDevices/${v.localId}`).get()).data().devices.length, 3);
  assert.deepEqual(await req('./lib/pushJobs').flushPushJobs(), { skipped: true }, 'Emulator must not send real FCM');
  await ok('finishIncident', { incidentId: incident.incidentId, outcome: 'completed' }, v); await ok('setVolunteerAvailability', { available: false }, late);
  console.log('PASS push contract: committed outbox, duplicate receipts preserved, late ON enqueued, observation/location jobs private, three-device limit. Real FCM/phone delivery remains NOT TESTED.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
