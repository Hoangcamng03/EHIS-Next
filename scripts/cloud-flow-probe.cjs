const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');const {randomUUID,randomBytes}=require('node:crypto');
const {googleRequest,project}=require('./cloud-operator.cjs');
const root=path.resolve(__dirname,'..');
async function main() {
 const target=JSON.parse(fs.readFileSync(path.join(root,'.local/cloud-target.json'),'utf8'));
 assert.equal(target.projectId,project);
 const sdk=JSON.parse(fs.readFileSync(path.join(root,'.local/cloud-sdk.json'),'utf8').replace(/^\uFEFF/,'')).result.sdkConfig;
 const auth='https://identitytoolkit.googleapis.com/v1/accounts:';
 async function authCall(operation,data) {const response=await fetch(auth+operation+'?key='+sdk.apiKey,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),signal:AbortSignal.timeout(30000)});const value=await response.json();assert.equal(response.status,200,operation+': '+(value.error?.message || response.status));return value;}
 async function account(role,anonymous=false) {const email=`ehis-trial-${role}-${randomBytes(4).toString('hex')}@example.test`,password='Trial-'+randomBytes(15).toString('hex')+'!';return {...await authCall('signUp',anonymous?{returnSecureToken:true}:{email,password,returnSecureToken:true}),email:anonymous?null:email,password:anonymous?null:password};}
 async function call(name,data,user,expected=200) {const response=await fetch(target.backend+'/'+name,{method:'POST',headers:{'Content-Type':'application/json',...(user?{Authorization:'Bearer '+user.idToken}:{})},body:JSON.stringify({data}),signal:AbortSignal.timeout(45000)});const value=await response.json();assert.equal(response.status,expected,name+': '+JSON.stringify(value.error || {status:response.status}));return value.result;}
 const patient=await account('patient'),volunteer=await account('volunteer'),admin=await account('admin'),reporter=await account('reporter',true);
 const file=path.join(root,'.local/cloud-demo.json');
 const demo={environment:project,backend:target.backend,webUrl:target.webUrl,appUrl:target.appUrl,createdAt:new Date().toISOString(),patient:{email:patient.email,password:patient.password,uid:patient.localId},volunteer:{email:volunteer.email,password:volunteer.password,uid:volunteer.localId},admin:{email:admin.email,password:admin.password,uid:admin.localId}};
 fs.writeFileSync(file,JSON.stringify(demo,null,2),{mode:0o600});
 try {
 await googleRequest(`https://identitytoolkit.googleapis.com/v1/projects/${project}/accounts:update`,'POST',{localId:admin.localId,customAttributes:JSON.stringify({admin:true})});
 Object.assign(admin,await authCall('signInWithPassword',{email:admin.email,password:admin.password,returnSecureToken:true}));
 await call('getMyAccess',{},null,401);
 await call('setAccountPurpose',{purpose:'patient'},patient);
 await call('setAccountPurpose',{purpose:'volunteer'},volunteer);
 assert.equal((await call('getMyAccess',{},patient)).accountPurpose,'patient');
 assert.equal((await call('getMyAccess',{},volunteer)).accountPurpose,'volunteer');
 await call('savePatientProfile',{fullName:'Bệnh nhân giả · thử cloud EHIS',allergies:['Thông tin giả để kiểm tra'],emergencyContactPhone:''},patient);
 const card=await call('issuePatientCard',{shareProfile:true},patient);demo.cardId=card.cardId;demo.cardUrl=target.webUrl+'/card?id='+card.cardId;
 fs.writeFileSync(file,JSON.stringify(demo,null,2),{mode:0o600});
 await call('applyVolunteer',{fullName:'Tình nguyện viên giả · EHIS',phone:'0900000000',experience:'Chỉ là tài khoản dùng kiểm tra mạch phần mềm, không phải người hỗ trợ thật.'},volunteer);
 await call('reviewVolunteerApplication',{uid:volunteer.localId,decision:'approved'},patient,403);
 const list=await call('listVolunteerApplications',{},admin);assert.ok(list.applications.some(value=>value.uid===volunteer.localId));
 await call('reviewVolunteerApplication',{uid:volunteer.localId,decision:'approved'},admin);
 // Synthetic remote points isolate this probe from the team's normal demo area.
 const patient2=await account('patient2'),reporter2=await account('reporter2',true);
 await call('setAccountPurpose',{purpose:'patient'},patient2);
 await call('savePatientProfile',{fullName:'Bệnh nhân giả thứ hai · EHIS',allergies:[],emergencyContactPhone:''},patient2);
 const card2=await call('issuePatientCard',{shareProfile:false},patient2);
 const incident2=await call('createIncident',{cardId:card2.cardId,requestId:randomUUID(),location:{latitude:80.002,longitude:-150.002}},reporter2);
 assert.equal(incident2.invitedCount,0,'Probe begins with volunteer OFF');
 const incident=await call('createIncident',{cardId:card.cardId,requestId:randomUUID(),location:{latitude:80.001,longitude:-150.001}},reporter);
 assert.equal(incident.invitedCount,0);demo.incidentId=incident.incidentId;demo.secondIncidentId=incident2.incidentId;
 await call('getVolunteerIncidentDetails',{incidentId:incident.incidentId},volunteer,403);
 await call('submitBystanderReport',{incidentId:incident.incidentId,submissionId:randomUUID(),phone:'',answers:{responsiveness:'unknown',breathing:'unknown',bleeding:'unknown'}},reporter);
 const catchUp=await call('setVolunteerAvailability',{available:true,location:{latitude:80,longitude:-150}},volunteer);
 assert.equal(catchUp.matchedCount,2);
 const alertsResponse=await fetch(`https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/volunteers/${volunteer.localId}:runQuery`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+volunteer.idToken},body:JSON.stringify({structuredQuery:{from:[{collectionId:'alerts'}],where:{fieldFilter:{field:{fieldPath:'status'},op:'EQUAL',value:{stringValue:'offered'}}},orderBy:[{field:{fieldPath:'createdAt'},direction:'DESCENDING'}],limit:101}}),signal:AbortSignal.timeout(30000)});
 assert.equal(alertsResponse.status,200,'Live offered index must be queryable on cloud');
 const alertDocs=(await alertsResponse.json()).filter(item=>item.document).map(item=>item.document.fields);
 assert.equal(alertDocs.length,2);assert.ok(alertDocs.every(fields=>!fields.phone&&!fields.location));
 assert.equal((await call('setVolunteerAvailability',{available:true,location:{latitude:80,longitude:-150}},volunteer)).matchedCount,0);
 await call('acceptIncident',{incidentId:incident.incidentId},volunteer);
 await call('acceptIncident',{incidentId:incident2.incidentId},volunteer,400);
 await call('getVolunteerIncidentDetails',{incidentId:incident2.incidentId},volunteer,403);
 const details=await call('getVolunteerIncidentDetails',{incidentId:incident.incidentId},volunteer);assert.equal(details.phone,null);assert.equal(details.patientProfile.fullName,'Bệnh nhân giả · thử cloud EHIS');
 await call('markIncidentArrived',{incidentId:incident.incidentId},volunteer);
 await call('finishIncident',{incidentId:incident.incidentId,outcome:'completed'},volunteer);
 await call('getVolunteerIncidentDetails',{incidentId:incident.incidentId},volunteer,403);
 await call('setVolunteerAvailability',{available:true,location:{latitude:80,longitude:-150}},volunteer);
 await call('acceptIncident',{incidentId:incident2.incidentId},volunteer);
 assert.equal((await call('getVolunteerIncidentDetails',{incidentId:incident2.incidentId},volunteer)).patientProfile,null);
 await call('finishIncident',{incidentId:incident2.incidentId,outcome:'completed'},volunteer);
 demo.lateReadinessAndTwoOffersVerified=true;
 const documentUrl=`https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/patients/${patient.localId}`;
 const own=await fetch(documentUrl,{headers:{Authorization:'Bearer '+patient.idToken}});assert.equal(own.status,200);assert.equal((await own.json()).fields.fullName.stringValue,'Bệnh nhân giả · thử cloud EHIS');
 assert.equal((await fetch(documentUrl,{headers:{Authorization:'Bearer '+volunteer.idToken}})).status,403);
 demo.result='FLOW_PASSED_CLEANUP_PENDING';
 } finally {
  await googleRequest(`https://identitytoolkit.googleapis.com/v1/projects/${project}/accounts:update`,'POST',{localId:admin.localId,customAttributes:'{}'});
  Object.assign(admin,await authCall('signInWithPassword',{email:admin.email,password:admin.password,returnSecureToken:true}));
  assert.equal((await call('getMyAccess',{},admin)).isAdmin,false,'Temporary admin must not retain its role on new login');
  demo.temporaryAdminClaimRemoved=true;fs.writeFileSync(file,JSON.stringify(demo,null,2),{mode:0o600});
 }
 demo.result='PASS: cloud full lifecycle and temporary-admin cleanup';fs.writeFileSync(file,JSON.stringify(demo,null,2),{mode:0o600});
 console.log('PASS cloud full flow: two cases before readiness, late matching/index query, no duplicate offers, one assignment, private consent, completed and private-access denial. Only synthetic accounts/data used; credentials remain in ignored local file.');
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
