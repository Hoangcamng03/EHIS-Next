const {test}=require('node:test'),assert=require('node:assert/strict'),modulePromise=import('../frontend/app/src/lib/profile-draft.ts');
test('unsaved identity, allergy or contact changes cannot be treated as the saved QR profile',async()=>{
 const {profileDraft,profileMatchesSaved}=await modulePromise,p=profileDraft('QA Patient','latex','0900000000'),saved=JSON.stringify(p);
 assert.equal(profileMatchesSaved(p,null),false);assert.equal(profileMatchesSaved(p,saved),true);
 for(const draft of [profileDraft('Other','latex','0900000000'),profileDraft('QA Patient','latex, penicillin','0900000000'),profileDraft('QA Patient','latex','')])assert.equal(profileMatchesSaved(draft,saved),false);
 assert.equal(profileMatchesSaved(profileDraft(' QA Patient ',' latex, ','090 000 0000'),saved),true);
});
