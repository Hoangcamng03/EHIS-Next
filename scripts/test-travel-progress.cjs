const {test}=require('node:test'),assert=require('node:assert/strict');
for(const client of ['app','web'])test(client+': acceptance, deadline, blocked and stale check-in remain distinct',async()=>{
 const {travelState}=await import('../frontend/'+client+'/src/lib/travel-progress.ts');const now=1000000;
 assert.equal(travelState(null,now,now).title,'TNV đã nhận · chưa xác nhận lên đường');assert.equal(travelState(null,now-180001,now).needsAttention,true);
 const going={state:'going',etaAtMs:now+60000,obstacle:null,updatedAtMs:now,checkInAtMs:now};assert.equal(travelState(going,now,now).needsAttention,false);
 assert.equal(travelState(going,now,now+60000).overdue,true);assert.equal(travelState({...going,checkInAtMs:now-180001},now,now).stale,true);
 assert.equal(travelState({...going,state:'blocked',etaAtMs:null},now,now).needsAttention,true);
 assert.equal(travelState({...going,checkInAtMs:now+60001},now,now).stale,true);
 assert.equal(travelState({...going,firstEtaAtMs:now-1},now,now).needsAttention,true,'changing ETA must not hide an overdue initial commitment');
});
