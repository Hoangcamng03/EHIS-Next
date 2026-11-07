// Actual Emulator Auth, callable HTTP, Firestore transactions and cleanup. Synthetic data only.
const {assert,actor,auth,db,ok,api,card,volunteer,randomUUID,req,Timestamp}=require('./test-support/emulator.cjs');
const fs=require('node:fs');
(async()=>{
 const startedAt=new Date().toISOString(),admin=await actor('improve-admin'),p=await actor('improve-p'),r=await actor('improve-r',true),other=await actor('improve-other'),a=await actor('improve-a'),b=await actor('improve-b'),c=await actor('improve-c'),far=await actor('improve-far');
 await auth.setCustomUserClaims(admin.localId,{admin:true});const login=await fetch('http://127.0.0.1:9199/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-key',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:admin.email,password:admin.password,returnSecureToken:true})});assert.equal(login.status,200);Object.assign(admin,await login.json());
 for(const name of ['listHandoverHistory','listHandoverCases','listHandoverCandidates','proposeIncidentHandover','cancelIncidentHandover','runMaintenanceNow']){assert.equal((await api(name,{},other)).status,403);assert.equal((await api(name,{},null)).status,401);}
 const point={latitude:-37,longitude:47};for(const [v,name]of [[a,'A GIẢ'],[b,'B GIẢ'],[c,'C GIẢ']])await volunteer(v,point,{fullName:name,serviceArea:'improvement-fixtures'});await volunteer(far,{latitude:-27,longitude:47});
 const cardId=await card(p),incident=await ok('createIncident',{cardId,requestId:randomUUID(),location:point},r),incidentId=incident.incidentId;
 const answers={responsiveness:'unknown',breathing:'unknown',bleeding:'unknown'},payload={incidentId,submissionId:randomUUID(),phone:'0900000000',answers,meetingNote:'Cổng GIẢ, tầng 2',expectedRevision:0};
 await ok('submitBystanderReport',payload,r);assert.equal((await ok('submitBystanderReport',payload,r)).revision,1,'lost-ack retry must work with old expectedRevision');
 const restored=await ok('getBystanderReport',{incidentId},r);assert.equal(restored.phone,payload.phone);assert.equal(restored.meetingNote,payload.meetingNote);assert.deepEqual(restored.answers,answers);assert.equal(restored.revision,1);assert(!('location'in restored));
 assert.equal((await api('getBystanderReport',{incidentId},other)).status,403);assert.equal((await api('getBystanderReport',{incidentId,uid:r.localId},r)).status,400);
 assert.equal((await api('submitBystanderReport',{...payload,submissionId:randomUUID()},r)).status,400,'stale report update rejected');
 await ok('acceptIncident',{incidentId},a);
 await db.doc(`volunteers/${b.localId}`).update({lastSeenAt:Timestamp.fromMillis(Date.now()-360000)});
 const roster=await ok('listVolunteerRoster',{serviceArea:'improvement-fixtures'},admin),stale=roster.volunteers.find(v=>v.uid===b.localId);assert(stale);assert.equal(stale.isAvailable,true);assert.equal(stale.locationFresh,false);assert.equal(stale.readyForDispatch,false);
 await ok('setVolunteerAvailability',{available:true,location:point},b);
 const candidates=await ok('listHandoverCandidates',{incidentId},admin);assert(candidates.candidates.some(v=>v.uid===b.localId));assert(!candidates.candidates.some(v=>[a.localId,far.localId].includes(v.uid)));
 const proposal={incidentId,targetUid:b.localId,requestId:randomUUID(),reason:'TNV A GIẢ không thể tiếp tục diễn tập'};
 await ok('proposeIncidentHandover',proposal,admin);await ok('proposeIncidentHandover',proposal,admin);
 const recovery=await ok('registerVolunteerDevice',{token:'synthetic-handover-recovery-token',enabled:true},b);assert.equal(recovery.recoveryQueued,1);
 const recoveredJobs=await db.collection('pushJobs').where('incidentId','==',incidentId).get();assert(recoveredJobs.docs.some(d=>d.data().deviceKey&&d.data().handoverId===proposal.requestId));
 assert.equal((await api('proposeIncidentHandover',{...proposal,reason:'Different content'},admin)).status,400);
 assert.equal((await api('proposeIncidentHandover',{...proposal,requestId:randomUUID()},admin)).status,400);
 await ok('getVolunteerIncidentDetails',{incidentId},a);assert.equal((await api('getVolunteerIncidentDetails',{incidentId},b)).status,403);assert.equal((await db.doc(`incidents/${incidentId}`).get()).data().acceptedBy,a.localId);
 await ok('submitBystanderReport',{...payload,submissionId:randomUUID(),expectedRevision:1,meetingNote:'Cổng GIẢ mới'},r);
 assert.equal((await db.doc(`volunteers/${b.localId}/alerts/${incidentId}`).get()).data().reportRevision,2);
 assert.equal((await api('acceptIncidentHandover',{incidentId,handoverId:proposal.requestId},c)).status,403);assert.equal((await api('acceptIncident',{incidentId},b)).status,400,'old APK endpoint must not silently accept transfer');
 const accepted=await Promise.all([ok('acceptIncidentHandover',{incidentId,handoverId:proposal.requestId},b),ok('acceptIncidentHandover',{incidentId,handoverId:proposal.requestId},b)]);assert.equal(accepted.length,2);
 assert.equal((await db.doc(`volunteers/${a.localId}`).get()).data().activeIncidentId,null);assert.equal((await db.doc(`volunteers/${b.localId}`).get()).data().activeIncidentId,incidentId);
 assert.equal((await api('getVolunteerIncidentDetails',{incidentId},a)).status,403);assert.equal((await ok('getVolunteerIncidentDetails',{incidentId},b)).meetingNote,'Cổng GIẢ mới');assert.equal((await api('finishIncident',{incidentId,outcome:'completed'},a)).status,403);
 const proposal2={incidentId,targetUid:c.localId,requestId:randomUUID(),reason:'TNV B GIẢ đề nghị thay người trong diễn tập'};
 await ok('proposeIncidentHandover',proposal2,admin);await ok('cancelIncidentHandover',{incidentId,handoverId:proposal2.requestId},admin);await ok('cancelIncidentHandover',{incidentId,handoverId:proposal2.requestId},admin);
 assert.equal((await api('acceptIncidentHandover',{incidentId,handoverId:proposal2.requestId},c)).status,400);await ok('getVolunteerIncidentDetails',{incidentId},b);
 const proposal3={...proposal2,requestId:randomUUID()};await ok('proposeIncidentHandover',proposal3,admin);
 const p2=await actor('improve-p2'),r2=await actor('improve-r2',true),case2=await ok('createIncident',{cardId:await card(p2),requestId:randomUUID(),location:point},r2);await ok('acceptIncident',{incidentId:case2.incidentId},c);
 assert.equal((await api('acceptIncidentHandover',{incidentId,handoverId:proposal3.requestId},c)).status,400,'one case per volunteer even after proposing a transfer');await ok('getVolunteerIncidentDetails',{incidentId},b);
 await ok('finishIncident',{incidentId:case2.incidentId,outcome:'completed'},c);await ok('setVolunteerAvailability',{available:true,location:point},c);
 // Expired timestamps are explicit fixtures, not a claim that five real minutes elapsed.
 await db.doc(`incidents/${incidentId}/handoverRequests/${proposal3.requestId}`).update({expiresAt:Timestamp.fromMillis(Date.now()-1)});await db.doc(`incidents/${incidentId}`).update({'handover.expiresAt':Timestamp.fromMillis(Date.now()-1)});
 assert.equal((await api('acceptIncidentHandover',{incidentId,handoverId:proposal3.requestId},c)).status,400);await ok('getVolunteerIncidentDetails',{incidentId},b);
 const proposal4={...proposal2,requestId:randomUUID()};await ok('proposeIncidentHandover',proposal4,admin);
 const race=await Promise.all([api('acceptIncidentHandover',{incidentId,handoverId:proposal4.requestId},c),api('finishIncident',{incidentId,outcome:'completed'},b)]),end=(await db.doc(`incidents/${incidentId}`).get()).data();
 if(end.status==='accepted'){assert.equal(end.acceptedBy,c.localId);assert.equal(race[0].status,200);assert.equal(race[1].status,403);await ok('finishIncident',{incidentId,outcome:'completed'},c);}else{assert.equal(end.status,'completed');assert.equal(race[1].status,200);assert.equal(race[0].status,400);}
 assert.equal((await api('getBystanderReport',{incidentId},r)).status,400);assert.equal((await db.doc(`cards/${cardId}`).get()).data().activeIncidentId,null);
 const history=await ok('listHandoverHistory',{incidentId},admin);assert.equal(history.history.length,4);assert(history.history.some(h=>h.reason===proposal.reason&&h.status==='accepted'));assert(history.history.some(h=>h.status==='cancelled'));assert.equal((await api('listHandoverHistory',{incidentId},b)).status,403);
 const audit=await db.collection('auditLogs').where('incidentId','==',incidentId).get();for(const action of ['incident-accepted','handover-proposed','handover-accepted','handover-cancelled','incident-private-read'])assert(audit.docs.some(d=>d.data().action===action));assert(!JSON.stringify(audit.docs.map(d=>d.data())).includes(payload.phone));
 // More than one old page for every maintenance queue; all documents are synthetic fixtures.
 const prefix='drain-'+randomUUID(),now=Date.now(),writes=[];for(let n=0;n<65;n++){const ref=db.doc(`incidents/${prefix}-purge-${n}`);writes.push([ref,{status:'completed',purgeAfter:Timestamp.fromMillis(now-1000),invitedVolunteerIds:[]}],[ref.collection('private').doc('reporter'),{phone:'0900000000'}]);}
 for(let n=0;n<75;n++){const id=prefix+'-expire-'+n;writes.push([db.doc(`incidents/${id}`),{status:'dispatching',patientId:prefix,reporterUid:prefix,cardId:id,invitedVolunteerIds:[],offerExpiresAt:Timestamp.fromMillis(now-1000)}],[db.doc(`cards/${id}`),{activeIncidentId:id}],[db.doc(`reporters/${prefix}/incidentStatuses/${id}`),{status:'dispatching'}]);}
 for(let n=0;n<450;n++){writes.push([db.doc(`_requestLimits/${prefix}-${n}`),{count:1,expiresAt:Timestamp.fromMillis(now-1000)}],[db.doc(`pushJobs/${prefix}-${n}`),{purgeAfter:Timestamp.fromMillis(now-1000),status:'expired'}]);}
 const protectedRef=db.doc(`incidents/${prefix}-protected`);writes.push([protectedRef,{status:'accepted',purgeAfter:Timestamp.fromMillis(now-2000)}],[protectedRef.collection('private').doc('reporter'),{phone:'0900000000'}]);
 for(let i=0;i<writes.length;i+=400){const batch=db.batch();for(const [ref,value]of writes.slice(i,i+400))batch.set(ref,value);await batch.commit();}
 await db.doc('_operations/maintenanceLease').set({owner:'explicit-test-fixture',until:Date.now()+60000});assert.equal((await ok('runMaintenanceNow',{},admin)).status,'busy');await db.doc('_operations/maintenanceLease').delete();
 const result=await ok('runMaintenanceNow',{},admin);assert(result.expired>=75);assert(result.purged>=65);assert(result.counters>=450);assert(result.pushJobs>=450);assert.equal(result.status,'complete');assert.equal((await protectedRef.collection('private').doc('reporter').get()).exists,true);
 assert.equal((await db.doc(`incidents/${prefix}-purge-64/private/reporter`).get()).exists,false);assert.equal((await db.doc(`incidents/${prefix}-expire-74`).get()).data().status,'expired');assert.equal((await db.doc(`_requestLimits/${prefix}-449`).get()).exists,false);
 await protectedRef.collection('private').doc('reporter').delete();await protectedRef.delete();
 const proof={status:'PASS',startedAt,endedAt:new Date().toISOString(),scope:'Real local Emulator execution with synthetic accounts/documents. No FCM delivery or phone behaviour simulated.',checks:['admin-only handover and maintenance','owner-only report restore and stale revision rejection with idempotent retry','admin GPS freshness','GPS/radius candidate selection','old owner remains until target accepts','duplicate accepts and private access transfer','cancel, expiry fixture and busy recipient','accept versus close race','75 expired / 65 purge / 450 counters / 450 push fixtures drained; active protected'],maintenance:result,raceStatuses:race.map(r=>r.status)};fs.writeFileSync('.local/improvements-proof.json',JSON.stringify(proof,null,2));console.log(JSON.stringify(proof));await db.terminate();
})().catch(e=>{console.error(e);process.exitCode=1;});
