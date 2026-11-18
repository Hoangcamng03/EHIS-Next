const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseSpecialties, suggestedSpecialties, skillMatch } = require('../lib/specialties');
const { parseCreateIncident } = require('../lib/reportValidation');
test('skill input rejects invented privileges, duplicates and empty verification', () => {
  for (const value of [[], ['doctor'], ['cpr', 'cpr'], 'cpr', ['cpr', { admin: true }]])
    assert.throws(() => parseSpecialties(value));
  assert.deepEqual(parseSpecialties(['cpr', 'trauma']), ['cpr', 'trauma']);
});
test('observations suggest support skills without excluding general volunteers', () => {
  assert.deepEqual(suggestedSpecialties(), []);
  assert.deepEqual(suggestedSpecialties({ breathing: 'unknown', bleeding: 'unknown' }), []);
  const needs = suggestedSpecialties({
    responsiveness: 'unresponsive',
    breathing: 'abnormal',
    bleeding: 'visible',
  });
  assert.deepEqual(needs, ['cpr', 'respiratory', 'trauma']);
  assert.equal(skillMatch(['trauma'], needs), 1);
  assert.equal(skillMatch(undefined, needs), 0);
});
test('remote destination requires a confirmed pin and address; legacy GPS payload stays compatible', () => {
  const data = {
    cardId: 'patient-card',
    requestId: 'request-key',
    location: { latitude: 10.7, longitude: 106.7 },
  };
  assert.deepEqual(parseCreateIncident(data), data);
  for (const patch of [
    { locationSource: 'patient_pin' },
    { locationSource: 'patient_pin', patientAddress: 'Cổng A', destinationConfirmed: false },
    { locationSource: 'patient_pin', patientAddress: '', destinationConfirmed: true },
    { locationSource: 'diagnosis' },
    { location: { latitude: 91, longitude: 0 } },
  ])
    assert.throws(() => parseCreateIncident({ ...data, ...patch }));
  assert.equal(
    parseCreateIncident({
      ...data,
      locationSource: 'patient_pin',
      patientAddress: ' Cổng A, tầng trệt ',
      destinationConfirmed: true,
    }).patientAddress,
    'Cổng A, tầng trệt',
  );
});
