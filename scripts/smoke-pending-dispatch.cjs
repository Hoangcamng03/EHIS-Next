const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),{createRequire}=require('node:module');
const {assert,db,Timestamp,actor,volunteer,create,ok,api,randomUUID,batch}=require('./test-support/emulator.cjs');
const clientRequire=createRequire(path.resolve(__dirname,'../frontend/web/package.json')),sdk=clientRequire('firebase/firestore'),{initializeApp,deleteApp}=clientRequire('firebase/app'),authSdk=clientRequire('firebase/auth'),ts=require('../frontend/app/node_modules/typescript');
function load(file,requires){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,require:name=>{assert.ok(name in requires,name);return requires[name];}});return exports;}
async function main(){
 const point={latitude:-42,longitude:-90},v=await actor('late-volunteer');await volunteer(v,point,{isAvailable:false});
 const fixtures=[];await batch(Array.from({length:32},(_,i)=>i),async i=>{const patient=await actor('late-patient-'+i),reporter=await actor('late-reporter-'+i,true),c=await create(patient,reporter,point);assert.equal(c.invitedCount,0);fixtures.push({patient,reporter,...c});},4);
 const answers={responsiveness:'unresponsive',breathing:'unknown',bleeding:'none_seen'};await ok('submitBystanderReport',{incidentId:fixtures[0].incidentId,submissionId:randomUUID(),answers},fixtures[0].reporter);
 const extras=[];for(const kind of ['expired','cancelled','far']){const patient=await actor('late-'+kind),reporter=await actor('late-'+kind+'-r',true),c=await create(patient,reporter,kind==='far'?{latitude:20,longitude:0}:point);extras.push({kind,reporter,...c});if(kind==='expired')await db.doc('incidents/'+c.incidentId).update({offerExpiresAt:Timestamp.fromMillis(Date.now()-1000)});if(kind==='cancelled')await ok('finishIncident',{incidentId:c.incidentId,outcome:'cancelled'},reporter);}
 const history=db.batch();for(let i=0;i<35;i++)history.set(db.doc(`volunteers/${v.localId}/alerts/history-${randomUUID()}`),{incidentId:`history-${i}`,status:'completed',createdAt:Timestamp.fromMillis(Date.now()+1000+i),reportRevision:0,answers:null,distanceMeters:0});await history.commit();
 const app=initializeApp({projectId:'demo-ehis-next',apiKey:'demo-key',appId:'demo-app'},randomUUID()),auth=authSdk.getAuth(app),client=sdk.getFirestore(app);authSdk.connectAuthEmulator(auth,'http://127.0.0.1:9199',{disableWarnings:true});sdk.connectFirestoreEmulator(client,'127.0.0.1',8180);await authSdk.signInWithEmailAndPassword(auth,v.email,v.password);
 const merge=load('frontend/app/src/lib/alert-feed.ts',{}),watch=load('frontend/app/src/lib/subscribe-alerts.ts',{'firebase/firestore':sdk,'./alert-feed':merge});let state;
 const stop=watch.subscribeVolunteerAlerts(client,v.localId,null,value=>{state=value;});async function waitFor(fn){const end=Date.now()+15000;while(Date.now()<end){if(fn())return;await new Promise(r=>setTimeout(r,40));}throw Error('Late feed deadline: '+JSON.stringify({connected:state?.connected,count:state?.alerts?.length,error:state?.error?.code}));}
 try{
  await waitFor(()=>state?.connected);assert.equal(state.alerts.filter(a=>a.status==='offered').length,0);
  const start=performance.now(),result=await ok('setVolunteerAvailability',{available:true,location:point},v);assert.equal(result.matchedCount,32);
  await waitFor(()=>state?.connected&&state.alerts.filter(a=>a.status==='offered').length===32);const deliveryMs=Math.round(performance.now()-start);
  assert.ok(!state.overflow);assert.equal(state.alerts.length,62,'Thirty history entries plus all 32 older pending offers');
  const offered=state.alerts.find(a=>a.incidentId===fixtures[0].incidentId);assert.deepEqual(JSON.parse(JSON.stringify(offered.answers)),answers);assert.ok(!('phone' in offered));assert.ok(!('location' in offered));
  for(const e of extras)assert.ok(!(await db.doc(`volunteers/${v.localId}/alerts/${e.incidentId}`).get()).exists,e.kind);
  assert.equal((await ok('setVolunteerAvailability',{available:true,location:point},v)).matchedCount,0);
  await ok('setVolunteerAvailability',{available:false},v);assert.equal((await ok('setVolunteerAvailability',{available:true,location:point},v)).matchedCount,0);
  await ok('acceptIncident',{incidentId:fixtures[0].incidentId},v);assert.equal((await api('acceptIncident',{incidentId:fixtures[1].incidentId},v)).error.status,'FAILED_PRECONDITION');assert.equal((await api('getVolunteerIncidentDetails',{incidentId:fixtures[1].incidentId},v)).status,403);
  await ok('finishIncident',{incidentId:fixtures[0].incidentId,outcome:'completed'},v);
  await batch(fixtures.slice(1),f=>ok('finishIncident',{incidentId:f.incidentId,outcome:'cancelled'},f.reporter),4);
  for(const e of extras.filter(e=>e.kind!=='cancelled'))await ok('finishIncident',{incidentId:e.incidentId,outcome:'cancelled'},e.reporter);
  await waitFor(()=>state?.connected&&!state.alerts.some(a=>a.status==='offered'));
  // Join-versus-accept must either omit the late invitation or close it atomically.
  for(let i=0;i<3;i++){
   const racePoint={latitude:-43-i,longitude:-92},primary=await actor('late-primary'),late=await actor('late-racer'),patient=await actor('late-race-p'),reporter=await actor('late-race-r',true);
   await volunteer(primary,racePoint);await volunteer(late,racePoint,{isAvailable:false});const c=await create(patient,reporter,racePoint);
   await Promise.all([ok('acceptIncident',{incidentId:c.incidentId},primary),ok('setVolunteerAvailability',{available:true,location:racePoint},late)]);
   const invitation=await db.doc('volunteers/'+late.localId+'/alerts/'+c.incidentId).get();assert.ok(!invitation.exists||invitation.data().status==='closed');
   assert.equal((await api('getVolunteerIncidentDetails',{incidentId:c.incidentId},late)).status,403);
   await ok('finishIncident',{incidentId:c.incidentId,outcome:'completed'},primary);await ok('setVolunteerAvailability',{available:false},late);
  }
  const ids=Array.from({length:101},()=> 'qa-pending-capacity-'+randomUUID()),seed=db.batch();for(const id of ids)seed.set(db.doc('incidents/'+id),{status:'dispatching',offerExpiresAt:Timestamp.fromMillis(Date.now()+600000)});await seed.commit();
  try{const denied=await api('setVolunteerAvailability',{available:true,location:point},v);assert.equal(denied.error?.details?.reason,'pending-dispatch-capacity');assert.equal((await db.doc('volunteers/'+v.localId).get()).data().isAvailable,false);}
  finally{const cleanup=db.batch();for(const id of ids)cleanup.update(db.doc('incidents/'+id),{status:'cancelled'});await cleanup.commit();}
  fs.writeFileSync('.local/pending-dispatch-proof.json',JSON.stringify({scope:'LOCAL EMULATOR / synthetic only',status:'PASS',pendingBeforeOnline:32,lateInvitations:32,joinAcceptRaces:3,pendingCapacityDenial:101,newerHistory:35,serverFeedDeliveryMs:deliveryMs,checks:['off->on catch-up','all 32 behind history visible in real SDK','observations preserved; no phone/location leak','expired/cancelled/far excluded','repeat/reenable idempotent','one assignment only; private denied for other case','all closed invitations removed']},null,2)+'\n');
  console.log('PASS late readiness: 32 pending cases delivered via real SDK behind 35 newer history entries; expired/cancelled/far excluded; duplicate, assignment and privacy guards retained. Delivery '+deliveryMs+' ms local.');
 }finally{stop();await deleteApp(app);}
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
