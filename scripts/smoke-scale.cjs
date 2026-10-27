// Fixed synthetic workload in an isolated Emulator. Never targets cloud or maps.
const assert = require('node:assert/strict');
assert.equal(process.env.GCLOUD_PROJECT, 'demo-ehis-next');
assert.equal(process.env.FIRESTORE_EMULATOR_HOST, '127.0.0.1:8180');
assert.equal(process.env.FIREBASE_AUTH_EMULATOR_HOST, '127.0.0.1:9199');
const fs = require('node:fs');
const path = require('node:path'), net = require('node:net'), { spawn } = require('node:child_process');
const { createRequire } = require('node:module');
const webRequire = createRequire(path.resolve(__dirname, '../frontend/web/package.json'));
const appSdk = webRequire('firebase/app'), authSdk = webRequire('firebase/auth'), storeSdk = webRequire('firebase/firestore');
const portable = process.env.EHIS_SCALE_TRANSPORT !== 'functions';
if (portable) process.env.EHIS_TEST_HTTP_PORT = '5203';
const { randomUUID, db, auth, actor, api, ok, card, volunteer, batch, metrics, actors } = require('./test-support/emulator.cjs');
const prefix = 'scale-' + randomUUID(), startedAt = new Date().toISOString();
const zones = [], cases = [], stages = [];
const liveClients = [], deliveries = [];
fs.mkdirSync('.local', { recursive: true });
fs.writeFileSync('.local/scale-acceptance.json', JSON.stringify({ status: 'RUNNING', startedAt, stages }));
const percentile = (values, p) => [...values].sort((a, b) => a - b)[Math.ceil(values.length * p) - 1];
async function stage(name, work) {
  const started = performance.now();
  await work(); stages.push({ name, status: 'PASS', ms: Math.round(performance.now() - started) });
  console.log('PASS scale: ' + name);
}
async function until(condition, live) {
  const deadline = performance.now() + 15000;
  while (!condition()) {
    if (live?.error) throw live.error;
    assert.ok(performance.now() < deadline, 'Live volunteer snapshot timed out');
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}
async function main() {
  let backgroundAccounts = 0;
  let server, log;
  try {
    if (portable) {
      await new Promise((resolve, reject) => {
        const socket = net.connect({ host: '127.0.0.1', port: 5203 });
        socket.once('connect', () => { socket.destroy(); reject(Error('Port 5203 is in use; existing processes are never reused or stopped')); });
        socket.once('error', error => error.code === 'ECONNREFUSED' ? resolve() : reject(error));
      });
      fs.mkdirSync('.local', { recursive: true }); log = fs.openSync('.local/scale-http-server.log', 'w');
      server = spawn(process.execPath, ['server.cjs'], { cwd: path.resolve(__dirname, '../backend'), windowsHide: true,
        env: { ...process.env, PORT: '5203', FIREBASE_CONFIG: JSON.stringify({ projectId: 'demo-ehis-next' }), EHIS_SERVICE_ACCOUNT_JSON: '', VERCEL: '' },
        stdio: ['ignore', log, log] });
      server.on('error', error => { console.error('Scale server did not start: ' + error.message); });
      let ready = false;
      for (let i = 0; i < 80; i++) {
        try { const response = await fetch('http://127.0.0.1:5203/api/health', { signal: AbortSignal.timeout(1000) });
          if ((await response.json()).projectId === 'demo-ehis-next') { ready = true; break; }
        } catch { /* Wait for the owned local server only. */ }
        await new Promise(resolve => setTimeout(resolve, 250));
      }
      assert.ok(ready, 'Portable scale server readiness');
    }
    await stage('1000 Auth accounts; 8 zones; 32 patients/reporters and 64 ready volunteers', async () => {
      for (let z = 0; z < 8; z++) {
        const point = { latitude: -56 + z * 14, longitude: -140 + z * 35 };
        const vs = await Promise.all(Array.from({ length: 8 }, () => actor('scale-v')));
        await Promise.all(vs.map((v, i) => volunteer(v, { latitude: point.latitude + i * .001, longitude: point.longitude })));
        const patients = await Promise.all(Array.from({ length: 4 }, () => actor('scale-p')));
        const reporters = await Promise.all(Array.from({ length: 4 }, () => actor('scale-r', true)));
        zones.push({ point, vs, patients, reporters });
      }
      const background = Array.from({ length: 1000 - actors.length }, (_, i) => `${prefix}-${i}`);
      await batch(background, async uid => {
        await auth.createUser({ uid, email: `${uid}@example.test` }); backgroundAccounts++;
        await volunteer({ localId: uid }, { latitude: 0, longitude: 0 }, { isAvailable: false, verificationStatus: 'pending' });
      }, 20);
      assert.equal(actors.length + backgroundAccounts, 1000);
      for (const zone of zones) for (let i = 0; i < 4; i++) {
        const patient = zone.patients[i], reporter = zone.reporters[i];
        cases.push({ zone, patient, reporter, winner: zone.vs[i], cardId: await card(patient), requestId: randomUUID() });
      }
    });
    await stage('32 independent authenticated volunteer SDK feeds ready from server', async () => {
      await batch(cases, async c => {
        const app = appSdk.initializeApp({ projectId: 'demo-ehis-next', apiKey: 'demo-key', appId: 'demo-scale' }, randomUUID());
        const live = { app, alerts: new Map(), ready: false, error: null, unsubscribe: null }; liveClients.push(live); c.live = live;
        const clientAuth = authSdk.getAuth(app);
        authSdk.connectAuthEmulator(clientAuth, 'http://127.0.0.1:9199', { disableWarnings: true });
        await authSdk.signInWithEmailAndPassword(clientAuth, c.winner.email, c.winner.password);
        const clientDb = storeSdk.getFirestore(app); storeSdk.connectFirestoreEmulator(clientDb, '127.0.0.1', 8180);
        live.unsubscribe = storeSdk.onSnapshot(storeSdk.query(storeSdk.collection(clientDb, `volunteers/${c.winner.localId}/alerts`), storeSdk.orderBy('createdAt', 'desc'), storeSdk.limit(30)),
          { includeMetadataChanges: true }, snapshot => {
            if (snapshot.metadata.fromCache) return;
            live.ready = true;
            for (const item of snapshot.docs) live.alerts.set(item.id, { status: item.data().status, firstSeen: live.alerts.get(item.id)?.firstSeen ?? performance.now() });
          }, error => { live.error = error; });
        await until(() => live.ready, live);
      }, 8);
    });
    await stage('32 simultaneous requests; nearest five; live delivery; no cross-zone invitation', async () => {
      await Promise.all(cases.map(async c => {
        const sentAt = performance.now();
        const created = await ok('createIncident', { cardId: c.cardId, requestId: c.requestId, location: c.zone.point }, c.reporter);
        c.incidentId = created.incidentId;
        await until(() => c.live.alerts.has(c.incidentId), c.live);
        deliveries.push(Math.round(c.live.alerts.get(c.incidentId).firstSeen - sentAt));
        const incident = (await db.doc(`incidents/${c.incidentId}`).get()).data();
        assert.deepEqual(incident.invitedVolunteerIds, c.zone.vs.slice(0, 5).map(v => v.localId));
      }));
      assert.equal(new Set(cases.map(c => c.incidentId)).size, 32);
      for (const c of cases) {
        await until(() => c.live.alerts.size === 4, c.live);
        assert.deepEqual(new Set(c.live.alerts.keys()), new Set(cases.filter(other => other.zone === c.zone).map(other => other.incidentId)));
      }
    });
    await stage('8 lost-ack retries return the same incident', async () => {
      await Promise.all(cases.slice(0, 8).map(async c => {
        const replay = await ok('createIncident', { cardId: c.cardId, requestId: c.requestId, location: c.zone.point }, c.reporter);
        assert.equal(replay.incidentId, c.incidentId);
      }));
    });
    await stage('32 observations with optional phone omitted or supplied', async () => {
      await Promise.all(cases.map((c, i) => ok('submitBystanderReport', {
        incidentId: c.incidentId, submissionId: randomUUID(),
        ...(i % 2 ? { phone: '0900000000' } : {}),
        answers: { responsiveness: i % 2 ? 'responsive' : 'unknown', breathing: 'unknown', bleeding: 'none_seen' },
      }, c.reporter)));
    });
    await stage('32 assignments; correct private profile; cross-zone access denied', async () => {
      await Promise.all(cases.map(c => ok('acceptIncident', { incidentId: c.incidentId }, c.winner)));
      await Promise.all(cases.map(async (c, i) => {
        const details = await ok('getVolunteerIncidentDetails', { incidentId: c.incidentId }, c.winner);
        assert.equal(details.patientProfile.fullName, 'QA SYNTHETIC ' + c.patient.localId.slice(0, 6));
        assert.deepEqual(details.location, c.zone.point);
        assert.equal(details.phone, i % 2 ? '0900000000' : null);
        const v = (await db.doc(`volunteers/${c.winner.localId}`).get()).data();
        assert.equal(v.activeIncidentId, c.incidentId);
      }));
      for (let z = 0; z < zones.length; z++) {
        const c = cases[z * 4], outsider = zones[(z + 1) % zones.length].vs[0];
        assert.equal((await api('getVolunteerIncidentDetails', { incidentId: c.incidentId }, outsider)).status, 403);
      }
    });
    await stage('16 confirmed destination changes preserve incident ownership', async () => {
      await Promise.all(cases.slice(0, 16).map(c => ok('updateIncidentLocation', {
        incidentId: c.incidentId, updateId: randomUUID(),
        location: { latitude: c.zone.point.latitude + .002, longitude: c.zone.point.longitude },
      }, c.reporter)));
      for (const c of cases.slice(0, 16)) {
        const incident = (await db.doc(`incidents/${c.incidentId}`).get()).data();
        assert.equal(incident.locationRevision, 1); assert.equal(incident.acceptedBy, c.winner.localId);
      }
    });
    await stage('32 arrivals and completions; all pointers released; private reads denied', async () => {
      await Promise.all(cases.map(c => ok('markIncidentArrived', { incidentId: c.incidentId }, c.winner)));
      await Promise.all(cases.map(c => ok('finishIncident', { incidentId: c.incidentId, outcome: 'completed' }, c.winner)));
      await Promise.all(cases.map(async c => {
        assert.equal((await db.doc(`incidents/${c.incidentId}`).get()).data().status, 'completed');
        assert.equal((await db.doc(`cards/${c.cardId}`).get()).data().activeIncidentId, null);
        assert.equal((await db.doc(`volunteers/${c.winner.localId}`).get()).data().activeIncidentId, null);
        await until(() => c.live.alerts.get(c.incidentId)?.status === 'completed', c.live);
        const result = await api('getVolunteerIncidentDetails', { incidentId: c.incidentId }, c.winner);
        assert.ok(result.status >= 400 && result.status < 500, 'Closed case cannot grant private details');
      }));
    });
    const latency = {};
    latency.alertDelivery = { samples: deliveries.length, p50Ms: percentile(deliveries, .5), p95Ms: percentile(deliveries, .95), maxMs: Math.max(...deliveries) };
    for (const name of new Set(metrics.map(m => m.operation))) {
      const values = metrics.filter(m => m.operation === name && m.status === 200).map(m => m.ms);
      if (values.length) latency[name] = { samples: values.length, p50Ms: percentile(values, .5), p95Ms: percentile(values, .95), maxMs: Math.max(...values) };
    }
    const report = { scope: 'LOCAL EMULATOR ONLY; not cloud, phone or SLA', projectId: 'demo-ehis-next', transport: portable ? 'portable HTTP wrapper used by Vercel, loopback 5203' : 'Functions Emulator front door, loopback 5101',
      startedAt, endedAt: new Date().toISOString(), authenticatedAccounts: actors.length + backgroundAccounts,
      concurrentIncidents: cases.length, regions: zones.length, readyVolunteers: 64, backgroundOfflinePending: backgroundAccounts,
      accountsWithSession: actors.length, liveVolunteerClients: liveClients.length, apiCalls: metrics.length, expectedDenials: metrics.filter(m => m.status === 403 || m.status === 400).length,
      automaticRetries: 0, stages, latency, status: 'PASS' };
    // The app's shortest callable timeout is 15 seconds. Do not hide that mismatch.
    report.latencyGateMs = 15000;
    report.latencyStatus = Object.values(latency).every(item => item.maxMs < report.latencyGateMs) ? 'PASS' : 'RECHECK';
    if (report.latencyStatus !== 'PASS') report.status = 'RECHECK';
    fs.mkdirSync('.local', { recursive: true });
    fs.writeFileSync('.local/scale-acceptance.json', JSON.stringify(report, null, 2) + '\n');
    fs.writeFileSync(portable ? '.local/scale-portable.json' : '.local/scale-functions.json', JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify({ status: report.status, accounts: report.authenticatedAccounts, concurrentIncidents: 32, regions: 8, apiCalls: report.apiCalls, stages: stages.length }));
    if (report.status !== 'PASS') process.exitCode = 2;
  } finally {
    for (const live of liveClients) live.unsubscribe?.();
    await Promise.allSettled(liveClients.map(live => appSdk.deleteApp(live.app)));
    if (server?.exitCode === null) server.kill();
    if (log !== undefined) fs.closeSync(log);
    await batch(zones.flatMap(z => z.vs), v => db.doc(`volunteers/${v.localId}`).update({ isAvailable: false }));
    await db.terminate();
  }
}
main().catch(error => {
  fs.writeFileSync('.local/scale-acceptance.json', JSON.stringify({ status: 'FAIL', startedAt, endedAt: new Date().toISOString(), stages, error: error.message }, null, 2));
  console.error(error.message); process.exitCode = 1;
});
