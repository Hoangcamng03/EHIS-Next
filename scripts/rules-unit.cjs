const { test, before, after } = require('node:test'),
  assert = require('node:assert/strict');
const { createRequire } = require('node:module'),
  path = require('node:path'),
  fs = require('node:fs');
const req = createRequire(path.resolve(__dirname, '../frontend/web/package.json'));
const { initializeTestEnvironment, assertSucceeds, assertFails } = req(
  '@firebase/rules-unit-testing',
);
const { doc, setDoc, getDoc, updateDoc, deleteDoc, collection, getDocs, query, limit } =
  req('firebase/firestore');
let env;
before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-ehis-rules',
    firestore: {
      host: '127.0.0.1',
      port: 8180,
      rules: fs.readFileSync(path.resolve(__dirname, '../firestore.rules'), 'utf8'),
    },
  });
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    for (const p of [
      'patients/alice',
      'patientCards/alice',
      'users/alice',
      'volunteerApplications/alice',
      'volunteers/alice',
      'patients/alice/incidentStatuses/a',
      'reporters/alice/incidentStatuses/a',
      'volunteers/alice/alerts/a',
      'incidents/a',
      'incidents/a/private/reporter',
      'cards/a',
      '_requestLimits/a',
    ])
      await setDoc(
        doc(db, p),
        p === 'volunteers/alice' ? { verificationStatus: 'approved' } : { value: 'fixture' },
      );
  });
});
after(async () => {
  await env?.clearFirestore();
  await env?.cleanup();
});
for (const p of [
  'patients/alice',
  'patientCards/alice',
  'users/alice',
  'volunteerApplications/alice',
  'volunteers/alice',
  'patients/alice/incidentStatuses/a',
  'reporters/alice/incidentStatuses/a',
  'volunteers/alice/alerts/a',
])
  test('owner read only: ' + p, async () => {
    await assertSucceeds(getDoc(doc(env.authenticatedContext('alice').firestore(), p)));
    await assertFails(getDoc(doc(env.authenticatedContext('bob').firestore(), p)));
    await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), p)));
  });
test('client cannot create, update or delete profiles/roles/approval', async () => {
  const db = env.authenticatedContext('alice', { admin: true }).firestore();
  for (const p of [
    'patients/alice',
    'users/alice',
    'volunteers/alice',
    'volunteerApplications/alice',
  ]) {
    await assertFails(updateDoc(doc(db, p), { admin: true, verificationStatus: 'approved' }));
    await assertFails(deleteDoc(doc(db, p)));
  }
  await assertFails(setDoc(doc(db, 'patients/new'), { fullName: 'owner injection' }));
});
test('private incidents, cards and counters are denied even with admin client claim', async () => {
  const db = env.authenticatedContext('alice', { admin: true }).firestore();
  for (const p of ['incidents/a', 'incidents/a/private/reporter', 'cards/a', '_requestLimits/a'])
    await assertFails(getDoc(doc(db, p)));
});
test('unapproved volunteer cannot read alerts; owner history lists remain supported', async () => {
  await env.withSecurityRulesDisabled((ctx) =>
    updateDoc(doc(ctx.firestore(), 'volunteers/alice'), { verificationStatus: 'suspended' }),
  );
  await assertFails(
    getDoc(doc(env.authenticatedContext('alice').firestore(), 'volunteers/alice/alerts/a')),
  );
  await assertSucceeds(
    getDocs(
      query(
        collection(
          env.authenticatedContext('alice').firestore(),
          'patients/alice/incidentStatuses',
        ),
        limit(20),
      ),
    ),
  );
  await assertFails(
    getDocs(
      collection(env.authenticatedContext('bob').firestore(), 'patients/alice/incidentStatuses'),
    ),
  );
  await assertFails(getDocs(collection(env.authenticatedContext('alice').firestore(), 'patients')));
  assert.equal(env.projectId, 'demo-ehis-rules');
});
