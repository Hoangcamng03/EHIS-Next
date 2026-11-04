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
  const fresh = await actor('push-recovery'), point2={latitude:-55,longitude:60};await volunteer(fresh,point2);
  const p2=await actor('push-recovery-p'),r2=await actor('push-recovery-r',true),card2=await card(p2);
  const c2=await ok('createIncident',{cardId:card2,requestId:randomUUID(),location:point2},r2);
  const oldJobs=await db.collection('pushJobs').where('incidentId','==',c2.incidentId).get();for(const job of oldJobs.docs)await job.ref.update({status:'no-device'});
  const recovered=await ok('registerVolunteerDevice',{token:'synthetic-recovery-device-token-1',enabled:true},fresh);assert.equal(recovered.recoveryQueued,1);
  assert.equal((await ok('registerVolunteerDevice',{token:'synthetic-recovery-device-token-1',enabled:true},fresh)).recoveryQueued,0,'Repeated setup must not replay a pending/sent job');
  const all=await db.collection('pushJobs').where('incidentId','==',c2.incidentId).get();assert.equal(all.size,2);assert.equal(all.docs.filter(d=>d.data().deviceKey).length,1);
  await ok('registerVolunteerDevice',{token:'synthetic-recovery-device-token-2',replaceToken:'synthetic-recovery-device-token-1',enabled:true},fresh);
  const devices=(await db.doc('pushDevices/'+fresh.localId).get()).data().devices;assert.equal(devices.length,1);assert.equal(devices[0].token,'synthetic-recovery-device-token-2');
  assert.equal((await api('registerVolunteerDevice',{token:'synthetic-foreign-replacement-token',replaceToken:'synthetic-recovery-device-token-2',enabled:true},v)).status,403);
  await ok('setVolunteerAvailability',{available:false},fresh);
  assert.equal((await ok('registerVolunteerDevice',{token:'synthetic-recovery-device-token-3',enabled:true},fresh)).recoveryQueued,0,'OFF volunteer gets no recovery offer');
  console.log('PASS recovery: real outbox after late registration, no duplicate setup replay, atomic token replacement, cross-owner rejection, no recovery while OFF. No phone delivery simulated.');
  console.log('PASS push contract: committed outbox, duplicate receipts preserved, late ON enqueued, observation/location jobs private, three-device limit. Real FCM/phone delivery remains NOT TESTED.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
