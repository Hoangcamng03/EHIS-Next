// Actual Auth/Firestore/HTTP execution. Receipt fixtures test persistence/selection only, never FCM delivery.
const {assert,actor,auth,db,ok,api,card,volunteer,randomUUID,req}=require('./test-support/emulator.cjs');
const fs=require('node:fs');
(async()=>{
 const startedAt=new Date().toISOString(),admin=await actor('ops-admin'),p=await actor('ops-p'),r=await actor('ops-r',true),v=await actor('ops-v'),other=await actor('ops-other');
 await auth.setCustomUserClaims(admin.localId,{admin:true});
 const login=await fetch('http://127.0.0.1:9199/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-key',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:admin.email,password:admin.password,returnSecureToken:true})});assert.equal(login.status,200);Object.assign(admin,await login.json());
 for(const name of ['getOperationsOverview','retryPendingNotifications']){assert.equal((await api(name,{},p)).status,403);assert.equal((await api(name,{extra:true},admin)).status,400);assert.equal((await api(name,{},null)).status,401);}
 const before=await ok('getOperationsOverview',{},admin),point={latitude:-64,longitude:40};await volunteer(v,point);
 const c=await ok('createIncident',{cardId:await card(p),requestId:randomUUID(),location:point},r);
 const payload={incidentId:c.incidentId,submissionId:randomUUID(),answers:{responsiveness:'unknown',breathing:'unknown',bleeding:'unknown'},meetingNote:'Cổng B GIẢ, tầng 2, cạnh cầu thang GIẢ'};
 await ok('submitBystanderReport',payload,r);assert.equal((await api('submitBystanderReport',{...payload,meetingNote:'Changed'},r)).status,400);
 assert.equal((await api('submitBystanderReport',{...payload,submissionId:randomUUID()},other)).status,403);
 assert.equal((await api('submitBystanderReport',{...payload,submissionId:randomUUID(),meetingNote:'x'.repeat(241)},r)).status,400);
 const alerts=await db.doc(`volunteers/${v.localId}/alerts/${c.incidentId}`).get();assert(!JSON.stringify(alerts.data()).includes('meetingNote'));
 const jobs=await db.collection('pushJobs').where('incidentId','==',c.incidentId).get();assert(!JSON.stringify(jobs.docs.map(d=>d.data())).includes(payload.meetingNote));
 const overview=await ok('getOperationsOverview',{},admin);assert.equal(overview.counts.dispatching,before.counts.dispatching+1);assert.equal(overview.pushEnabled,false);assert.ok(overview.oldestWaiting.length<=5);for(const forbidden of ['phone','patientProfile','latitude',payload.meetingNote])assert(!JSON.stringify(overview).includes(forbidden));
 assert.deepEqual(await ok('retryPendingNotifications',{},admin),{skipped:true});
 assert.equal((await api('getVolunteerIncidentDetails',{incidentId:c.incidentId},v)).status,403);
 await ok('acceptIncident',{incidentId:c.incidentId},v);assert.equal((await ok('getVolunteerIncidentDetails',{incidentId:c.incidentId},v)).meetingNote,payload.meetingNote);
 await ok('submitBystanderReport',{...payload,submissionId:randomUUID(),answers:{responsiveness:'unresponsive',breathing:'abnormal',breathingDetail:'gasping',bleeding:'visible',bleedingDetail:'heavy'}},r);
 await ok('submitBystanderReport',{incidentId:c.incidentId,submissionId:randomUUID(),answers:payload.answers},r);assert.equal((await ok('getVolunteerIncidentDetails',{incidentId:c.incidentId},v)).meetingNote,payload.meetingNote,'Legacy payload must preserve existing note');
 assert.deepEqual((await ok('getVolunteerIncidentDetails',{incidentId:c.incidentId},v)).answers,payload.answers,'New observation replaces nested answer fields; no stale symptoms retained');
 await ok('submitBystanderReport',{...payload,submissionId:randomUUID(),meetingNote:''},r);assert.equal((await ok('getVolunteerIncidentDetails',{incidentId:c.incidentId},v)).meetingNote,'');
 // These receipts are synthetic fixture states, not evidence that FCM accepted/delivered anything.
 const {recordPushDeviceResult}=req('./lib/pushJobs'),{pushDeviceKey,pendingPushDevices}=req('./lib/pushDelivery'),job=jobs.docs[0].ref,now=Date.now();
 await job.update({leaseOwner:'fixture-owner-A',status:'pending'});
 assert.equal(await recordPushDeviceResult(db,job.id,'fixture-owner-A',{key:pushDeviceKey('synthetic-fixture-A'),status:'accepted',at:now}),true);
 const receipts=(await job.get()).data().deviceResults;assert.deepEqual(pendingPushDevices([{token:'synthetic-fixture-A',updatedAt:now},{token:'synthetic-fixture-B',updatedAt:now}],receipts,now).map(d=>d.token),['synthetic-fixture-B']);
 await job.update({leaseOwner:'fixture-owner-B'});assert.equal(await recordPushDeviceResult(db,job.id,'fixture-owner-A',{key:pushDeviceKey('stale-worker-token'),status:'accepted',at:now}),false);
 await Promise.all(['B','C'].map(key=>recordPushDeviceResult(db,job.id,'fixture-owner-B',{key:pushDeviceKey('synthetic-fixture-'+key),status:'invalid-token',at:now})));
 const stored=(await job.get()).data();assert.equal(stored.deviceResults.length,3);assert(!JSON.stringify(stored).includes('synthetic-fixture-'));
 await job.update({status:'obsolete'});assert.equal(await recordPushDeviceResult(db,job.id,'fixture-owner-B',{key:pushDeviceKey('closed-job-token'),status:'accepted',at:now}),false);
 await ok('finishIncident',{incidentId:c.incidentId,outcome:'completed'},v);assert.equal((await api('getVolunteerIncidentDetails',{incidentId:c.incidentId},v)).status,403);
 // Real production query against Emulator: expired fixtures must not starve valid notifications.
 const {eligiblePushJobs}=req('./lib/pushJobs'),{Timestamp}=req('firebase-admin/firestore'),batch=db.batch(),prefix='ops-queue-'+randomUUID();
 for(let n=0;n<25;n++)batch.set(db.doc(`pushJobs/${prefix}-expired-${n}`),{status:'pending',leaseUntil:-100,expiresAt:Timestamp.fromMillis(now-1000)});
 for(let n=0;n<2;n++)batch.set(db.doc(`pushJobs/${prefix}-valid-${n}`),{status:'pending',leaseUntil:-50,expiresAt:Timestamp.fromMillis(now+60000)});
 batch.set(db.doc(`pushJobs/${prefix}-leased`),{status:'pending',leaseUntil:now+60000,expiresAt:Timestamp.fromMillis(now+60000)});await batch.commit();
 const selected=await eligiblePushJobs(db,now).get(),ids=selected.docs.map(d=>d.id);for(let n=0;n<2;n++)assert(ids.includes(`${prefix}-valid-${n}`));assert(!ids.some(id=>id.startsWith(prefix+'-expired-')||id===prefix+'-leased'));assert(selected.size<=20);
 const cleanup=db.batch();for(let n=0;n<25;n++)cleanup.delete(db.doc(`pushJobs/${prefix}-expired-${n}`));for(let n=0;n<2;n++)cleanup.delete(db.doc(`pushJobs/${prefix}-valid-${n}`));cleanup.delete(db.doc(`pushJobs/${prefix}-leased`));await cleanup.commit();
 const result={status:'PASS',startedAt,endedAt:new Date().toISOString(),scope:'LOCAL EMULATOR ONLY; no FCM send or phone delivery simulated',checks:['admin-only aggregate overview and bounded list','no private fields in overview/offers/push','optional meeting note validation/ownership/idempotency','legacy note preservation and explicit clear','one assignment/private access closed after completion','real Firestore receipt transactions with synthetic fixtures','stale worker fencing','concurrent receipt merge','receipt-based selection excludes already-recorded targets','25 expired jobs cannot starve valid jobs; active leases excluded']};
 fs.writeFileSync('.local/operations-proof.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));await db.terminate();
})().catch(e=>{console.error(e);process.exitCode=1;});
