const { test } = require('node:test');
const assert = require('node:assert/strict');
const { pushMessage, validPushToken } = require('../lib/pushPolicy');
test('lock-screen payload contains only generic text and opaque incident reference', () => {
  const message = pushMessage('synthetic-case', 'request', 1700000060000, 1700000000000);
  assert.deepEqual(Object.keys(message.data).sort(), ['incidentId', 'kind', 'screen']);
  assert.equal(message.android.ttl, '60s'); assert.equal(message.android.notification.visibility, 'PRIVATE');
  assert.equal(message.android.notification.channel_id, 'ehis_emergency_v1');
  // Direct HTTP v1 uses the REST enum, not Admin SDK's lower-case convenience type.
  assert.equal(message.android.priority, 'HIGH');
  for (const invalid of ['patientProfile', 'phone', 'latitude', 'allergies', 'fullName']) assert(!JSON.stringify(message).includes(invalid));
  assert.throws(() => pushMessage('synthetic-case', 'request', 100, 100));
  assert.throws(() => pushMessage('../patient', 'request', 200, 100));
  assert.throws(() => pushMessage('case', 'unknown', 200, 100));
});
test('device tokens are bounded and cannot contain payload objects or whitespace', () => {
  assert(validPushToken('synthetic:FCM-device-token_12345'));
  for (const value of ['', null, {}, 'short', 'x'.repeat(4097), 'token with spaces and other content']) assert.equal(validPushToken(value), false);
});
