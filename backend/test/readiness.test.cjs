const {test}=require('node:test'),assert=require('node:assert/strict');const {volunteerReadiness}=require('../lib/readiness');
test('admin readiness excludes expired/future GPS, busy, OFF and suspended people',()=>{
 const now=1000000,base={verificationStatus:'approved',isAvailable:true,location:{latitude:10,longitude:106},lastSeenAt:{toMillis:()=>now-300000}};
 assert.equal(volunteerReadiness(base,now).readyForDispatch,true);
 for(const patch of [{location:undefined},{location:{latitude:NaN,longitude:106}},{lastSeenAt:{toMillis:()=>now-300001}},{lastSeenAt:{toMillis:()=>now+60001}},{isAvailable:false},{activeIncidentId:'case-x'},{verificationStatus:'suspended'},{lastSeenAt:undefined}])assert.equal(volunteerReadiness({...base,...patch},now).readyForDispatch,false);
});
