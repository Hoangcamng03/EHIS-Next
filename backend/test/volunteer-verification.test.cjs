const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseApplication } = require('../lib/volunteerVerification');
const valid = {
  fullName: ' Synthetic trainee ',
  phone: '0900000000',
  experience: 'Synthetic course',
  trainingLevel: 'clinical_student',
  clinicalMonths: 3,
  homeAddress: 'Synthetic ward',
  workAddress: 'Synthetic unit',
  serviceArea: 'Synthetic zone',
  referrerEmail: 'Manager@Example.test',
};
test('application normalizes contact identity without trusting supplied role or checklist', () => {
  const parsed = parseApplication(valid);
  assert.equal(parsed.fullName, 'Synthetic trainee');
  assert.deepEqual(parsed.specialties, ['basic_aid']);
  assert.equal(parsed.referrerEmail, undefined);
  for (const extra of [
    { verificationStatus: 'approved' },
    { referral: { decision: 'recommended' } },
    { referrerUid: 'injected' },
    { policyVersion: 2 },
  ])
    assert.throws(() => parseApplication({ ...valid, ...extra }));
});
test('training categories, clinical duration and organisational fields are bounded', () => {
  for (const patch of [
    { trainingLevel: 'doctor' },
    { clinicalMonths: -1 },
    { clinicalMonths: 601 },
    { clinicalMonths: 0.5 },
    { clinicalMonths: '3' },
    { trainingLevel: 'first_aid', clinicalMonths: 3 },
    { workAddress: '' },
    { homeAddress: 'x'.repeat(201) },
    { specialties: ['doctor'] },
    { specialties: [] },
    { phone: 'abc' },
  ])
    assert.throws(() => parseApplication({ ...valid, ...patch }));
});
