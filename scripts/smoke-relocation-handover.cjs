// Real local API/transactions with fictional people and controlled coordinates.
const {
  assert,
  actor,
  db,
  api,
  ok,
  card,
  volunteer,
  randomUUID,
  auth,
} = require('./test-support/emulator.cjs');
(async () => {
  const startedAt = new Date().toISOString(),
    checks = [];
  const [owner, oldPeer, newPeer, patient, reporter, admin] = await Promise.all(
    ['owner', 'old', 'new', 'patient', 'reporter', 'admin'].map((x) => actor('relocation-' + x)),
  );
  const a = { latitude: -18.3, longitude: -64.1 },
    b = { latitude: -18.1, longitude: -64.1 };
  await volunteer(owner, a);
  await volunteer(oldPeer, a);
  await volunteer(newPeer, b);
  const incidentId = (
    await ok(
      'createIncident',
      { cardId: await card(patient), requestId: randomUUID(), location: a },
      reporter,
    )
  ).incidentId;
  await ok('acceptIncident', { incidentId }, owner);
  const epoch = (await ok('getVolunteerIncidentDetails', { incidentId }, owner)).assignmentAtMs;
  const firstId = randomUUID();
  await ok(
    'updateIncidentProgress',
    {
      incidentId,
      assignmentAtMs: epoch,
      updateId: randomUUID(),
      action: 'going',
      etaMinutes: 5,
      expectedProgressRevision: 0,
    },
    owner,
  );
  await ok(
    'updateIncidentProgress',
    {
      incidentId,
      assignmentAtMs: epoch,
      updateId: firstId,
      action: 'blocked',
      obstacle: 'cannot_continue',
      expectedProgressRevision: 1,
    },
    owner,
  );
  const before = (await db.doc('incidents/' + incidentId).get()).data();
  assert.deepEqual(before.handover.targetUids, [oldPeer.localId]);
  const update = { incidentId, updateId: randomUUID(), location: b };
  await ok('updateIncidentLocation', update, reporter);
  const after = (await db.doc('incidents/' + incidentId).get()).data();
  assert.notEqual(after.handover.id, firstId, 'Old-location handover must be replaced');
  assert.deepEqual(after.handover.targetUids, [newPeer.localId]);
  assert.equal(after.acceptedBy, owner.localId);
  assert.equal(after.status, 'accepted');
  assert.equal(after.travelProgress.etaAtMs, null);
  assert.equal(after.travelProgress.firstEtaAtMs, null);
  assert.equal(
    (await db.doc(`incidents/${incidentId}/handoverRequests/${firstId}`).get()).data().status,
    'replaced',
  );
  assert.equal(
    (await db.doc(`volunteers/${oldPeer.localId}/alerts/${incidentId}`).get()).data().status,
    'closed',
  );
  assert.equal(
    (await api('acceptIncidentHandover', { incidentId, handoverId: firstId }, oldPeer)).status,
    400,
  );
  checks.push(
    'destination change replaces automatic proposal and closes old invitation',
    'assignment preserved until a new volunteer accepts',
  );
  const newAlert = (
    await db.doc(`volunteers/${newPeer.localId}/alerts/${incidentId}`).get()
  ).data();
  assert.equal(newAlert.locationRevision, 1);
  assert.equal(newAlert.reportRevision, 1);
  assert(newAlert.distanceMeters <= 10);
  assert.equal((await api('getVolunteerIncidentDetails', { incidentId }, newPeer)).status, 403);
  const requestsBefore = (await db.collection(`incidents/${incidentId}/handoverRequests`).get())
    .size;
  await ok('updateIncidentLocation', update, reporter);
  assert.equal(
    (await db.collection(`incidents/${incidentId}/handoverRequests`).get()).size,
    requestsBefore,
  );
  await ok('acceptIncidentHandover', { incidentId, handoverId: after.handover.id }, newPeer);
  assert.deepEqual((await ok('getVolunteerIncidentDetails', { incidentId }, newPeer)).location, b);
  await ok('finishIncident', { incidentId, outcome: 'completed' }, newPeer);
  checks.push(
    'new invitation has revised location and distance; private data still assignment-only',
    'lost acknowledgement cannot create a second proposal',
  );
  await auth.setCustomUserClaims(admin.localId, { admin: true });
  const login = await fetch(
    'http://127.0.0.1:9199/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-key',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: admin.email,
        password: admin.password,
        returnSecureToken: true,
      }),
    },
  );
  assert.equal(login.status, 200);
  Object.assign(admin, await login.json());
  await ok('setVolunteerAvailability', { available: true, location: a }, owner);
  const p2 = await actor('relocation-manual-patient'),
    second = (
      await ok(
        'createIncident',
        { cardId: await card(p2), requestId: randomUUID(), location: a },
        reporter,
      )
    ).incidentId;
  await ok('acceptIncident', { incidentId: second }, owner);
  const manual = randomUUID();
  await ok(
    'proposeIncidentHandover',
    {
      incidentId: second,
      targetUid: oldPeer.localId,
      requestId: manual,
      reason: 'Xác nhận đổi người phụ trách sau liên hệ đơn vị.',
    },
    admin,
  );
  await ok(
    'updateIncidentLocation',
    { incidentId: second, updateId: randomUUID(), location: b },
    reporter,
  );
  const stopped = (await db.doc('incidents/' + second).get()).data();
  assert(!stopped.handover);
  assert.equal(stopped.acceptedBy, owner.localId);
  assert.equal(
    (await db.doc(`incidents/${second}/handoverRequests/${manual}`).get()).data().status,
    'replaced',
  );
  assert.equal(
    (await api('acceptIncidentHandover', { incidentId: second, handoverId: manual }, oldPeer))
      .status,
    400,
  );
  assert.equal(
    (await db.doc(`reporters/${reporter.localId}/incidentStatuses/${second}`).get()).data()
      .handoverPending,
    false,
  );
  assert.equal(
    (await db.doc(`patients/${p2.localId}/incidentStatuses/${second}`).get()).data()
      .handoverPending,
    false,
  );
  await ok('markIncidentArrived', { incidentId: second, expectedLocationRevision: 1 }, owner);
  await ok(
    'updateIncidentLocation',
    { incidentId: second, updateId: randomUUID(), location: a },
    reporter,
  );
  assert.equal((await db.doc('incidents/' + second).get()).data().status, 'accepted');
  assert.equal(
    (await db.doc(`volunteers/${owner.localId}/alerts/${second}`).get()).data().status,
    'accepted',
  );
  assert.equal(
    (await api('markIncidentArrived', { incidentId: second, expectedLocationRevision: 1 }, owner))
      .status,
    400,
  );
  await ok('markIncidentArrived', { incidentId: second, expectedLocationRevision: 2 }, owner);
  checks.push(
    'arrival at old destination does not imply arrival at new point; stale confirmation is refused',
  );
  const gps = {
    incidentId: second,
    updateId: randomUUID(),
    location: b,
    locationSource: 'reporter_gps',
    locationFix: { accuracyMeters: 12, capturedAtMs: Date.now() - 20000 },
  };
  assert.equal((await api('updateIncidentLocation', gps, reporter)).status, 400);
  assert.equal((await db.doc('incidents/' + second).get()).data().locationRevision, 2);
  assert.equal(
    (
      await api(
        'updateIncidentLocation',
        {
          ...gps,
          updateId: randomUUID(),
          locationFix: { accuracyMeters: 31, capturedAtMs: Date.now() },
        },
        reporter,
      )
    ).status,
    400,
  );
  gps.updateId = randomUUID();
  gps.locationFix.capturedAtMs = Date.now();
  const fresh = await ok('updateIncidentLocation', gps, reporter);
  // Real elapsed time, not a simulated performance sample. The retry may recover
  // an existing event after the GPS window; it must never create a stale write.
  await new Promise((resolve) => setTimeout(resolve, 11000));
  assert.deepEqual(await ok('updateIncidentLocation', gps, reporter), fresh);
  assert.equal((await db.doc('incidents/' + second).get()).data().locationRevision, 3);
  checks.push(
    'new stale or coarse GPS is refused; an actual 11-second lost-ack retry reads the existing event',
  );
  await ok('finishIncident', { incidentId: second, outcome: 'completed' }, owner);
  checks.push(
    'manual proposal invalidated after destination change, with owner retained and both projections cleared',
  );
  require('fs').writeFileSync(
    '.local/uat-20261124-relocation.json',
    JSON.stringify(
      {
        status: 'PASS',
        startedAt,
        endedAt: new Date().toISOString(),
        environment: 'LOCAL EMULATOR ONLY; fictional accounts/coordinates',
        checks,
      },
      null,
      2,
    ),
  );
  console.log(
    'PASS relocation/handover: ' + checks.length + ' invariants checked through real local API.',
  );
  await db.terminate();
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
