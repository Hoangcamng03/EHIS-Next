const {test}=require('node:test'),assert=require('node:assert/strict');
const modulePromise=import('../frontend/app/src/lib/native-signal.ts');
function deferred(){let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};}
async function fixture(overrides={}){
 const {createNativeSignal}=await modulePromise, events=[],timers=[];
 const port={prepare:async()=>{},loaded:()=>true,active:()=>true,seek:async()=>{},play(){events.push('play');},pause(){events.push('pause');},haptic:async()=>{events.push('haptic');},later(fn,ms){const t={fn,ms};timers.push(t);return t;},clear(t){t.cancelled=true;},notify(v){events.push(v);},...overrides};
 return {signal:createNativeSignal(port),events,timers,port};
}
test('native alert is finite, stops immediately and never loops',async()=>{
 const {signal,events,timers}=await fixture();await signal.prepare();await signal.play(6);
 assert.ok(events.includes('play'));assert.equal(timers[0].ms,6000);signal.stop();assert.ok(timers[0].cancelled);
 assert.deepEqual(events.at(-1),{sounding:false});
});
test('mute while preparing prevents late ready or test tone',async()=>{
 const wait=deferred(),{signal,events}=await fixture({prepare:()=>wait.promise});
 const test=signal.test();signal.mute();const count=events.length;wait.resolve();await test;
 assert.equal(events.length,count);assert.ok(!events.includes('play'));assert.ok(!events.includes('haptic'));
});
test('late seek after mute, stop, background or disposal cannot restart tone',async()=>{
 for(const reason of ['mute','stop','dispose','background']){
  const wait=deferred();let active=true;const {signal,events}=await fixture({seek:()=>wait.promise,active:()=>active});
  await signal.prepare();const pending=signal.play(6);
  if(reason==='background')active=false;else signal[reason]();
  wait.resolve();await pending;assert.ok(!events.includes('play'),reason);
 }
});
test('muted alerts may haptic only when enabled; no background feedback',async()=>{
 const {signal,events,port}=await fixture();signal.mute();await signal.play(6);assert.ok(events.includes('haptic'));assert.ok(!events.includes('play'));
 events.length=0;signal.toggleVibration(false);await signal.play(6);assert.ok(!events.includes('haptic'));
 port.active=()=>false;await signal.play(6);assert.ok(!events.includes('play'));
});
test('failed/unloaded audio stays honest; React effect restart can reactivate',async()=>{
 const a=await fixture({loaded:()=>false});assert.equal(await a.signal.prepare(),false);await a.signal.play(6);assert.ok(!a.events.includes('play'));
 const b=await fixture();b.signal.dispose();b.signal.activate();await b.signal.test();assert.ok(b.events.includes('play'));
});

test('a first alert prepares itself if readiness happened before the asset loaded',async()=>{
 let loaded=false;const {signal,events}=await fixture({loaded:()=>loaded});
 assert.equal(await signal.prepare(),false);loaded=true;await signal.play(6);assert.ok(events.includes('play'));
});
test('arming readiness restores sound after a previous mute; stopping one tone does not mute future alerts',async()=>{
 const {signal,events}=await fixture();signal.mute();await signal.arm();await signal.play(6);signal.stop();await signal.play(6);
 assert.equal(events.filter(e=>e==='play').length,2);
});
