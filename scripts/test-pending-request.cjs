const { test } = require('node:test'),
  assert = require('node:assert/strict');
const modulePromise = import('../frontend/web/src/lib/pending-request.ts');
const valid = {
  requestId: 'abcdef-123456',
  location: { latitude: 10.779, longitude: 106.699 },
  locationSource: 'reporter_gps',
};
test('damaged persisted requests cannot become recoverable incident payloads', async () => {
  const { readPendingRequest: read } = await modulePromise;
  for (const value of [
    null,
    [],
    {},
    { ...valid, requestId: 'bad' },
    { ...valid, location: { latitude: NaN, longitude: 1 } },
    { ...valid, location: { latitude: 91, longitude: 1 } },
    { ...valid, locationSource: 'unknown' },
    { ...valid, locationSource: 'patient_pin' },
    {
      ...valid,
      locationSource: 'patient_pin',
      patientAddress: 'Cổng chính',
      destinationConfirmed: false,
    },
  ])
    assert.equal(read(value), null);
});
test('GPS legacy and confirmed patient pins retain exact request identity without unrelated fields', async () => {
  const { readPendingRequest: read } = await modulePromise;
  assert.deepEqual(read({ ...valid, phone: 'must-not-persist' }), valid);
  const pin = {
    ...valid,
    locationSource: 'patient_pin',
    patientAddress: 'Cổng chính An Bình',
    destinationConfirmed: true,
  };
  assert.deepEqual(read(pin), pin);
  const { locationSource, ...legacy } = valid;
  assert.deepEqual(read(legacy), legacy);
});
test('uncertain transport errors cannot be treated as proof a request was rejected', async () => {
  const { isDefinitiveRequestRejection: rejected } = await modulePromise;
  for (const code of [
    'functions/unavailable',
    'functions/internal',
    'functions/deadline-exceeded',
    'auth/network-request-failed',
  ])
    assert.equal(rejected({ code }), false);
  assert.equal(rejected(null), false);
  for (const code of [
    'functions/invalid-argument',
    'functions/resource-exhausted',
    'functions/already-exists',
  ])
    assert.equal(rejected({ code }), true);
});
