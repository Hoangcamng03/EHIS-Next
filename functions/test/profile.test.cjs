const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parsePatientProfile } = require('../lib/profile');

const valid = () => ({ fullName: '  Demo Patient  ', allergies: ['Demo allergy'], emergencyContactPhone: '0900000000' });

test('normalizes a valid synthetic profile', () => {
  assert.equal(parsePatientProfile(valid()).fullName, 'Demo Patient');
});
test('rejects role or owner injection', () => {
  assert.throws(() => parsePatientProfile({ ...valid(), verified: true }), /Unexpected/);
  assert.throws(() => parsePatientProfile({ ...valid(), uid: 'another-user' }), /Unexpected/);
});
test('rejects invalid structure and oversized data', () => {
  for (const input of [null, [], 'text', { ...valid(), fullName: '' },
    { ...valid(), allergies: Array(21).fill('a') }, { ...valid(), emergencyContactPhone: 'invalid' }]) {
    assert.throws(() => parsePatientProfile(input));
  }
});
