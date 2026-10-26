// Cross-process authority check: local queue cannot reserve or bypass Firestore quota.
const {createRequire}=require('node:module'),path=require('node:path'),fs=require('node:fs');
const {spawn}=require('node:child_process'),{createHash,randomUUID}=require('node:crypto'),assert=require('node:assert/strict');
assert.equal(process.env.FIRESTORE_EMULATOR_HOST,'127.0.0.1:8180');
assert.equal(process.env.GCLOUD_PROJECT,'demo-ehis-next');
const req=createRequire(path.resolve(__dirname,'../backend/package.json'));
req('firebase-admin/app').initializeApp({projectId:'demo-ehis-next'});
const {getFirestore,Timestamp}=req('firebase-admin/firestore'),db=getFirestore();
const hash=s=>createHash('sha256').update(s).digest('hex');
async function worker(){
 const {enforceRequestBudget}=req('./lib/guards');
 process.send({ready:true});
 process.once('message',async({ip,prefix})=>{
  try{const results=await Promise.allSettled(Array.from({length:4},(_,i)=>enforceRequestBudget(prefix+i,'getMyAccess',ip)));
   process.send({accepted:results.filter(r=>r.status==='fulfilled').length,rejected:results.filter(r=>r.status==='rejected'&&r.reason.code==='resource-exhausted').length,unexpected:results.filter(r=>r.status==='rejected'&&r.reason.code!=='resource-exhausted').length});
  }catch(error){process.send({error:error.message});process.exitCode=1;}
  finally{await db.terminate();process.disconnect();}
 });
}
async function parent(){
 const group=randomUUID(),ip='synthetic-cross-process-'+group,children=[];
 try{
  const ready=await Promise.all([0,1].map(index=>new Promise((resolve,reject)=>{
   const child=spawn(process.execPath,[__filename,'--worker'],{windowsHide:true,env:process.env,stdio:['ignore','ignore','pipe','ipc']});children.push(child);
   child.once('error',reject);child.once('message',message=>message.ready?resolve(child):reject(Error('Worker did not initialize')));
   child.once('exit',code=>{if(code)reject(Error('Worker exited before initialization'));});
  })));
  if(Date.now()%60000>45000)await new Promise(resolve=>setTimeout(resolve,60000-Date.now()%60000+100));
  const minute=Math.floor(Date.now()/60000),ref=db.doc('_requestLimits/'+hash(`ip:${ip}:${minute}`));
  await ref.set({count:598,expiresAt:Timestamp.fromMillis(Date.now()+60000)});
  const results=await Promise.all(ready.map((child,index)=>new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>reject(Error('Cross-process budget test timed out')),15000);
   child.once('message',message=>{clearTimeout(timer);message.error?reject(Error(message.error)):resolve(message);});
   child.send({ip,prefix:`budget-${group}-${index}-`});
  })));
  assert.equal(Math.floor(Date.now()/60000),minute,'Retry this test if the actual minute changed during its bounded window');
  assert.equal(results.reduce((n,r)=>n+r.accepted,0),2);
  assert.equal(results.reduce((n,r)=>n+r.rejected,0),6);
  assert.equal(results.reduce((n,r)=>n+r.unexpected,0),0);
  assert.equal((await ref.get()).data().count,600,'Both processes share the same atomic quota');
  fs.mkdirSync('.local',{recursive:true});fs.writeFileSync('.local/budget-queue-proof.json',JSON.stringify({environment:'demo-ehis-next only',processes:2,attempts:8,accepted:2,rejected:6,finalCount:600,status:'PASS'},null,2));
  console.log('PASS budget queue: two independent processes, eight calls, exactly two remaining slots granted, six denied, shared counter exactly 600.');
 }finally{children.forEach(child=>{if(child.exitCode===null)child.kill();});await db.terminate();}
}
(process.argv.includes('--worker')?worker():parent()).catch(error=>{console.error(error.message);process.exitCode=1;});
