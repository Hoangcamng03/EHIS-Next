const { db, actor, card, ok, api, assert, randomUUID } = require('./test-support/emulator.cjs');
(async () => {
  const p = await actor('card-budget'),
    cardId = await card(p),
    point = { latitude: 10.7, longitude: 106.7 };
  for (let i = 0; i < 6; i++) {
    const reporter = await actor('rotate-' + i, true),
      request = { cardId, requestId: randomUUID(), location: point };
    const created = await ok('createIncident', request, reporter);
    assert.equal((await ok('createIncident', request, reporter)).incidentId, created.incidentId);
    await ok('cancelPatientIncident', { incidentId: created.incidentId }, p);
  }
  const seventh = await api(
    'createIncident',
    { cardId, requestId: randomUUID(), location: point },
    await actor('rotate-7', true),
  );
  assert.equal(seventh.status, 429);
  assert.equal(seventh.error.details.reason, 'card-request-budget');
  assert.equal((await db.doc('cards/' + cardId).get()).data().recentRequestTimesMs.length, 6);
  console.log(
    'PASS: six distinct reporters + idempotent retries, seventh new reporter denied429 by same-card rolling budget.',
  );
  await db.terminate();
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
