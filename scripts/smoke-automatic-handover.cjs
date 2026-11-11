// Actual local Auth/API/Firestore transactions; all actors/locations are synthetic.
const {assert,actor,db,api,ok,card,volunteer,randomUUID,Timestamp,auth}=require('./test-support/emulator.cjs');
(async()=>{
 const [owner,b,c,late,far,stale,patient,reporter]=await Promise.all(Array.from({length:8},(_,i)=>actor('auto-handover-'+i)));
 const point={latitude:-39,longitude:158};
 for(const v of [owner,b,c])await volunteer(v,point);
 await volunteer(far,{latitude:-38,longitude:158});await volunteer(stale,point);
 await db.doc('volunteers/'+stale.localId).update({lastSeenAt:Timestamp.fromMillis(Date.now()-360000)});
 const id=(await ok('createIncident',{cardId:await card(patient),requestId:randomUUID(),location:point},reporter)).incidentId;
 await ok('acceptIncident',{incidentId:id},owner);
 const details=await ok('getVolunteerIncidentDetails',{incidentId:id},owner);
 const request={incidentId:id,assignmentAtMs:details.assignmentAtMs,updateId:randomUUID(),action:'blocked',obstacle:'cannot_continue',expectedProgressRevision:0};
 assert.equal((await api('updateIncidentProgress',request,b)).status,403);
 const replies=await Promise.all(Array.from({length:4},()=>ok('updateIncidentProgress',request,owner)));
 assert(replies.every(x=>x.progress.handoverInvitedCount===2));
 let incident=(await db.doc('incidents/'+id).get()).data();
 assert.equal(incident.status,'accepted');assert.equal(incident.acceptedBy,owner.localId);
 assert.deepEqual([...incident.handover.targetUids].sort(),[b.localId,c.localId].sort());
 assert.equal((await db.collection('incidents/'+id+'/handoverRequests').get()).size,1,'Lost ack must not create duplicate proposals');
 for(const v of [b,c]){const a=(await db.doc('volunteers/'+v.localId+'/alerts/'+id).get()).data();assert.equal(a.offerKind,'handover');assert.equal(a.handoverId,request.updateId);assert.equal(a.status,'offered');assert.equal((await api('getVolunteerIncidentDetails',{incidentId:id},v)).status,403);}
 assert.equal((await db.doc('reporters/'+reporter.localId+'/incidentStatuses/'+id).get()).data().handoverPending,true);
 assert.equal((await api('updateIncidentProgress',{incidentId:id,assignmentAtMs:details.assignmentAtMs,updateId:randomUUID(),action:'going',etaMinutes:10,expectedProgressRevision:1},owner)).status,400);
 const race=await Promise.all([b,c].map(v=>api('acceptIncidentHandover',{incidentId:id,handoverId:request.updateId},v)));
 assert.deepEqual(race.map(x=>x.status).sort(),[200,400]);
 const winner=race[0].status===200?b:c,loser=winner===b?c:b;
 incident=(await db.doc('incidents/'+id).get()).data();assert.equal(incident.acceptedBy,winner.localId);assert(!incident.handover);
 assert.equal((await db.doc('volunteers/'+owner.localId).get()).data().activeIncidentId,null);
 assert.equal((await api('getVolunteerIncidentDetails',{incidentId:id},owner)).status,403);
 assert.equal((await api('getVolunteerIncidentDetails',{incidentId:id},loser)).status,403);
 assert.equal((await db.doc('volunteers/'+loser.localId+'/alerts/'+id).get()).data().status,'closed');
 await ok('getVolunteerIncidentDetails',{incidentId:id},winner);await ok('finishIncident',{incidentId:id,outcome:'completed'},winner);
 // New area: no recipient at first; a volunteer turns readiness ON after the request.
 const point2={latitude:-36,longitude:159};await ok('setVolunteerAvailability',{available:true,location:point2},owner);
 const patient2=await actor('auto-empty-patient'),id2=(await ok('createIncident',{cardId:await card(patient2),requestId:randomUUID(),location:point2},reporter)).incidentId;
 await ok('acceptIncident',{incidentId:id2},owner);const d2=await ok('getVolunteerIncidentDetails',{incidentId:id2},owner);
 let block2={...request,incidentId:id2,assignmentAtMs:d2.assignmentAtMs,updateId:randomUUID()};
 assert.equal((await ok('updateIncidentProgress',block2,owner)).progress.handoverInvitedCount,0);
 assert.equal((await db.doc('incidents/'+id2).get()).data().acceptedBy,owner.localId,'No candidate must not orphan/close case');
 const oldId=block2.updateId;block2={...block2,updateId:randomUUID(),expectedProgressRevision:1};await ok('updateIncidentProgress',block2,owner);assert.equal((await db.doc('incidents/'+id2+'/handoverRequests/'+oldId).get()).data().status,'replaced');
 await volunteer(late,point2); // Fixture approved while OFF, then real API ON triggers catch-up.
 await db.doc('volunteers/'+late.localId).update({isAvailable:false});
 await ok('setVolunteerAvailability',{available:true,location:point2},late);
 const lateAlert=(await db.doc('volunteers/'+late.localId+'/alerts/'+id2).get()).data();assert.equal(lateAlert.offerKind,'handover');assert.equal(lateAlert.handoverId,block2.updateId);
 assert.equal((await db.doc('incidents/'+id2).get()).data().travelProgress.handoverInvitedCount,1);
 await ok('acceptIncidentHandover',{incidentId:id2,handoverId:block2.updateId},late);
 assert.equal((await api('acceptIncidentHandover',{incidentId:id2,handoverId:request.updateId},loser)).status,403);
 await ok('finishIncident',{incidentId:id2,outcome:'completed'},late);
 const admin=await actor('auto-cancel-admin');await auth.setCustomUserClaims(admin.localId,{admin:true});const refreshed=await fetch('http://127.0.0.1:9199/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-key',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:admin.email,password:admin.password,returnSecureToken:true})});assert.equal(refreshed.status,200);Object.assign(admin,await refreshed.json());
 const point3={latitude:-34,longitude:157},peers=[];for(let i=0;i<6;i++){const v=await actor('auto-cap-'+i);peers.push(v);await volunteer(v,{latitude:point3.latitude+0.0001*(i+1),longitude:point3.longitude});}
 await ok('setVolunteerAvailability',{available:true,location:point3},owner);const p3=await actor('auto-cap-p'),id3=(await ok('createIncident',{cardId:await card(p3),requestId:randomUUID(),location:point3},reporter)).incidentId;await ok('acceptIncident',{incidentId:id3},owner);const epoch3=(await ok('getVolunteerIncidentDetails',{incidentId:id3},owner)).assignmentAtMs,block3={...request,incidentId:id3,assignmentAtMs:epoch3,updateId:randomUUID()};await ok('updateIncidentProgress',block3,owner);const h3=(await db.doc('incidents/'+id3).get()).data().handover;assert.deepEqual(h3.targetUids,peers.slice(0,5).map(x=>x.localId));
 assert.equal((await api('cancelIncidentHandover',{incidentId:id3,handoverId:h3.id},owner)).status,403);await ok('cancelIncidentHandover',{incidentId:id3,handoverId:h3.id},admin);for(const v of peers.slice(0,5)){assert.equal((await db.doc('volunteers/'+v.localId+'/alerts/'+id3).get()).data().status,'closed');assert.equal((await api('acceptIncidentHandover',{incidentId:id3,handoverId:h3.id},v)).status,400);}assert.equal((await db.doc('incidents/'+id3).get()).data().acceptedBy,owner.localId);assert.equal((await db.doc('incidents/'+id3).get()).data().travelProgress.handoverStatus,'cancelled');await ok('updateIncidentProgress',{incidentId:id3,assignmentAtMs:epoch3,action:'going',etaMinutes:5,expectedProgressRevision:1,updateId:randomUUID()},owner);await ok('finishIncident',{incidentId:id3,outcome:'completed'},owner);
 console.log('PASS automatic handover: cannot_continue invites nearest eligible peers, duplicate retry one proposal, four privacy/ownership guards, two recipients race one winner, former owner released/revoked, no-candidate retains case, late readiness receives handover and accepts. Synthetic local actors, real API/transactions; no FCM/device delivery claimed.');
 await db.terminate();
})().catch(e=>{console.error(e);process.exitCode=1});
