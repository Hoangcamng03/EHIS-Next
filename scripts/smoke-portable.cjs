const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const path=require('node:path');
const {randomUUID}=require('node:crypto');
const base='http://127.0.0.1:5201';
async function main() {
 const secret=randomUUID()+randomUUID();
 const child=spawn(process.execPath,['server.cjs'],{cwd:path.resolve(__dirname,'../functions'),windowsHide:true,stdio:'ignore',env:{...process.env,PORT:'5201',GCLOUD_PROJECT:'demo-ehis-next',FIREBASE_CONFIG:JSON.stringify({projectId:'demo-ehis-next'}),FUNCTIONS_EMULATOR:'true',FIRESTORE_EMULATOR_HOST:'127.0.0.1:8180',FIREBASE_AUTH_EMULATOR_HOST:'127.0.0.1:9199',CRON_SECRET:secret}});
 try {
  let ready=false;
  for(let i=0;i<40;i++) {try {if((await fetch(base+'/api/health')).ok) {ready=true;break;}}catch{} await new Promise(resolve=>setTimeout(resolve,250));}
  assert.equal(ready,true,'Portable backend startup');
  async function call(name,data,token) {return fetch(base+'/api/'+name,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify({data})});}
  assert.equal((await call('getMyAccess',{})).status,401);
  assert.equal((await call('getMyAccess',{},'invalid-token')).status,401);
  assert.equal((await call('setAccountPurpose',{purpose:'volunteer'})).status,401);
  assert.equal((await call('maintenance',{})).status,404);
  assert.equal((await fetch(base+'/internal/maintenance')).status,401);
  const created=await fetch('http://127.0.0.1:9199/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-key',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:`portable-${randomUUID()}@example.test`,password:'Synthetic-only-4291!',returnSecureToken:true})});
  const user=await created.json(); assert.equal(created.status,200);
  const access=await call('getMyAccess',{},user.idToken);assert.equal(access.status,200);assert.equal((await access.json()).result.uid,user.localId);
  assert.equal((await call('savePatientProfile',{fullName:'Synthetic Portable',allergies:[],emergencyContactPhone:'',admin:true},user.idToken)).status,400);
  assert.equal((await call('savePatientProfile',{fullName:'Synthetic Portable',allergies:[],emergencyContactPhone:''},user.idToken)).status,200);
  assert.equal((await (await call('getMyAccess',{},user.idToken)).json()).result.accountPurpose,'patient','legacy profile fallback');
  for(const bad of [{purpose:'admin'},{purpose:['volunteer']},{purpose:'volunteer',admin:true},{purpose:'volunteer',uid:'another-user'}]) assert.equal((await call('setAccountPurpose',bad,user.idToken)).status,400);
  assert.equal((await call('setAccountPurpose',{purpose:'volunteer'},user.idToken)).status,200);
  assert.equal((await call('setAccountPurpose',{purpose:'volunteer'},user.idToken)).status,200,'idempotent retry');
  assert.equal((await call('setAccountPurpose',{purpose:'patient'},user.idToken)).status,400,'cannot silently change registered purpose');
  const purposeAccess=(await (await call('getMyAccess',{},user.idToken)).json()).result;
  assert.equal(purposeAccess.accountPurpose,'volunteer');assert.equal(purposeAccess.isAdmin,false);assert.equal(purposeAccess.isVerifiedVolunteer,false);
  const preflight=await fetch(base+'/api/createIncident',{method:'OPTIONS',headers:{Origin:'https://example.test','Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'authorization,content-type'}});
  assert.equal(preflight.status,204);assert.equal(preflight.headers.get('access-control-allow-origin'),'https://example.test');
  assert.equal((await fetch(base+'/internal/maintenance',{headers:{Authorization:'Bearer '+secret}})).status,200);
  console.log('PASS portable backend: HTTP wrapper preserves Firebase auth, rejects missing/invalid token and field injection; owner save, CORS, endpoint allowlist and cron secret checked.');
 } finally {child.kill();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
