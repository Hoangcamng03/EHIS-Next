// FCM validate_only: checks permission + real payload schema without sending to anyone.
const fs=require('node:fs'),path=require('node:path'),{createRequire}=require('node:module'),assert=require('node:assert/strict');
const project='ehis-next-20261021-hc03',req=createRequire(path.resolve(__dirname,'../backend/package.json'));
async function main(){
 if(process.argv[2]!=='--validate-only'||!process.argv[3])throw Error('Use --validate-only <existing-private-credential-file>; never pass a key inline.');
 const secret=JSON.parse(fs.readFileSync(process.argv[3],'utf8'));assert.equal(secret.project_id,project);assert.equal(secret.client_email,`ehis-runtime@${project}.iam.gserviceaccount.com`);
 const {cert}=req('firebase-admin/app'),token=await cert(secret).getAccessToken();
 const {pushMessage}=req('./lib/pushPolicy');
 const response=await fetch(`https://fcm.googleapis.com/v1/projects/${project}/messages:send`,{method:'POST',headers:{Authorization:`Bearer ${token.access_token}`,'Content-Type':'application/json'},body:JSON.stringify({validate_only:true,message:{...pushMessage('synthetic-validation-case','request',Date.now()+60000,Date.now()),topic:'ehis-validation-only'}}),signal:AbortSignal.timeout(30000)});
 const body=await response.json();
 const result={checkedAt:new Date().toISOString(),projectId:project,httpStatus:response.status,validateOnly:true,payloadAccepted:response.ok,actualDeviceDeliveryVerified:false,...(!response.ok?{errorStatus:body.error?.status}: {})};
 fs.mkdirSync('.local',{recursive:true});fs.writeFileSync('.local/fcm-config-proof.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 assert.equal(response.status,200,'FCM validate_only must accept runtime permission and HTTP payload');
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
