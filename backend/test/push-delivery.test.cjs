const {test}=require('node:test'),assert=require('node:assert/strict');
const {pendingPushDevices,pushDeviceKey}=require('../lib/pushDelivery');
// Pure selection tests with fixture receipts. No FCM calls or device-delivery results are simulated.
test('retry selects only devices without a terminal recorded receipt',()=>{
 const now=1000000,devices=['A','B'].map(token=>({token,updatedAt:now}));
 assert.deepEqual(pendingPushDevices(devices,[{key:pushDeviceKey('A'),status:'accepted',at:now}],now).map(d=>d.token),['B']);
 assert.deepEqual(pendingPushDevices(devices,[{key:pushDeviceKey('A'),status:'invalid-token',at:now}],now).map(d=>d.token),['B']);
});
test('device selection is bounded, deduplicated, fresh and targeted',()=>{
 const now=4000000000,devices=['A','A','B','C','D'].map(token=>({token,updatedAt:now}));
 assert.equal(pendingPushDevices(devices,[],now).length,3);
 assert.deepEqual(pendingPushDevices(devices,[],now,pushDeviceKey('B')).map(d=>d.token),['B']);
 for(const updatedAt of [now-31*86400000,now+60001,NaN])assert.equal(pendingPushDevices([{token:'A',updatedAt}],[],now).length,0);
});
