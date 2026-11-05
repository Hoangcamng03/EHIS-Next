const {test}=require('node:test'),assert=require('node:assert/strict');
const policy=import('../frontend/app/src/lib/availability.ts');
const v=(at)=>({verificationStatus:'approved',isAvailable:true,lastSeenAt:{toMillis:()=>at}});
test('availability uses the same five-minute and future-clock boundaries as dispatch',async()=>{
 const {availabilityState:s}=await policy,now=1000000;
 assert.equal(s(v(now-300000),true,false,now).ready,true);
 assert.equal(s(v(now-300001),true,false,now).kind,'stale');
 assert.equal(s(v(now+60000),true,false,now).ready,true);
 assert.equal(s(v(now+60001),true,false,now).kind,'stale');
 assert.equal(s({...v(now),lastSeenAt:undefined},true,false,now).kind,'stale');
});
test('cached/off/disconnected/unapproved snapshots never display ready',async()=>{
 const {availabilityState:s}=await policy,now=1000000;
 assert.equal(s(v(now),false,false,now).ready,false);
 assert.equal(s(v(now),true,true,now).kind,'disconnected');
 assert.equal(s({...v(now),isAvailable:false},true,false,now).kind,'off');
 assert.equal(s({...v(now),verificationStatus:'suspended'},true,false,now).kind,'unapproved');
 assert.equal(s({...v(now),activeIncidentId:'case'},true,false,now).kind,'assigned');
});
test('bad timestamps are stale and a new server timestamp restores readiness',async()=>{
 const {availabilityState:s}=await policy,now=1000000;
 for(const at of [NaN,Infinity])assert.equal(s(v(at),true,false,now).ready,false);
 assert.equal(s(v(now-360000),true,false,now).ready,false);
 assert.equal(s(v(now),true,false,now).ready,true);
});
