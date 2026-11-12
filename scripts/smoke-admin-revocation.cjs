const { auth, db, actor, api, assert } = require('./test-support/emulator.cjs');
(async () => {
  const user = await actor('admin-revocation');
  await auth.setCustomUserClaims(user.localId, { admin: true });
  const r = await fetch(
    'http://127.0.0.1:9199/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-key',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, password: user.password, returnSecureToken: true }),
    },
  );
  const elevated = await r.json();
  assert.equal(r.status, 200);
  assert.equal((await api('listVolunteerApplications', {}, elevated)).status, 200);
  await auth.setCustomUserClaims(user.localId, {});
  assert.equal((await api('listVolunteerApplications', {}, elevated)).status, 403);
  console.log(
    'PASS: old admin token denied403 immediately after claim removal in local Auth, before token refresh.',
  );
  await db.terminate();
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
