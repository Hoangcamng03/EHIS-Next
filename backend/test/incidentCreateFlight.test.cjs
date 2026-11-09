const {test}=require('node:test'),assert=require('node:assert/strict');
const {IncidentCreateFlight,IncidentCreateConflict,IncidentCreateBusy}=require('../lib/incidentCreateFlight');
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
test('eight identical in-flight requests execute one create; later retry reads again',async()=>{
 const f=new IncidentCreateFlight(),gate=deferred();let calls=0;
 const requests=Array.from({length:8},()=>f.run('user:request','same',async()=>{calls++;await gate.promise;return {incidentId:'one'};}));
 await Promise.resolve();assert.equal(calls,1);gate.resolve();const values=await Promise.all(requests);assert(values.every(x=>x.incidentId==='one'));assert.equal(calls,1);
 await f.run('user:request','same',async()=>{calls++;return {incidentId:'one'};});assert.equal(calls,2);
});
test('a changed payload cannot join an active request; another user remains independent',async()=>{
 const f=new IncidentCreateFlight(),gate=deferred();let changedRan=false;
 const first=f.run('user:request','one',()=>gate.promise);
 await assert.rejects(f.run('user:request','two',async()=>{changedRan=true;}),IncidentCreateConflict);
 assert.equal(await f.run('other:request','two',async()=>7),7);assert.equal(changedRan,false);gate.resolve();await first;
});
test('create failure is shared and the key is released for an explicit retry',async()=>{
 const f=new IncidentCreateFlight(),gate=deferred(),failure=Error('Firestore unavailable');let calls=0;
 const work=async()=>{calls++;await gate.promise;throw failure;};
 const results=Promise.allSettled([f.run('key','fp',work),f.run('key','fp',work)]);gate.resolve();assert((await results).every(x=>x.status==='rejected'&&x.reason===failure));assert.equal(calls,1);
 assert.equal(await f.run('key','fp',async()=>8),8);
});
test('capacity is bounded without rejecting duplicates or leaking completed keys',async()=>{
 const f=new IncidentCreateFlight(1),gate=deferred(),one=f.run('one','fp',()=>gate.promise),duplicate=f.run('one','fp',async()=>99);
 await assert.rejects(f.run('two','fp',async()=>3),IncidentCreateBusy);gate.resolve(2);assert.deepEqual(await Promise.all([one,duplicate]),[2,2]);assert.equal(await f.run('two','fp',async()=>3),3);
});
