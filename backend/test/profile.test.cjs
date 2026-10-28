const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parsePatientProfile } = require('../lib/profile');

const valid = () => ({ fullName: '  Demo Patient  ', allergies: ['Demo allergy'], emergencyContactPhone: '0900000000' });

test('normalizes a valid synthetic profile', () => {
  assert.equal(parsePatientProfile(valid()).fullName, 'Demo Patient');
});

test('a patient without an emergency contact can still save a profile', () => {
  assert.equal(parsePatientProfile({ ...valid(), emergencyContactPhone: '' }).emergencyContactPhone, '');
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

test('contact identity and relationship are validated together without breaking legacy requests', () => {
  const profile = { ...valid(), emergencyContactName: '  Người thân giả  ', emergencyContactRelationship: '  Mẹ  ' };
  assert.equal(parsePatientProfile(profile).emergencyContactName, 'Người thân giả');
  assert.equal(parsePatientProfile(profile).emergencyContactRelationship, 'Mẹ');
  assert.equal('emergencyContactName' in parsePatientProfile(valid()), false);
  assert.equal(parsePatientProfile({ ...profile, emergencyContactPhone: '', emergencyContactName: '', emergencyContactRelationship: '' }).emergencyContactName, '');
  for (const bad of [{ ...profile, emergencyContactName: '' }, { ...profile, emergencyContactRelationship: '' },
    { ...profile, emergencyContactPhone: '' }, { ...profile, emergencyContactRelationship: 'a'.repeat(61) },
    { ...profile, emergencyContactName: ['not a name'] }]) assert.throws(() => parsePatientProfile(bad));
});
