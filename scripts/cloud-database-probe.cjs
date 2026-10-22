const fs=require('node:fs');const assert=require('node:assert/strict');const path=require('node:path');
async function main() {
 const sdk=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../.local/cloud-sdk.json'),'utf8').replace(/^\uFEFF/,'')).result.sdkConfig;
 assert.equal(sdk.projectId,'ehis-next-20261021-hc03');
 const auth=`https://identitytoolkit.googleapis.com/v1/accounts:`;
 const created=await fetch(auth+'signUp?key='+sdk.apiKey,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({returnSecureToken:true}),signal:AbortSignal.timeout(20000)});
 const user=await created.json();assert.equal(created.status,200,'Cloud anonymous Auth');
 try {
  const base=`https://firestore.googleapis.com/v1/projects/${sdk.projectId}/databases/(default)/documents`;
  const headers={Authorization:'Bearer '+user.idToken,'Content-Type':'application/json'};
  assert.equal((await fetch(base+'/patients/'+user.localId,{headers})).status,404,'Owner read authorized; no profile yet');
  assert.equal((await fetch(base+'/patients/another-user',{headers})).status,403,'Cross-user read denied');
  assert.equal((await fetch(base+'/cards/synthetic-cloud-probe',{headers})).status,403,'Card collection not public');
  assert.equal((await fetch(base+'/patients/'+user.localId,{method:'PATCH',headers,body:JSON.stringify({fields:{fullName:{stringValue:'Synthetic probe'}}})})).status,403,'Direct client write denied');
  console.log('PASS cloud database: real anonymous Auth works; Firestore owner access and cross-user/direct-write denial verified. No health record written.');
 } finally {await fetch(auth+'delete?key='+sdk.apiKey,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({idToken:user.idToken})});}
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
