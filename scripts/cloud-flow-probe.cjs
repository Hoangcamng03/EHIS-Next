const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');const {randomUUID,randomBytes}=require('node:crypto');
const {googleRequest,project}=require('./cloud-operator.cjs');
const root=path.resolve(__dirname,'..');
async function main() {
 const target=JSON.parse(fs.readFileSync(path.join(root,'.local/cloud-target.json'),'utf8'));
 assert.equal(target.projectId,project);
 const sdk=JSON.parse(fs.readFileSync(path.join(root,'.local/cloud-sdk.json'),'utf8').replace(/^\uFEFF/,'')).result.sdkConfig;
 const auth='https://identitytoolkit.googleapis.com/v1/accounts:';
 async function checkedFetch(label,url,options){try{return await fetch(url,options);}catch(error){throw new Error(label+': '+error.message+' ('+(error.cause?.code||'network')+')');}}

 async function authCall(operation,data) {const response=await checkedFetch('Auth '+operation,auth+operation+'?key='+sdk.apiKey,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),signal:AbortSignal.timeout(30000)});const value=await response.json();assert.equal(response.status,200,operation+': '+(value.error?.message || response.status));return value;}
 async function account(role,anonymous=false) {const email=`ehis-trial-${role}-${randomBytes(4).toString('hex')}@example.test`,password='Trial-'+randomBytes(15).toString('hex')+'!';return {...await authCall('signUp',anonymous?{returnSecureToken:true}:{email,password,returnSecureToken:true}),email:anonymous?null:email,password:anonymous?null:password};}
 async function call(name,data,user,expected=200) {const response=await checkedFetch('API '+name,target.backend+'/'+name,{method:'POST',headers:{'Content-Type':'application/json',...(user?{Authorization:'Bearer '+user.idToken}:{})},body:JSON.stringify({data}),signal:AbortSignal.timeout(45000)});const value=await response.json();assert.equal(response.status,expected,name+': '+JSON.stringify(value.error || {status:response.status}));return value.result;}
 const patient=await account('patient'),volunteer=await account('volunteer'),admin=await account('admin'),reporter=await account('reporter',true);
 const file=path.join(root,'.local/cloud-demo.json');
 const demo={environment:project,backend:target.backend,webUrl:target.webUrl,appUrl:target.appUrl,createdAt:new Date().toISOString(),patient:{email:patient.email,password:patient.password,uid:patient.localId},volunteer:{email:volunteer.email,password:volunteer.password,uid:volunteer.localId},admin:{email:admin.email,password:admin.password,uid:admin.localId}};
 fs.writeFileSync(file,JSON.stringify(demo,null,2),{mode:0o600});
 try {
 await googleRequest(`https://identitytoolkit.googleapis.com/v1/projects/${project}/accounts:update`,'POST',{localId:admin.localId,emailVerified:true,customAttributes:JSON.stringify({admin:true})});
 Object.assign(admin,await authCall('signInWithPassword',{email:admin.email,password:admin.password,returnSecureToken:true}));
 await call('getOperationsOverview',{},patient,403);
 const operations=await call('getOperationsOverview',{},admin);assert.equal(typeof operations.counts.expiredPendingNotifications,'number');assert.ok(operations.oldestWaiting.length<=5);demo.operationsOverviewVerified=true;
 await call('getMyAccess',{},null,401);
 await call('setAccountPurpose',{purpose:'patient'},patient);
 await call('setAccountPurpose',{purpose:'volunteer'},volunteer);
 assert.equal((await call('getMyAccess',{},patient)).accountPurpose,'patient');
 assert.equal((await call('getMyAccess',{},volunteer)).accountPurpose,'volunteer');
 await call('savePatientProfile',{fullName:'Bệnh nhân giả · thử cloud EHIS',allergies:['Thông tin giả để kiểm tra'],emergencyContactPhone:''},patient);
 const card=await call('issuePatientCard',{shareProfile:true},patient);demo.cardId=card.cardId;demo.cardUrl=target.webUrl+'/card?id='+card.cardId;
 fs.writeFileSync(file,JSON.stringify(demo,null,2),{mode:0o600});
 const registry={email:admin.email,fullName:'Người quản lý GIẢ · kiểm thử phần mềm',phone:'0900000000',organisation:'Đơn vị GIẢ, không có năng lực y tế',position:'Chức vụ GIẢ trong fixture phần mềm',verificationNote:'Chỉ dùng kiểm thử quyền; không đối chiếu hay xác nhận chuyên môn thật.',enabled:true};
 await call('setVolunteerReferrer',registry,admin);demo.syntheticReferrerRegistryCreated=true;
 const application=await call('applyVolunteer',{fullName:'Tình nguyện viên giả · EHIS',phone:'0900000000',experience:'Chỉ là tài khoản dùng kiểm tra mạch phần mềm, không phải người hỗ trợ thật.',trainingLevel:'first_aid',clinicalMonths:0,homeAddress:'Khu vực GIẢ',workAddress:'Đơn vị GIẢ',serviceArea:'Vùng GIẢ',referrerEmail:admin.email},volunteer);
 await call('reviewVolunteerApplication',{uid:volunteer.localId,decision:'approved'},patient,403);
 const list=await call('listVolunteerApplications',{},admin);assert.ok(list.applications.some(value=>value.uid===volunteer.localId));
 await call('reviewVolunteerApplication',{uid:volunteer.localId,decision:'approved',applicationRevision:application.applicationRevision},admin,400);
 await call('submitVolunteerReferral',{uid:volunteer.localId,applicationRevision:application.applicationRevision,decision:'recommended',checklist:{identityChecked:true,affiliationChecked:true,trainingChecked:true,scopeExplained:true},confirmedLevel:'first_aid',confirmedClinicalMonths:0,evidence:'Checklist GIẢ chỉ kiểm thử phần mềm, không phải xác minh năng lực y tế.'},admin);
 await call('reviewVolunteerApplication',{uid:volunteer.localId,decision:'approved',applicationRevision:application.applicationRevision},admin);
 // Real cloud queries also verify that the regional composite indexes are READY.
 await call('listVolunteerRoster',{},patient,403);
 for(const filter of [{serviceArea:'Vùng GIẢ'},{organisation:registry.organisation},{serviceArea:'Vùng GIẢ',organisation:registry.organisation}]) assert.ok((await call('listVolunteerRoster',filter,admin)).volunteers.some(v=>v.uid===volunteer.localId));
 await call('updateVolunteerRegion',{uid:volunteer.localId,serviceArea:'Vùng GIẢ ranh giới'},admin);
 await call('setVolunteerSuspension',{uid:volunteer.localId,suspended:true,reason:'Synthetic cloud access test only'},admin);
 await call('setVolunteerAvailability',{available:true,location:{latitude:78,longitude:-145}},volunteer,403);
 await call('setVolunteerSuspension',{uid:volunteer.localId,suspended:false,reason:'Synthetic access test completed; retain OFF'},admin);
 // Synthetic remote points isolate this probe from the team's normal demo area.
 const patient2=await account('patient2'),reporter2=await account('reporter2',true);
 await call('setAccountPurpose',{purpose:'patient'},patient2);
 await call('savePatientProfile',{fullName:'Bệnh nhân giả thứ hai · EHIS',allergies:[],emergencyContactPhone:''},patient2);
 const targetVolunteer=await account('handover-volunteer');
 await call('setAccountPurpose',{purpose:'volunteer'},targetVolunteer);
 const targetApplication=await call('applyVolunteer',{fullName:'TNV nhận bàn giao GIẢ · EHIS',phone:'0900000000',experience:'Fixture chỉ kiểm thử phần mềm, không phải người hỗ trợ thật.',trainingLevel:'first_aid',clinicalMonths:0,homeAddress:'Nơi ở GIẢ',workAddress:'Đơn vị GIẢ',serviceArea:'Vùng GIẢ',referrerEmail:admin.email},targetVolunteer);
 await call('submitVolunteerReferral',{uid:targetVolunteer.localId,applicationRevision:targetApplication.applicationRevision,decision:'recommended',checklist:{identityChecked:true,affiliationChecked:true,trainingChecked:true,scopeExplained:true},confirmedLevel:'first_aid',confirmedClinicalMonths:0,evidence:'Checklist GIẢ chỉ kiểm thử phần mềm, không xác minh chuyên môn thật.'},admin);
 await call('reviewVolunteerApplication',{uid:targetVolunteer.localId,decision:'approved',applicationRevision:targetApplication.applicationRevision},admin);
 const card2=await call('issuePatientCard',{shareProfile:false},patient2);
 const incident2=await call('createIncident',{cardId:card2.cardId,requestId:randomUUID(),location:{latitude:78.002,longitude:-145.002}},reporter2);
 assert.equal(incident2.invitedCount,0,'Probe begins with volunteer OFF');
 const incident=await call('createIncident',{cardId:card.cardId,requestId:randomUUID(),location:{latitude:78.001,longitude:-145.001}},reporter);
 assert.equal(incident.invitedCount,0);demo.incidentId=incident.incidentId;demo.secondIncidentId=incident2.incidentId;
 await call('getVolunteerIncidentDetails',{incidentId:incident.incidentId},volunteer,403);
 const observations={responsiveness:'unresponsive',breathing:'abnormal',breathingDetail:'gasping',bleeding:'visible',bleedingDetail:'heavy'};
 const meetingNote='Cổng GIẢ, tầng 2 · kiểm thử phần mềm';
 await call('submitBystanderReport',{incidentId:incident.incidentId,submissionId:randomUUID(),phone:'',answers:observations,meetingNote},reporter);
 const restored=await call('getBystanderReport',{incidentId:incident.incidentId},reporter);assert.deepEqual(restored.answers,observations);assert.equal(restored.meetingNote,meetingNote);assert.equal(restored.revision,1);await call('getBystanderReport',{incidentId:incident.incidentId},patient,403);demo.ownerReportRestoreVerified=true;
 const catchUp=await call('setVolunteerAvailability',{available:true,location:{latitude:78,longitude:-145}},volunteer);
 assert.equal(catchUp.matchedCount,2);
 const alertsResponse=await checkedFetch('Firestore offered query',`https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/volunteers/${volunteer.localId}:runQuery`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+volunteer.idToken},body:JSON.stringify({structuredQuery:{from:[{collectionId:'alerts'}],where:{fieldFilter:{field:{fieldPath:'status'},op:'EQUAL',value:{stringValue:'offered'}}},orderBy:[{field:{fieldPath:'createdAt'},direction:'DESCENDING'}],limit:101}}),signal:AbortSignal.timeout(30000)});
 assert.equal(alertsResponse.status,200,'Live offered index must be queryable on cloud');
 const alertDocs=(await alertsResponse.json()).filter(item=>item.document).map(item=>item.document.fields);
 assert.equal(alertDocs.length,2);assert.ok(alertDocs.every(fields=>!fields.phone&&!fields.location&&!fields.meetingNote));
 assert.equal((await call('setVolunteerAvailability',{available:true,location:{latitude:78,longitude:-145}},volunteer)).matchedCount,0);
 await call('acceptIncident',{incidentId:incident.incidentId},volunteer);
 await call('acceptIncident',{incidentId:incident2.incidentId},volunteer,400);
 await call('getVolunteerIncidentDetails',{incidentId:incident2.incidentId},volunteer,403);
 const details=await call('getVolunteerIncidentDetails',{incidentId:incident.incidentId},volunteer);assert.equal(details.phone,null);assert.equal(details.patientProfile.fullName,'Bệnh nhân giả · thử cloud EHIS');
 assert.deepEqual(details.answers,observations);assert.ok(details.reportedAtMs>0);demo.regionalRosterAndObservationsVerified=true;
 assert.equal(details.meetingNote,meetingNote);demo.privateMeetingNoteVerified=true;
 await call('markIncidentArrived',{incidentId:incident.incidentId},volunteer);
 await call('setVolunteerAvailability',{available:true,location:{latitude:78,longitude:-145}},targetVolunteer);
 const rosterNow=await call('listVolunteerRoster',{serviceArea:'Vùng GIẢ'},admin);assert.equal(rosterNow.volunteers.find(v=>v.uid===targetVolunteer.localId).readyForDispatch,true);
 const handoverCases=await call('listHandoverCases',{},admin);assert(handoverCases.cases.some(c=>c.incidentId===incident.incidentId));
 const candidates=await call('listHandoverCandidates',{incidentId:incident.incidentId},admin);assert(candidates.candidates.some(c=>c.uid===targetVolunteer.localId));
 const proposal={incidentId:incident.incidentId,targetUid:targetVolunteer.localId,requestId:randomUUID(),reason:'Bàn giao GIẢ để kiểm thử cloud; không phải ca thật.'};
 await call('proposeIncidentHandover',proposal,admin);await call('proposeIncidentHandover',proposal,admin);
 await call('getVolunteerIncidentDetails',{incidentId:incident.incidentId},targetVolunteer,403);await call('getVolunteerIncidentDetails',{incidentId:incident.incidentId},volunteer);
 await call('acceptIncidentHandover',{incidentId:incident.incidentId,handoverId:proposal.requestId},targetVolunteer);
 await call('getVolunteerIncidentDetails',{incidentId:incident.incidentId},volunteer,403);assert.equal((await call('getVolunteerIncidentDetails',{incidentId:incident.incidentId},targetVolunteer)).meetingNote,meetingNote);
 const history=await call('listHandoverHistory',{incidentId:incident.incidentId},admin);assert(history.history.some(h=>h.id===proposal.requestId&&h.status==='accepted'));await call('listHandoverHistory',{incidentId:incident.incidentId},targetVolunteer,403);
 await call('finishIncident',{incidentId:incident.incidentId,outcome:'completed'},volunteer,403);
 await call('finishIncident',{incidentId:incident.incidentId,outcome:'completed'},targetVolunteer);
 await call('setVolunteerAvailability',{available:false},targetVolunteer);demo.handoverCloudVerified=true;
 await call('getVolunteerIncidentDetails',{incidentId:incident.incidentId},volunteer,403);
 await call('setVolunteerAvailability',{available:true,location:{latitude:78,longitude:-145}},volunteer);
 await call('acceptIncident',{incidentId:incident2.incidentId},volunteer);
 assert.equal((await call('getVolunteerIncidentDetails',{incidentId:incident2.incidentId},volunteer)).patientProfile,null);
 await call('finishIncident',{incidentId:incident2.incidentId,outcome:'completed'},volunteer);
 demo.lateReadinessAndTwoOffersVerified=true;
 const documentUrl=`https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/patients/${patient.localId}`;
 const own=await fetch(documentUrl,{headers:{Authorization:'Bearer '+patient.idToken}});assert.equal(own.status,200);assert.equal((await own.json()).fields.fullName.stringValue,'Bệnh nhân giả · thử cloud EHIS');
 assert.equal((await fetch(documentUrl,{headers:{Authorization:'Bearer '+volunteer.idToken}})).status,403);
 // Ephemeral probe volunteers must not remain approved after a successful drill.
 for(const user of [volunteer,targetVolunteer]) await call('setVolunteerSuspension',{uid:user.localId,suspended:true,reason:'Synthetic cloud probe complete; retire this temporary test volunteer.'},admin);
 demo.syntheticVolunteersSuspended=2;
 demo.result='FLOW_PASSED_CLEANUP_PENDING';
 } finally {
  if(demo.syntheticReferrerRegistryCreated) await call('setVolunteerReferrer',{email:admin.email,fullName:'Synthetic test manager',phone:'0900000000',organisation:'Synthetic test unit',position:'Synthetic fixture only',verificationNote:'Software test complete; revoke temporary referrer access.',enabled:false},admin);
  await googleRequest(`https://identitytoolkit.googleapis.com/v1/projects/${project}/accounts:update`,'POST',{localId:admin.localId,customAttributes:'{}'});
  Object.assign(admin,await authCall('signInWithPassword',{email:admin.email,password:admin.password,returnSecureToken:true}));
  assert.equal((await call('getMyAccess',{},admin)).isAdmin,false,'Temporary admin must not retain its role on new login');
  demo.temporaryAdminClaimRemoved=true;fs.writeFileSync(file,JSON.stringify(demo,null,2),{mode:0o600});
 }
 demo.result='PASS: cloud lifecycle, report restore, handover and temporary-admin cleanup';fs.writeFileSync(file,JSON.stringify(demo,null,2),{mode:0o600});
 console.log('PASS cloud full flow: owner report recovery, GPS-ready roster, handover candidates/proposal/explicit accept/private access/history, regional roster indexes, suspension/restore, detailed observations, two cases before readiness, late matching/index query, no duplicate offers, one assignment, private consent, completed and private-access denial. Only synthetic accounts/data used; credentials remain in ignored local file.');
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
