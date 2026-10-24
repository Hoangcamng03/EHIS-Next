const assert = require('node:assert/strict');
const base = 'http://127.0.0.1:5101/demo-ehis-next/asia-southeast1';
const authBase = 'http://127.0.0.1:9199/identitytoolkit.googleapis.com/v1';
const dataBase = 'http://127.0.0.1:8180/v1/projects/demo-ehis-next/databases/(default)/documents';
async function call(name, data, token) {
  return fetch(`${base}/${name}`, { method: 'POST', headers: {
    'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }, body: JSON.stringify({ data }), signal: AbortSignal.timeout(30000) });
}
async function signup(label) {
  const response = await fetch(`${authBase}/accounts:signUp?key=emulator-key`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `${label}-${Date.now()}@example.test`, password: 'Synthetic-demo-4291!', returnSecureToken: true }),
  });
  assert.equal(response.status, 200); return response.json();
}
async function main() {
  assert.equal((await (await fetch(`${base}/health`)).json()).service, 'ehis-next');
  assert.equal((await call('savePatientProfile', {})).status, 401);
  const owner = await signup('patient');
  const other = await signup('other');
  const profile = { fullName: 'Synthetic Patient', allergies: ['Synthetic allergy'], emergencyContactPhone: '0900000000' };
  assert.equal((await call('savePatientProfile', { ...profile, verified: true }, owner.idToken)).status, 400);
  const saved = await call('savePatientProfile', profile, owner.idToken);
  assert.equal(saved.status, 200); assert.equal((await saved.json()).result.saved, true);
  const document = `${dataBase}/patients/${owner.localId}`;
  assert.equal((await fetch(document, { headers: { Authorization: `Bearer ${owner.idToken}` } })).status, 200);
  assert.equal((await fetch(document, { headers: { Authorization: `Bearer ${other.idToken}` } })).status, 403);
  assert.equal((await fetch(document)).status, 403);
  const access = await (await call('getMyAccess', {}, owner.idToken)).json();
  assert.equal(access.result.uid, owner.localId);
  assert.equal(access.result.isVerifiedVolunteer, false);
  assert.equal(access.result.isAdmin, false);
  const unsafeWrite = await fetch(`${dataBase}/volunteers/${owner.localId}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${owner.idToken}` },
    body: JSON.stringify({ fields: { verificationStatus: { stringValue: 'approved' } } }),
  });
  assert.equal(unsafeWrite.status, 403);
  console.log('PASS: health, unauthenticated rejection, field injection rejection, owner save/read, cross-user and public denial, server roles, verification write denial.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
