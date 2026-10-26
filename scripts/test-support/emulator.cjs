// Fixed loopback + demo project: this helper cannot target cloud fixtures.
const assert=require('node:assert/strict'),{createRequire}=require('node:module'),path=require('node:path'),{randomUUID}=require('node:crypto');
process.env.FIRESTORE_EMULATOR_HOST='127.0.0.1:8180';process.env.FIREBASE_AUTH_EMULATOR_HOST='127.0.0.1:9199';
const req=createRequire(path.resolve(__dirname,'../../backend/package.json'));
req('firebase-admin/app').initializeApp({projectId:'demo-ehis-next'});
const {getFirestore,Timestamp}=req('firebase-admin/firestore'),{getAuth}=req('firebase-admin/auth');
const db=getFirestore(),auth=getAuth(),metrics=[],actors=[];
const password=`Local-only-${randomUUID()}!`,base='http://127.0.0.1:5101/demo-ehis-next/asia-southeast1';
async function actor(label,anonymous=false){
 const email=`qa-${label}-${randomUUID()}@example.test`;
 const r=await fetch('http://127.0.0.1:9199/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-key',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(anonymous?{returnSecureToken:true}:{email,password,returnSecureToken:true})});
 assert.equal(r.status,200,'Emulator signup');const data={...await r.json(),email,password};actors.push(data);return data;
}
async function api(name,data,user){const start=performance.now();const r=await fetch(`${base}/${name}`,{method:'POST',headers:{'Content-Type':'application/json',...(user?{Authorization:`Bearer ${user.idToken}`}:{})},body:JSON.stringify({data}),signal:AbortSignal.timeout(30000)});const body=await r.json();metrics.push({operation:name,ms:Math.round(performance.now()-start),status:r.status});return {status:r.status,...body};}
async function ok(name,data,user){const r=await api(name,data,user);assert.equal(r.status,200,`${name}: ${r.error?.status||r.status}`);return r.result;}
async function card(patient){await ok('savePatientProfile',{fullName:'QA SYNTHETIC '+patient.localId.slice(0,6),allergies:[],emergencyContactPhone:''},patient);return (await ok('issuePatientCard',{shareProfile:true},patient)).cardId;}
async function volunteer(user,location,extra={}){await db.doc(`volunteers/${user.localId}`).set({verificationStatus:'approved',isAvailable:true,location,lastSeenAt:Timestamp.now(),...extra});}
async function create(patient,reporter,location){const cardId=await card(patient);return {cardId,...await ok('createIncident',{cardId,requestId:randomUUID(),location},reporter)};}
async function batch(items,fn,size=8){for(let i=0;i<items.length;i+=size)await Promise.all(items.slice(i,i+size).map(fn));}
async function direct(document,user,method='GET',body){return fetch(`http://127.0.0.1:8180/v1/projects/demo-ehis-next/databases/(default)/documents/${document}`,{method,headers:{'Content-Type':'application/json',Authorization:`Bearer ${user.idToken}`},...(body?{body:JSON.stringify(body)}:{})});}
module.exports={assert,randomUUID,db,auth,Timestamp,req,actor,api,ok,card,volunteer,create,batch,direct,metrics,actors};
