const fs=require('node:fs'); const path=require('node:path');
const {googleRequest,project}=require('./cloud-operator.cjs');
const root=path.resolve(__dirname,'..');
async function main() {
 const mode=process.argv[2];
 if(mode==='status') {
  const billing=await googleRequest(`https://cloudbilling.googleapis.com/v1/projects/${project}/billingInfo`);
  const db=await googleRequest(`https://firestore.googleapis.com/v1/projects/${project}/databases/(default)`);
  console.log(JSON.stringify({project,billingEnabled:billing.billingEnabled,databaseEdition:db.databaseEdition,locationId:db.locationId,freeTier:db.freeTier}));return;
 }
 if(mode==='runtime-key') {
  if(process.argv[3]!=='--confirmed-runtime-access') throw new Error('Cần xác nhận cấp quyền backend trước khi tạo key.');
  const file=path.join(root,'.local/ehis-runtime-service-account.json');
  if(fs.existsSync(file)) throw new Error('Đã có key local; không tạo key trùng.');
  const email=`ehis-runtime@${project}.iam.gserviceaccount.com`;
  try {await googleRequest(`https://iam.googleapis.com/v1/projects/${project}/serviceAccounts/${email}`);}
  catch(error) {if(!String(error.message).includes('404')) throw error; await googleRequest(`https://iam.googleapis.com/v1/projects/${project}/serviceAccounts`,'POST',{accountId:'ehis-runtime',serviceAccount:{displayName:'EHIS pilot backend - Firestore only'}});}
  const policy=await googleRequest(`https://cloudresourcemanager.googleapis.com/v1/projects/${project}:getIamPolicy`,'POST',{});
  const member='serviceAccount:'+email;
  let binding=policy.bindings?.find(item=>item.role==='roles/datastore.user' && !item.condition);
  if(!binding) {binding={role:'roles/datastore.user',members:[]};(policy.bindings ||= []).push(binding);}
  if(!binding.members.includes(member)) {binding.members.push(member);await googleRequest(`https://cloudresourcemanager.googleapis.com/v1/projects/${project}:setIamPolicy`,'POST',{policy});}
  const key=await googleRequest(`https://iam.googleapis.com/v1/projects/${project}/serviceAccounts/${email}/keys`,'POST',{privateKeyType:'TYPE_GOOGLE_CREDENTIALS_FILE'});
  fs.writeFileSync(file,Buffer.from(key.privateKeyData,'base64'),{mode:0o600});
  console.log('Scoped runtime key saved to ignored local file. Key content not printed.');return;
 }
 if(mode==='admin') {
  const uid=process.argv[3];if(!uid || !/^[A-Za-z0-9_-]{6,128}$/.test(uid)) throw new Error('Cần UID tài khoản quản trị đã xác nhận.');
  const result=await googleRequest(`https://identitytoolkit.googleapis.com/v1/projects/${project}/accounts:lookup`,'POST',{localId:[uid]});
  const user=result.users?.[0]; if(!user?.email) throw new Error('Cần tài khoản đăng ký email.');
  const claims={...(user.customAttributes?JSON.parse(user.customAttributes):{}),admin:true};
  await googleRequest(`https://identitytoolkit.googleapis.com/v1/projects/${project}/accounts:update`,'POST',{localId:uid,customAttributes:JSON.stringify(claims)});
  console.log('Admin claim applied to the confirmed UID. Sign in again to refresh.');return;
 }
 throw new Error('Dùng status / runtime-key --confirmed-runtime-access / admin <confirmed UID>.');
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
