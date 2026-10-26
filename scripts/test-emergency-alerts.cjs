const {test}=require('node:test'),assert=require('node:assert/strict');
const policy=import('../frontend/app/src/lib/alert-policy.ts');
const audio=import('../frontend/app/src/lib/emergency-audio.ts');
const offer=(values={})=>({incidentId:'synthetic-case',status:'offered',reportRevision:0,expiresAt:20000,...values});

test('expired or malformed invitation cannot appear actionable while awaiting maintenance',async()=>{
 const {invitationState}=await policy;
 for(const expiresAt of [10000,9999,undefined,NaN,Infinity]) assert.equal(invitationState(offer({expiresAt}),10000),'expired');
 assert.equal(invitationState(offer(),10000),'offered');
 assert.equal(invitationState(offer({status:'accepted',expiresAt:9999}),10000),'accepted');
});

test('new confirmed offer signals once; metadata/reconnect does not replay',async()=>{
 const {collectSignalEvents}=await policy,seen=new Map();
 assert.deepEqual(collectSignalEvents(seen,[offer()],10000),[{incidentId:'synthetic-case',kind:'request'}]);
 assert.deepEqual(collectSignalEvents(seen,[offer()],10001),[]);
 assert.deepEqual(collectSignalEvents(seen,[offer()],10002),[]);
});
test('supplement signals once per newer revision, including an assigned case',async()=>{
 const {collectSignalEvents}=await policy,seen=new Map();
 collectSignalEvents(seen,[offer()],10000);
 assert.equal(collectSignalEvents(seen,[offer({reportRevision:1})],10000)[0].kind,'update');
 assert.deepEqual(collectSignalEvents(seen,[offer({reportRevision:1})],10001),[]);
 assert.equal(collectSignalEvents(seen,[offer({status:'accepted',reportRevision:2})],10002)[0].kind,'update');
 assert.deepEqual(collectSignalEvents(seen,[offer({status:'accepted',reportRevision:1})],10003),[]);
});
test('expired, terminal and missing-expiry invitations cannot trigger a new alarm',async()=>{
 const {collectSignalEvents,activeOffer}=await policy;
 for(const alert of [offer({expiresAt:10000}),offer({expiresAt:undefined}),offer({status:'closed'}),offer({status:'completed'}),offer({status:'cancelled'})]){
  assert.equal(activeOffer(alert,10000),false);assert.deepEqual(collectSignalEvents(new Map(),[alert],10000),[]);
 }
 assert.deepEqual(collectSignalEvents(new Map(),[offer({status:'accepted'})],10000),[],'restoring an assigned case is not a new request');
});
test('simultaneous invitations remain independently deduplicated',async()=>{
 const {collectSignalEvents}=await policy,seen=new Map();
 assert.equal(collectSignalEvents(seen,[offer(),offer({incidentId:'second'})],10000).length,2);
 assert.deepEqual(collectSignalEvents(seen,[offer({incidentId:'second'}),offer()],10001),[]);
});
function fakeContext(state='running'){
 const nodes=[],values=[];
 const param={setValueAtTime(value){values.push(value);},linearRampToValueAtTime(value){values.push(value);}};
 return {nodes,values,state,currentTime:100,destination:{},createOscillator(){const n={frequency:param,connect(){},disconnect(){n.disconnected=true;},start(at){n.startAt=at;},stop(at){n.stopAt=at;n.stops=(n.stops||0)+1;}};nodes.push(n);return n;},createGain(){return {gain:param,connect(){},disconnect(){}};}};
}
test('request/update/test audio is finite and can be stopped immediately',async()=>{
 const {startAlertTone,signalDuration}=await audio;
 for(const kind of ['request','update','test']){
  const context=fakeContext(),stop=startAlertTone(context,kind);
  assert.ok(context.nodes.length>0);
  for(const node of context.nodes){assert.ok(node.stopAt<=100+signalDuration(kind));assert.ok(node.stopAt>node.startAt);}
  stop();assert.ok(context.nodes.every(n=>n.disconnected&&n.stops===2));
 }
 assert.equal(signalDuration('request'),6);assert.equal(signalDuration('update'),2);
});
test('suspended audio cannot pretend to play',async()=>{
 const {startAlertTone}=await audio,context=fakeContext('suspended');
 assert.throws(()=>startAlertTone(context,'request'),/audio-suspended/);assert.equal(context.nodes.length,0);
});
