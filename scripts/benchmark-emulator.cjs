// Synthetic, loopback-only comparison. Never targets Firebase cloud or creates a release.
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const assert = require('node:assert/strict');
const { randomUUID, createHash } = require('node:crypto');
const { createRequire } = require('node:module');
const { spawn, spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const output = path.join(root, '.local', 'performance');
const projectId = 'demo-ehis-next';
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const json = file => JSON.parse(fs.readFileSync(file, 'utf8'));
function baselinePath() {
  const at = process.argv.indexOf('--baseline');
  const folder = path.resolve(process.env.EHIS_PERF_BASELINE || (at >= 0 ? process.argv[at + 1] : path.join(root, '..', 'ehis-next-baseline')));
  assert.ok(fs.existsSync(path.join(folder, '.git')), 'Baseline must be a local Git checkout');
  return folder;
}
function idle(port) {
  return new Promise((resolve, reject) => {
    const socket = net.connect({ host: '127.0.0.1', port });
    socket.once('connect', () => { socket.destroy(); reject(Error(`Port ${port} is already in use; no existing process will be reused or stopped.`)); });
    socket.once('error', error => error.code === 'ECONNREFUSED' ? resolve() : reject(error));
  });
}
async function outer() {
  assert.ok(process.env.npm_execpath, 'Run through npm run perf:emulator');
  for (const port of [8180, 9199, 5201, 5202]) await idle(port);
  const { localEnvironment, checkJava } = require('./local-runtime.cjs');
  const env = { ...localEnvironment(), EHIS_PERF_BASELINE: baselinePath() }; checkJava(env);
  const { firebaseInvocation } = require('./firebase-cli.cjs');
  const args = firebaseInvocation(['emulators:exec', '--project', projectId, '--only', 'auth,firestore', 'node scripts/benchmark-emulator.cjs --child']);
  const child = spawn(process.execPath, args, { cwd: root, env, windowsHide: true, stdio: 'inherit' });
  child.on('error', error => { console.error(error.message); process.exitCode = 1; });
  child.on('exit', code => { process.exitCode = code ?? 1; });
}
const percentile = (numbers, fraction) => [...numbers].sort((a, b) => a - b)[Math.max(0, Math.ceil(numbers.length * fraction) - 1)];
function summarize(samples) {
  const groups = {};
  for (const sample of samples) (groups[`${sample.mode}:${sample.operation}`] ??= []).push(sample.ms);
  return Object.fromEntries(Object.entries(groups).map(([key, values]) => [key, {
    count: values.length, p50Ms: Math.round(percentile(values, .5)), p95Ms: Math.round(percentile(values, .95)), maxMs: Math.round(Math.max(...values)),
  }]));
}
async function benchmark() {
  assert.equal(process.env.FIRESTORE_EMULATOR_HOST, '127.0.0.1:8180');
  assert.equal(process.env.FIREBASE_AUTH_EMULATOR_HOST, '127.0.0.1:9199');
  assert.equal(process.env.GCLOUD_PROJECT, projectId);
  const baseline = baselinePath(), oldBackend = fs.existsSync(path.join(baseline, 'backend')) ? 'backend' : 'functions';
  const targets = { baseline: { cwd: path.join(baseline, oldBackend), port: 5201 }, current: { cwd: path.join(root, 'backend'), port: 5202 } };
  fs.mkdirSync(output, { recursive: true });
  const backendRequire = createRequire(path.join(root, 'backend/package.json'));
  backendRequire('firebase-admin/app').initializeApp({ projectId });
  const { getFirestore, Timestamp } = backendRequire('firebase-admin/firestore');
  const db = getFirestore();
  const webRequire = createRequire(path.join(root, 'frontend/web/package.json'));
  const appSdk = webRequire('firebase/app'), authSdk = webRequire('firebase/auth'), storeSdk = webRequire('firebase/firestore');
  const processes = [], descriptors = [], samples = [], rounds = [], openApps = new Set();
  const metadata = folder => spawnSync('git', ['rev-parse', 'HEAD'], { cwd: folder, encoding: 'utf8', windowsHide: true }).stdout.trim();
  const digest = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  let requestsInWindow = 0, window = Math.floor(Date.now() / 60000);
  const startedAt = new Date().toISOString();
  async function budgetForNextRound() {
    const now = Math.floor(Date.now() / 60000);
    if (now !== window) { window = now; requestsInWindow = 0; }
    if (requestsInWindow + 91 > 500) { await pause(60000 - Date.now() % 60000 + 100); window = Math.floor(Date.now() / 60000); requestsInWindow = 0; }
  }
  async function signup(anonymous) {
    const password = `Local-${randomUUID()}!`;
    const response = await fetch('http://127.0.0.1:9199/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-key', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(anonymous ? { returnSecureToken: true } : { email: `perf-${randomUUID()}@example.test`, password, returnSecureToken: true }),
    });
    assert.equal(response.status, 200, 'Synthetic Auth signup');
    return { ...await response.json(), password };
  }
  async function fixture(index) {
    const [reporter, volunteer] = await Promise.all([signup(true), signup(false)]);
    const patientId = 'perf-p-' + randomUUID(), cardId = randomUUID();
    const location = { latitude: -55 + index * 8, longitude: -145 + index % 4 * 85 };
    await Promise.all([
      db.doc(`patients/${patientId}`).set({ fullName: 'PERF SYNTHETIC', allergies: [], emergencyContactPhone: '' }),
      db.doc(`cards/${cardId}`).set({ patientId, active: true, shareProfile: true, activeIncidentId: null }),
      db.doc(`volunteers/${volunteer.localId}`).set({ verificationStatus: 'approved', isAvailable: true, location, lastSeenAt: Timestamp.now() }),
    ]);
    const app = appSdk.initializeApp({ projectId, apiKey: 'demo-key', appId: 'demo-app' }, randomUUID());
    openApps.add(app);
    const auth = authSdk.getAuth(app); authSdk.connectAuthEmulator(auth, 'http://127.0.0.1:9199', { disableWarnings: true });
    await authSdk.signInWithEmailAndPassword(auth, volunteer.email, volunteer.password);
    const client = storeSdk.getFirestore(app); storeSdk.connectFirestoreEmulator(client, '127.0.0.1', 8180);
    return { reporter, volunteer, patientId, cardId, location, app, client };
  }
  async function runCase(f, variant, mode, round, record = true) {
    const requestId = randomUUID(), incidentId = createHash('sha256').update(`${f.reporter.localId}:${requestId}`).digest('hex').slice(0, 40);
    let sentAt = 0, notifyAt = 0, unsubscribe;
    let readyResolve, notifyResolve, listenerReject;
    const ready = new Promise((resolve, reject) => { readyResolve = resolve; listenerReject = reject; });
    const notification = new Promise(resolve => { notifyResolve = resolve; });
    unsubscribe = storeSdk.onSnapshot(storeSdk.doc(f.client, `volunteers/${f.volunteer.localId}/alerts/${incidentId}`), { includeMetadataChanges: true }, snapshot => {
      if (snapshot.metadata.fromCache) return;
      readyResolve();
      if (snapshot.exists() && !notifyAt) { notifyAt = performance.now(); notifyResolve(); }
    }, error => listenerReject(error));
    async function api(operation, data, actor) {
      const start = performance.now(); requestsInWindow++;
      const response = await fetch(`http://127.0.0.1:${targets[variant].port}/api/${operation}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${actor.idToken}` },
        body: JSON.stringify({ data }), signal: AbortSignal.timeout(30000),
      });
      const body = await response.json();
      assert.equal(response.status, 200, `${variant} ${mode} ${operation}: ${body.error?.status || response.status}`);
      if (record) samples.push({ variant, mode, round, operation, ms: performance.now() - start });
      return body.result;
    }
    const deadline = promise => { let timer; return Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(Error('Realtime listener timed out')), 15000); })]).finally(() => clearTimeout(timer)); };
    try {
      await deadline(ready); sentAt = performance.now();
      const created = await api('createIncident', { cardId: f.cardId, requestId, location: f.location }, f.reporter);
      assert.equal(created.incidentId, incidentId); assert.equal(created.invitedCount, 1);
      await deadline(notification);
      if (record) samples.push({ variant, mode, round, operation: 'alertDelivery', ms: notifyAt - sentAt });
      await api('submitBystanderReport', { incidentId, submissionId: randomUUID(), answers: { responsiveness: 'unknown', breathing: 'unknown', bleeding: 'unknown' } }, f.reporter);
      await api('acceptIncident', { incidentId }, f.volunteer);
      const details = await api('getVolunteerIncidentDetails', { incidentId }, f.volunteer); assert.equal(details.patientProfile.fullName, 'PERF SYNTHETIC');
      await api('updateIncidentLocation', { incidentId, updateId: randomUUID(), location: { latitude: f.location.latitude + .001, longitude: f.location.longitude + .001 } }, f.reporter);
      await api('markIncidentArrived', { incidentId }, f.volunteer);
      await api('finishIncident', { incidentId, outcome: 'completed' }, f.volunteer);
      assert.equal((await db.doc(`incidents/${incidentId}`).get()).data().status, 'completed');
    } finally {
      unsubscribe?.(); await appSdk.deleteApp(f.app); openApps.delete(f.app);
      await db.doc(`volunteers/${f.volunteer.localId}`).update({ isAvailable: false });
    }
  }
  try {
    for (const [name, target] of Object.entries(targets)) {
      await idle(target.port); assert.ok(fs.existsSync(path.join(target.cwd, 'lib/index.js')), 'Build both backends first');
      const descriptor = fs.openSync(path.join(output, `${name}-server.log`), 'w'); descriptors.push(descriptor);
      processes.push(spawn(process.execPath, ['server.cjs'], { cwd: target.cwd, windowsHide: true,
        env: { ...process.env, PORT: String(target.port), GCLOUD_PROJECT: projectId, FIREBASE_CONFIG: JSON.stringify({ projectId }), FUNCTIONS_EMULATOR: 'true', FIRESTORE_EMULATOR_HOST: '127.0.0.1:8180', FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9199', EHIS_SERVICE_ACCOUNT_JSON: '', VERCEL: '' }, stdio: ['ignore', descriptor, descriptor] }));
      let healthy = false;
      for (let attempt = 0; attempt < 80; attempt++) {
        try { const health = await (await fetch(`http://127.0.0.1:${target.port}/api/health`)).json(); if (health.projectId === projectId) { healthy = true; break; } } catch { /* Own server startup only. */ }
        await pause(250);
      }
      assert.ok(healthy, `${name} backend did not start`);
    }
    const order = ['baseline', 'current', 'current', 'baseline', 'baseline', 'current', 'current', 'baseline'];
    for (let round = 0; round < order.length; round++) {
      const variant = order[round]; await budgetForNextRound();
      await runCase(await fixture(0), variant, 'warmup', round, false);
      const fixtures = []; for (let index = 0; index < 12; index++) fixtures.push(await fixture(index));
      const start = performance.now();
      for (const f of fixtures.slice(0, 6)) await runCase(f, variant, 'sequential', round);
      await Promise.all(fixtures.slice(6).map(f => runCase(f, variant, 'burst6', round)));
      rounds.push({ round, variant, cases: 12, ms: Math.round(performance.now() - start) });
      console.log(`PASS perf round ${round + 1}/8 ${variant}: 6 sequential + 6 concurrent synthetic incidents`);
    }
    const summary = Object.fromEntries(Object.keys(targets).map(name => [name, summarize(samples.filter(sample => sample.variant === name))]));
    const comparisons = Object.keys(summary.baseline).map(key => {
      const before = summary.baseline[key], after = summary.current[key];
      const limit = Math.max(before.p95Ms * 1.2, before.p95Ms + 75);
      return { metric: key, baseline: before, current: after, p95ChangePercent: Math.round((after.p95Ms / before.p95Ms - 1) * 1000) / 10, p95LimitMs: Math.round(limit), status: after.p95Ms <= limit ? 'PASS' : 'RECHECK' };
    });
    const report = { scope: 'LOCAL EMULATOR + portable HTTP callable wrapper + real client SDK; not cloud, device, or SLA', projectId,
      baselineCommit: metadata(baseline), currentCommit: metadata(root), currentGuardSha256: digest(path.join(root, 'backend/src/guards.ts')), node: process.version,
      startedAt, endedAt: new Date().toISOString(), order, measuredIncidents: 96, warmupIncidents: 8, threshold: 'p95 <= max(baseline * 1.20, baseline + 75ms); flag for investigation, not proof of equivalence',
      rounds, comparisons, samples, status: comparisons.every(c => c.status === 'PASS') ? 'PASS' : 'RECHECK' };
    fs.writeFileSync(path.join(output, 'api-comparison.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify({ status: report.status, measuredIncidents: report.measuredIncidents, metrics: comparisons.map(c => ({ metric: c.metric, baselineP95: c.baseline.p95Ms, currentP95: c.current.p95Ms, status: c.status })) }));
    if (report.status !== 'PASS') process.exitCode = 2;
  } finally {
    await Promise.all(processes.map(child => new Promise(resolve => { if (child.exitCode !== null) return resolve(); child.once('exit', resolve); child.kill(); setTimeout(resolve, 5000).unref(); })));
    descriptors.forEach(descriptor => fs.closeSync(descriptor));
    await Promise.allSettled([...openApps].map(app => appSdk.deleteApp(app)));
    await db.terminate();
  }
}
(process.argv.includes('--child') ? benchmark() : outer()).catch(error => { console.error(error.message); process.exitCode = 1; });
