const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseCreateIncident, parseBystanderReport } = require('../lib/reportValidation');
const report = () => ({ incidentId: 'incident-demo', submissionId: 'submission-demo', answers: {
  responsiveness: 'responsive', breathing: 'unknown', bleeding: 'none_seen',
} });
test('phone is optional while all observation questions are required', () => {
  assert.equal(parseBystanderReport(report()).phone, null);
  assert.equal(parseBystanderReport({ ...report(), phone: '' }).phone, null);
  assert.equal(parseBystanderReport({ ...report(), phone: '090 000 0000' }).phone, '0900000000');
  assert.throws(() => parseBystanderReport({ ...report(), answers: { breathing: 'normal' } }));
});
test('rejects identities, arbitrary diagnosis, invalid phone and coordinates', () => {
  assert.throws(() => parseBystanderReport({ ...report(), reporterUid: 'other' }));
  assert.throws(() => parseBystanderReport({ ...report(), phone: 'not-a-phone' }));
  assert.throws(() => parseBystanderReport({ ...report(), answers: { ...report().answers, breathing: 'diagnosis' } }));
  assert.throws(() => parseCreateIncident({ cardId: 'demo-card', requestId: 'request-demo', location: { latitude: 91, longitude: 0 } }));
});
