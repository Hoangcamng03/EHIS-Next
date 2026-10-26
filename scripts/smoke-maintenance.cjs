const assert = require('node:assert/strict');
const { randomUUID, createHash } = require('node:crypto');
const { createRequire } = require('node:module');
const path = require('node:path');
process.env.FIRESTORE_EMULATOR_HOST='127.0.0.1:8180';
process.env.FIREBASE_AUTH_EMULATOR_HOST='127.0.0.1:9199';
const requireFunctions = createRequire(path.resolve(__dirname,'../backend/package.json'));
const { initializeApp } = requireFunctions('firebase-admin/app');
const { getFirestore, Timestamp } = requireFunctions('firebase-admin/firestore');
initializeApp({projectId:'demo-ehis-next'});
const { runMaintenance } = require('../backend/lib/maintenance');
const { enforceRequestBudget } = require('../backend/lib/guards');
async function main() {
 const db=getFirestore(), id=`maintenance-${randomUUID()}`, now=Date.now(), ref=db.doc(`incidents/${id}`);
 const uid=id+'-patient', reporter=id+'-reporter', volunteer=id+'-volunteer';
 await Promise.all([
  ref.set({status:'dispatching',patientId:uid,reporterUid:reporter,cardId:id,invitedVolunteerIds:[volunteer],offerExpiresAt:Timestamp.fromMillis(now-1000)}),
  db.doc(`cards/${id}`).set({active:true,activeIncidentId:id}),
  db.doc(`reporters/${reporter}/incidentStatuses/${id}`).set({status:'dispatching'}),
  db.doc(`patients/${uid}/incidentStatuses/${id}`).set({status:'dispatching'}),
  db.doc(`volunteers/${volunteer}/alerts/${id}`).set({status:'offered',answers:{responsiveness:'unknown'}}),
  ref.collection('private').doc('reporter').set({phone:'0900000000'}),
  ref.collection('private').doc('location').set({latitude:10,longitude:106}),
 ]);
 await runMaintenance(now);
 assert.equal((await ref.get()).data().status,'expired');
 assert.equal((await db.doc(`cards/${id}`).get()).data().activeIncidentId,null);
 assert.equal((await db.doc(`patients/${uid}/incidentStatuses/${id}`).get()).data().status,'expired');
 assert.equal((await ref.collection('private').doc('reporter').get()).exists,true);
 const active=db.doc(`incidents/${id}-active`);
 await active.set({status:'accepted',purgeAfter:Timestamp.fromMillis(now-1000)});
 await active.collection('private').doc('reporter').set({phone:'0900000000'});
 await ref.update({purgeAfter:Timestamp.fromMillis(now-1)});
 await runMaintenance(now);
 assert.equal((await ref.collection('private').doc('reporter').get()).exists,false);
 assert.equal((await ref.collection('private').doc('location').get()).exists,false);
 assert.equal((await db.doc(`volunteers/${volunteer}/alerts/${id}`).get()).data().answers,undefined);
 assert.equal((await active.collection('private').doc('reporter').get()).exists,true);
 const rateUid=`rate-${randomUUID()}`, minute=Math.floor(Date.now()/60000);
 const key=createHash('sha256').update(`user:${rateUid}:${minute}`).digest('hex');
 await db.doc(`_requestLimits/${key}`).set({count:119,expiresAt:Timestamp.fromMillis(now+3600000)});
 const raced=await Promise.allSettled([enforceRequestBudget(rateUid,'test'),enforceRequestBudget(rateUid,'test')]);
 assert.equal(raced.filter(result=>result.status==='fulfilled').length,1);
 assert.equal(raced.filter(result=>result.status==='rejected' && result.reason.code==='resource-exhausted').length,1);
 await db.recursiveDelete(active);
 console.log('PASS maintenance: expiry closes projections/frees card; retention removes private data and observations; active assignment preserved; request limit is atomic.');
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
