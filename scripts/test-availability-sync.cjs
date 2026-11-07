const {test}=require('node:test'),assert=require('node:assert/strict');
test('stationary GPS samples keep the server heartbeat within 90 seconds without sending each sample',async()=>{
 const {shouldSyncAvailability}=await import('../frontend/app/src/lib/availability-sync.ts'),point={latitude:10,longitude:106};let last=null;const sent=[];
 for(let now=0;now<=360000;now+=30000)if(shouldSyncAvailability(last,point,now)){sent.push(now);last={point,at:now};}
 assert.deepEqual(sent,[0,90000,180000,270000,360000]);
});
test('moving 100 metres, foreground resume and explicit refresh must not wait for stationary throttle',async()=>{
 const {shouldSyncAvailability}=await import('../frontend/app/src/lib/availability-sync.ts'),last={point:{latitude:10,longitude:106},at:100000};
 assert.equal(shouldSyncAvailability(last,{latitude:10.002,longitude:106},100001),true);
 assert.equal(shouldSyncAvailability(last,last.point,100001,true),true);
 assert.equal(shouldSyncAvailability(last,last.point,99999),true);
 assert.equal(shouldSyncAvailability(last,last.point,189999),false);
});
