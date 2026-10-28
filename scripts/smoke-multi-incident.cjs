const fs=require('node:fs'),{createHash}=require('node:crypto');
const {assert,randomUUID,db,auth,Timestamp,req,actor,api,ok,card,volunteer,create,batch,direct,metrics,actors}=require('./test-support/emulator.cjs');
const cases=[],runId=randomUUID().slice(0,8),startedAt=new Date().toISOString();
let seededAuth=0;
async function scenario(id,fn){const start=performance.now();try{await fn();cases.push({id,status:'PASS',ms:Math.round(performance.now()-start)});console.log('PASS '+id);}catch(error){cases.push({id,status:'FAIL',ms:Math.round(performance.now()-start),error:error.message});console.error('FAIL '+id+': '+error.message);}}
async function close(id,reporter,winner){await ok('finishIncident',{incidentId:id,outcome:winner?'completed':'cancelled'},winner||reporter);}
async function fixture(point){const [patient,reporter,first,second]=await Promise.all([actor('patient'),actor('reporter',true),actor('v1'),actor('v2')]);await Promise.all([volunteer(first,point),volunteer(second,point)]);return {patient,reporter,first,second};}
async function main(){
 await scenario('GEO-101-near-volunteer-after-100-far-accounts',async()=>{
  const point={latitude:62,longitude:130},patient=await actor('many-patient'),reporter=await actor('many-reporter',true);
  const far=Array.from({length:110},(_,i)=>`000000-qa-${runId}-${String(i).padStart(3,'0')}`),near=`zzzzzz-qa-${runId}`;
  await batch([...far,near],async uid=>{await auth.createUser({uid,email:`${uid}@example.test`});seededAuth++;await volunteer({localId:uid},uid===near?point:{latitude:0,longitude:0});});
  let result;
  try{result=await create(patient,reporter,point);const data=(await db.doc(`incidents/${result.incidentId}`).get()).data();assert.deepEqual(data.invitedVolunteerIds,[near],'A nearby volunteer beyond the first 100 IDs must not disappear');}
  finally{if(result)await close(result.incidentId,reporter);await batch([...far,near],uid=>db.doc(`volunteers/${uid}`).update({isAvailable:false}));}
 });
 await scenario('ZONE-12-simultaneous-incidents-four-geographic-zones',async()=>{
  const points=[{latitude:-60,longitude:-150},{latitude:-20,longitude:-70},{latitude:30,longitude:40},{latitude:65,longitude:150}],zones=[];
  for(const point of points){const volunteers=await Promise.all(Array.from({length:4},()=>actor('zone-vol')));await Promise.all(volunteers.map(v=>volunteer(v,point)));const patients=await Promise.all(Array.from({length:3},()=>actor('zone-patient'))),reporters=await Promise.all(Array.from({length:3},()=>actor('zone-reporter',true)));zones.push({point,volunteers,patients,reporters});}
  const created=await Promise.all(zones.flatMap(z=>z.patients.map((p,i)=>create(p,z.reporters[i],z.point).then(c=>({...c,z,i})))));
  assert.equal(new Set(created.map(c=>c.incidentId)).size,12);
  for(const c of created){const d=(await db.doc(`incidents/${c.incidentId}`).get()).data();assert.equal(d.invitedVolunteerIds.length,4);assert.deepEqual(new Set(d.invitedVolunteerIds),new Set(c.z.volunteers.map(v=>v.localId)));}
  await Promise.all(created.map(c=>ok('acceptIncident',{incidentId:c.incidentId},c.z.volunteers[c.i])));
  for(const c of created){const v=c.z.volunteers[c.i];const details=await ok('getVolunteerIncidentDetails',{incidentId:c.incidentId},v);assert.deepEqual(details.location,c.z.point);assert.ok(details.patientProfile.fullName.endsWith(c.z.patients[c.i].localId.slice(0,6)));const outsider=zones[(zones.indexOf(c.z)+1)%4].volunteers[0];assert.equal((await api('getVolunteerIncidentDetails',{incidentId:c.incidentId},outsider)).status,403);await close(c.incidentId,c.z.reporters[c.i],v);}
  await batch(zones.flatMap(z=>z.volunteers),v=>db.doc(`volunteers/${v.localId}`).update({isAvailable:false}));
 });
 await scenario('RACE-6-reporters-scan-one-card',async()=>{
  const patient=await actor('race-patient'),reporters=await Promise.all(Array.from({length:6},()=>actor('race-reporter',true))),cardId=await card(patient);
  const results=await Promise.all(reporters.map(r=>api('createIncident',{cardId,requestId:randomUUID(),location:{latitude:72,longitude:-40}},r)));
  assert.equal(results.filter(r=>r.status===200).length,1);assert.equal(results.filter(r=>r.error?.status==='ALREADY_EXISTS').length,5);const index=results.findIndex(r=>r.status===200);await close(results[index].result.incidentId,reporters[index]);
 });
 await scenario('TOP5-closest-five-of-eight-volunteers',async()=>{
  const point={latitude:-35,longitude:60},patient=await actor('top5-patient'),reporter=await actor('top5-reporter',true),vs=await Promise.all(Array.from({length:8},()=>actor('top5-vol')));
  for(let i=0;i<vs.length;i++)await volunteer(vs[i],{latitude:point.latitude+(i+1)*.001,longitude:60});
  const c=await create(patient,reporter,point),d=(await db.doc(`incidents/${c.incidentId}`).get()).data();assert.deepEqual(d.invitedVolunteerIds,vs.slice(0,5).map(v=>v.localId));await close(c.incidentId,reporter);await batch(vs,v=>db.doc(`volunteers/${v.localId}`).update({isAvailable:false}));
 });
 await scenario('DATELINE-two-longitude-windows-and-invalid-latitude',async()=>{
  const point={latitude:0,longitude:180},patient=await actor('dateline-patient'),reporter=await actor('dateline-reporter',true),vs=await Promise.all(Array.from({length:3},()=>actor('dateline-vol')));
  for(let i=0;i<3;i++)await volunteer(vs[i],{latitude:0,longitude:[179.99,-179.99,179.95][i]});
  const c=await create(patient,reporter,point),d=(await db.doc(`incidents/${c.incidentId}`).get()).data();assert.deepEqual(new Set(d.invitedVolunteerIds),new Set(vs.slice(0,2).map(v=>v.localId)));await close(c.incidentId,reporter);
  assert.equal((await api('createIncident',{cardId:c.cardId,requestId:randomUUID(),location:{latitude:86,longitude:0}},reporter)).error.status,'INVALID_ARGUMENT');await batch(vs,v=>db.doc(`volunteers/${v.localId}`).update({isAvailable:false}));
 });
 await scenario('RETRY-8-lost-ack-replays-one-incident',async()=>{
  const patient=await actor('retry-patient'),reporter=await actor('retry-reporter',true),cardId=await card(patient),payload={cardId,requestId:randomUUID(),location:{latitude:72,longitude:60}};
  const result=await Promise.all(Array.from({length:8},()=>ok('createIncident',payload,reporter)));assert.equal(new Set(result.map(r=>r.incidentId)).size,1);assert.equal((await api('createIncident',{...payload,location:{latitude:71,longitude:60}},reporter)).error.status,'INVALID_ARGUMENT');await close(result[0].incidentId,reporter);assert.equal((await ok('createIncident',payload,reporter)).status,'cancelled');
 });
 await scenario('BUSY-one-volunteer-two-incidents-atomic-assignment',async()=>{
  const point={latitude:54,longitude:-20},f=await fixture(point),patient2=await actor('busy-patient2'),reporter2=await actor('busy-reporter2',true);
  const first=await create(f.patient,f.reporter,point),second=await create(patient2,reporter2,point),ids=[first.incidentId,second.incidentId];
  const results=await Promise.all(ids.map(incidentId=>api('acceptIncident',{incidentId},f.first)));assert.equal(results.filter(r=>r.status===200).length,1);const winner=results.findIndex(r=>r.status===200),remaining=1-winner;
  await ok('acceptIncident',{incidentId:ids[remaining]},f.second);assert.equal((await api('getVolunteerIncidentDetails',{incidentId:ids[remaining]},f.first)).status,403);assert.equal((await api('getVolunteerIncidentDetails',{incidentId:ids[winner]},f.second)).status,403);
  await close(ids[winner],null,f.first);await close(ids[remaining],null,f.second);
 });
 await scenario('BUSY-one-volunteer-three-distances-one-winner',async()=>{
  const v=await actor('three-cases-vol'),point={latitude:-45,longitude:100};await volunteer(v,point);
  const patients=await Promise.all(Array.from({length:3},()=>actor('three-patient'))),reporters=await Promise.all(Array.from({length:3},()=>actor('three-reporter',true)));
  const incidents=await Promise.all(patients.map((p,i)=>create(p,reporters[i],{latitude:point.latitude+[0.001,0.01,0.03][i],longitude:point.longitude})));
  const distances=[];for(const c of incidents){const a=(await db.doc(`volunteers/${v.localId}/alerts/${c.incidentId}`).get()).data();assert.equal(a.status,'offered');distances.push(a.distanceMeters);}assert(distances[0]>0&&distances[0]<distances[1]&&distances[1]<distances[2]&&distances[2]<5000);
  const results=await Promise.all(incidents.map(c=>api('acceptIncident',{incidentId:c.incidentId},v)));assert.equal(results.filter(r=>r.status===200).length,1);assert.equal(results.filter(r=>r.status===400).length,2);
  const winner=results.findIndex(r=>r.status===200);assert.equal((await db.doc(`volunteers/${v.localId}`).get()).data().activeIncidentId,incidents[winner].incidentId);
  for(let i=0;i<3;i++)if(i!==winner){assert.equal((await api('acceptIncident',{incidentId:incidents[i].incidentId},v)).status,400);assert.equal((await api('getVolunteerIncidentDetails',{incidentId:incidents[i].incidentId},v)).status,403);await close(incidents[i].incidentId,reporters[i]);}
  await close(incidents[winner].incidentId,null,v);
 });
 await scenario('CANCEL-accept-versus-reporter-cancel-three-races',async()=>{
  for(let i=0;i<3;i++){const point={latitude:45+i,longitude:-10},f=await fixture(point),c=await create(f.patient,f.reporter,point);await Promise.all([api('acceptIncident',{incidentId:c.incidentId},f.first),api('finishIncident',{incidentId:c.incidentId,outcome:'cancelled'},f.reporter)]);const d=(await db.doc(`incidents/${c.incidentId}`).get()).data(),v=(await db.doc(`volunteers/${f.first.localId}`).get()).data();assert.ok(['accepted','cancelled'].includes(d.status));if(d.status==='accepted'){assert.equal(d.acceptedBy,f.first.localId);assert.equal(v.activeIncidentId,c.incidentId);await close(c.incidentId,null,f.first);}else{assert.ok(!d.acceptedBy);assert.ok(!v.activeIncidentId);assert.equal((await db.doc(`cards/${c.cardId}`).get()).data().activeIncidentId,null);}await db.doc(`volunteers/${f.second.localId}`).update({isAvailable:false});}
 });
 await scenario('REVISION-concurrent-observations-and-location-updates',async()=>{
  const point={latitude:40,longitude:-100},f=await fixture(point),c=await create(f.patient,f.reporter,point);await ok('acceptIncident',{incidentId:c.incidentId},f.first);
  const updates=Array.from({length:3},(_,i)=>({incidentId:c.incidentId,updateId:randomUUID(),location:{latitude:40+i/1000,longitude:-100}})),reports=Array.from({length:3},()=>({incidentId:c.incidentId,submissionId:randomUUID(),answers:{responsiveness:'unknown',breathing:'unknown',bleeding:'unknown'}}));
  await Promise.all([...updates.map(p=>ok('updateIncidentLocation',p,f.reporter)),...reports.map(p=>ok('submitBystanderReport',p,f.reporter))]);
  const incident=(await db.doc(`incidents/${c.incidentId}`).get()).data(),details=await ok('getVolunteerIncidentDetails',{incidentId:c.incidentId},f.first);assert.equal(incident.reportRevision,6);assert.equal(incident.locationRevision,3);assert.equal(details.revision,6);assert.equal(details.locationRevision,3);assert.ok(updates.some(p=>JSON.stringify(p.location)===JSON.stringify(details.location)));assert.equal(details.phone,null);assert.ok(details.answers);
  await Promise.all([ok('updateIncidentLocation',updates[0],f.reporter),ok('submitBystanderReport',reports[0],f.reporter)]);assert.equal((await db.doc(`incidents/${c.incidentId}`).get()).data().reportRevision,6);await close(c.incidentId,null,f.first);await db.doc(`volunteers/${f.second.localId}`).update({isAvailable:false});
 });
 await scenario('ELIGIBILITY-near-far-stale-future-busy-offline-unapproved',async()=>{
  const point={latitude:-70,longitude:90},patient=await actor('filter-patient'),reporter=await actor('filter-reporter',true),eligible=await actor('eligible');await volunteer(eligible,{latitude:-70+4990/111194.9266,longitude:90});
  const invalid=[{location:{latitude:-70+5010/111194.9266,longitude:90}},{lastSeenAt:Timestamp.fromMillis(Date.now()-301000)},{lastSeenAt:Timestamp.fromMillis(Date.now()+120000)},{activeIncidentId:'another-case'},{isAvailable:false},{verificationStatus:'pending'},{location:{latitude:NaN,longitude:90}}];const others=await Promise.all(invalid.map(()=>actor('filter-invalid')));for(let i=0;i<others.length;i++)await volunteer(others[i],point,invalid[i]);await volunteer(patient,point);
  const c=await create(patient,reporter,point),d=(await db.doc(`incidents/${c.incidentId}`).get()).data();assert.deepEqual(d.invitedVolunteerIds,[eligible.localId]);await close(c.incidentId,reporter);await batch([eligible,patient,...others],v=>db.doc(`volunteers/${v.localId}`).update({isAvailable:false}));
 });
 await scenario('PRIVACY-cross-account-read-and-write-denied',async()=>{
  const owner=await actor('owner'),other=await actor('intruder'),point={latitude:15,longitude:-100};await volunteer(owner,point);await card(owner);
  for(const p of [`patients/${owner.localId}`,`volunteers/${owner.localId}`,`patientCards/${owner.localId}`]){assert.equal((await direct(p,other)).status,403);for(const method of ['PATCH','DELETE'])assert.equal((await direct(p,owner,method,method==='PATCH'?{fields:{admin:{booleanValue:true}}}:undefined)).status,403);}
  assert.equal((await direct(`users/${other.localId}`,other,'PATCH',{fields:{admin:{booleanValue:true}}})).status,403);await db.doc(`volunteers/${owner.localId}`).update({isAvailable:false});
 });
 await scenario('PURPOSE-registration-purpose-persists-without-role-grant',async()=>{
  const patient=await actor('purpose-p'),v=await actor('purpose-v');for(const [a,purpose] of [[patient,'patient'],[v,'volunteer']]){await ok('setAccountPurpose',{purpose},a);await ok('setAccountPurpose',{purpose},a);const access=await ok('getMyAccess',{},a);assert.equal(access.accountPurpose,purpose);assert.equal(access.isVerifiedVolunteer,false);assert.equal(access.isAdmin,false);assert.equal((await api('setAccountPurpose',{purpose:purpose==='patient'?'volunteer':'patient'},a)).error.status,'FAILED_PRECONDITION');}assert.equal((await api('getMyAccess',{}, {idToken:'invalid-token'})).status,401);
 });
 await scenario('NAT-shared-network-budget-atomic-across-five-users',async()=>{
  const minute=Math.floor(Date.now()/60000),ip='synthetic-nat-'+runId,key=createHash('sha256').update(`ip:${ip}:${minute}`).digest('hex');await db.doc(`_requestLimits/${key}`).set({count:598,expiresAt:Timestamp.fromMillis(Date.now()+60000)});
  const {enforceRequestBudget}=req('./lib/guards');const results=await Promise.allSettled(Array.from({length:5},(_,i)=>enforceRequestBudget(`nat-${runId}-${i}`,'getMyAccess',ip)));assert.equal(results.filter(r=>r.status==='fulfilled').length,2);assert.equal(results.filter(r=>r.status==='rejected'&&r.reason.code==='resource-exhausted').length,3);
 });
 await scenario('CAPACITY-no-silent-truncation-or-partial-incident',async()=>{
  const ids=Array.from({length:1001},(_,i)=>`qa-capacity-${runId}-${i}`);await batch(ids,uid=>volunteer({localId:uid},{latitude:80,longitude:10}),20);const patient=await actor('cap-patient'),reporter=await actor('cap-reporter',true),cardId=await card(patient);
  try{const r=await api('createIncident',{cardId,requestId:randomUUID(),location:{latitude:80,longitude:10}},reporter);assert.equal(r.error?.status,'RESOURCE_EXHAUSTED');assert.equal(r.error?.details?.reason,'dispatch-capacity');assert.ok(!(await db.doc(`cards/${cardId}`).get()).data().activeIncidentId);}
  finally{await batch(ids,uid=>db.doc(`volunteers/${uid}`).update({isAvailable:false}),20);}
 });
 const operations={};for(const m of metrics){(operations[m.operation]??=[]).push(m.ms);}const latency={};for(const [name,values] of Object.entries(operations)){values.sort((a,b)=>a-b);latency[name]={count:values.length,p50Ms:values[Math.ceil(values.length*.5)-1],p95Ms:values[Math.ceil(values.length*.95)-1],maxMs:values.at(-1)};}
 const report={environment:'LOCAL EMULATOR ONLY — not cloud/device/SLA',projectId:'demo-ehis-next',runId,startedAt,endedAt:new Date().toISOString(),authenticatedAccounts:actors.length+seededAuth,apiCalls:metrics.length,cases,latency};fs.mkdirSync('.local',{recursive:true});fs.writeFileSync('.local/multi-acceptance.json',JSON.stringify(report,null,2));console.log(JSON.stringify({cases:cases.length,passed:cases.filter(c=>c.status==='PASS').length,failed:cases.filter(c=>c.status==='FAIL').map(c=>c.id),accounts:report.authenticatedAccounts,apiCalls:metrics.length}));if(cases.some(c=>c.status==='FAIL'))process.exitCode=1;
}
main().catch(error=>{console.error(error);process.exitCode=1;});
