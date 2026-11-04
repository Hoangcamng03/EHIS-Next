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
test('details preserve old APK payloads and reject conflicting observations',()=>{
 for(const breathingDetail of ['difficulty','gasping','not_seen'])assert.equal(parseBystanderReport({...report(),answers:{...report().answers,breathing:'abnormal',breathingDetail}}).answers.breathingDetail,breathingDetail);
 for(const bleedingDetail of ['small','heavy'])assert.equal(parseBystanderReport({...report(),answers:{...report().answers,bleeding:'visible',bleedingDetail}}).answers.bleedingDetail,bleedingDetail);
 for(const answers of [{...report().answers,breathingDetail:'gasping'},{...report().answers,bleedingDetail:'heavy'},{...report().answers,breathing:'abnormal',breathingDetail:'diagnosis'},{...report().answers,pulse:'diagnosis'}])assert.throws(()=>parseBystanderReport({...report(),answers}));
});
