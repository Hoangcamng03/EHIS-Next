const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),{createRequire}=require('node:module');
const {assert,db,Timestamp,actor,volunteer,create,ok,api,randomUUID}=require('./test-support/emulator.cjs');
const clientRequire=createRequire(path.resolve(__dirname,'../web/package.json')),sdk=clientRequire('firebase/firestore'),{initializeApp,deleteApp}=clientRequire('firebase/app'),authSdk=clientRequire('firebase/auth');
const ts=require('../mobile/node_modules/typescript');
function load(file,requires){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,require:name=>{assert.ok(name in requires,name);return requires[name];}});return exports;}
async function main(){
 const point={latitude:58,longitude:100},patient=await actor('active-patient'),reporter=await actor('active-reporter',true),v=await actor('active-volunteer');await volunteer(v,point);const c=await create(patient,reporter,point);await ok('acceptIncident',{incidentId:c.incidentId},v);
 // Thirty-five newer historical alerts must not make a real assigned incident disappear.
 const batch=db.batch();for(let i=0;i<35;i++)batch.set(db.doc(`volunteers/${v.localId}/alerts/history-${randomUUID()}`),{incidentId:`history-${i}`,status:'completed',createdAt:Timestamp.fromMillis(Date.now()+1000+i),reportRevision:0,answers:null,distanceMeters:0});await batch.commit();
 const app=initializeApp({projectId:'demo-ehis-next',apiKey:'demo-key',appId:'demo-app'},randomUUID()),auth=authSdk.getAuth(app),client=sdk.getFirestore(app);
 authSdk.connectAuthEmulator(auth,'http://127.0.0.1:9199',{disableWarnings:true});sdk.connectFirestoreEmulator(client,'127.0.0.1',8180);await authSdk.signInWithEmailAndPassword(auth,v.email,v.password);
 const page=await sdk.getDocs(sdk.query(sdk.collection(client,`volunteers/${v.localId}/alerts`),sdk.orderBy('createdAt','desc'),sdk.limit(30)));assert.equal(page.size,30);assert.ok(!page.docs.some(d=>d.id===c.incidentId),'Regression setup must actually exclude active case from first page');
 const merge=load('mobile/src/lib/alert-feed.ts',{}),watch=load('mobile/src/lib/subscribe-alerts.ts',{'firebase/firestore':sdk,'./alert-feed':merge});let state;const transitions=[];
 const stop=watch.subscribeVolunteerAlerts(client,v.localId,c.incidentId,value=>{state=value;transitions.push({connected:value.connected,error:value.error?.code,revision:value.alerts.find(a=>a.incidentId===c.incidentId)?.reportRevision,count:value.alerts.length});});
 async function waitFor(predicate){const end=Date.now()+15000;while(Date.now()<end){if(predicate())return;await new Promise(r=>setTimeout(r,40));}throw Error('Realtime feed did not reach expected state: '+JSON.stringify(transitions.slice(-8)));}
 try{
  await waitFor(()=>state?.connected&&state.alerts.some(a=>a.incidentId===c.incidentId));assert.equal(state.alerts.length,31);
  await sdk.disableNetwork(client);await waitFor(()=>state&&!state.connected);
  await ok('submitBystanderReport',{incidentId:c.incidentId,submissionId:randomUUID(),answers:{responsiveness:'unknown',breathing:'unknown',bleeding:'unknown'}},reporter);
  await sdk.enableNetwork(client);await waitFor(()=>state?.connected&&state.alerts.some(a=>a.incidentId===c.incidentId&&a.reportRevision===1));
  await db.doc(`volunteers/${v.localId}`).update({verificationStatus:'revoked'});await waitFor(()=>state?.error&&!state.connected&&state.alerts.length===0);assert.equal((await api('getVolunteerIncidentDetails',{incidentId:c.incidentId},v)).status,403);
  await db.doc(`volunteers/${v.localId}`).update({verificationStatus:'approved'});await ok('finishIncident',{incidentId:c.incidentId,outcome:'completed'},v);
  console.log('PASS active feed: real SDK first page excludes assigned case, separate owner listener keeps it, network pause disables actions, reconnect gets newer revision, revocation clears data and blocks API.');
 }finally{stop();await deleteApp(app);}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
