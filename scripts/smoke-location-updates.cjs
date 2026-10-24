// Synthetic emulator fixtures only. Tests ownership, lifecycle, retries and privacy.
const assert=require('node:assert/strict'),{randomUUID}=require('node:crypto'),{createRequire}=require('node:module'),path=require('node:path');
process.env.FIRESTORE_EMULATOR_HOST='127.0.0.1:8180';process.env.FIREBASE_AUTH_EMULATOR_HOST='127.0.0.1:9199';
const req=createRequire(path.resolve(__dirname,'../functions/package.json'));
req('firebase-admin/app').initializeApp({projectId:'demo-ehis-next'});
const {getFirestore,Timestamp}=req('firebase-admin/firestore'),db=getFirestore();
async function user(anonymous=false){const r=await fetch('http://127.0.0.1:9199/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-key',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(anonymous?{returnSecureToken:true}:{email:`location-${randomUUID()}@example.test`,password:'Synthetic-local-only-4291!',returnSecureToken:true})});assert.equal(r.status,200);return r.json();}
async function call(name,data,actor){const r=await fetch(`http://127.0.0.1:5101/demo-ehis-next/asia-southeast1/${name}`,{method:'POST',headers:{'Content-Type':'application/json',...(actor?{Authorization:`Bearer ${actor.idToken}`}:{})},body:JSON.stringify({data}),signal:AbortSignal.timeout(20000)});return {status:r.status,...await r.json()};}
async function main(){
 const reporter=await user(true),other=await user(true),volunteer=await user(),outsider=await user();
 const patientId=randomUUID(),cardId=randomUUID(),location={latitude:-35,longitude:-110};
 await db.doc(`patients/${patientId}`).set({fullName:'Synthetic location test'});await db.doc(`cards/${cardId}`).set({patientId,active:true});
 for(const v of [volunteer,outsider])await db.doc(`volunteers/${v.localId}`).set({verificationStatus:'approved',isAvailable:true,location,lastSeenAt:Timestamp.now()});
 const created=await call('createIncident',{cardId,requestId:randomUUID(),location},reporter);assert.equal(created.status,200,JSON.stringify(created));const {incidentId}=created.result;
 const update={incidentId,updateId:randomUUID(),location:{latitude:-35.001,longitude:-110.001}};
 assert.equal((await call('updateIncidentLocation',update)).status,401);
 assert.equal((await call('updateIncidentLocation',update,other)).status,403);
 assert.equal((await call('updateIncidentLocation',{...update,acceptedBy:outsider.localId},reporter)).status,400);
 assert.equal((await call('updateIncidentLocation',{...update,location:{latitude:90,longitude:0}},reporter)).status,400);
 assert.equal((await call('updateIncidentLocation',update,reporter)).error.status,'FAILED_PRECONDITION');
 assert.equal((await call('acceptIncident',{incidentId},volunteer)).status,200);
 const first=await call('updateIncidentLocation',update,reporter);assert.equal(first.status,200,JSON.stringify(first));assert.equal(first.result.revision,1);assert.equal(first.result.locationRevision,1);
 assert.deepEqual((await call('updateIncidentLocation',update,reporter)).result,first.result);
 assert.equal((await call('updateIncidentLocation',{...update,location},reporter)).status,400);
 const details=await call('getVolunteerIncidentDetails',{incidentId},volunteer);assert.deepEqual(details.result.location,update.location);assert.equal(details.result.locationRevision,1);assert.equal(details.result.revision,1);assert.equal(details.result.phone,null);assert.equal(details.result.answers,null);
 assert.equal((await call('getVolunteerIncidentDetails',{incidentId},outsider)).status,403);
 for(const actor of [reporter,volunteer])assert.equal((await fetch(`http://127.0.0.1:8180/v1/projects/demo-ehis-next/databases/(default)/documents/incidents/${incidentId}/private/location`,{headers:{Authorization:`Bearer ${actor.idToken}`}})).status,403);
 for(const doc of [`reporters/${reporter.localId}/incidentStatuses/${incidentId}`,`volunteers/${volunteer.localId}/alerts/${incidentId}`]){const data=(await db.doc(doc).get()).data();assert.equal(data.locationRevision,1);assert.ok(!('location' in data));}
 assert.ok(!('locationRevision' in (await db.doc(`volunteers/${outsider.localId}/alerts/${incidentId}`).get()).data()));
 const report=await call('submitBystanderReport',{incidentId,submissionId:randomUUID(),answers:{responsiveness:'unknown',breathing:'unknown',bleeding:'unknown'}},reporter);assert.equal(report.result.revision,2);
 const after=await call('getVolunteerIncidentDetails',{incidentId},volunteer);assert.deepEqual(after.result.location,update.location);assert.equal(after.result.locationRevision,1);assert.equal(after.result.revision,2);
 const events=await db.collection(`incidents/${incidentId}/reportEvents`).get();for(const event of events.docs)assert.ok(!('location' in event.data()));
 assert.equal((await call('markIncidentArrived',{incidentId},volunteer)).status,200);
 assert.equal((await call('updateIncidentLocation',{...update,updateId:randomUUID(),location},reporter)).result.locationRevision,2);
 assert.equal((await call('finishIncident',{incidentId,outcome:'completed'},volunteer)).status,200);
 assert.equal((await call('updateIncidentLocation',{...update,updateId:randomUUID()},reporter)).error.status,'FAILED_PRECONDITION');
 assert.equal((await call('getVolunteerIncidentDetails',{incidentId},volunteer)).status,403);
 assert.deepEqual((await call('updateIncidentLocation',update,reporter)).result,first.result); // Lost acknowledgement retry does not mutate a closed case.
 assert.equal((await db.doc(`incidents/${incidentId}`).get()).data().locationRevision,2);
 console.log('PASS location updates: explicit owner operation, assigned/arrived only, denied forgery/private reads, idempotency, revision/answers compatibility, no location history, closure blocks mutation/access.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
