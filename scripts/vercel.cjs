const fs=require('node:fs');const path=require('node:path');const {spawnSync}=require('node:child_process');const {randomBytes}=require('node:crypto');
const root=path.resolve(__dirname,'..'), cwd=path.join(root,'backend');
const runtime=JSON.parse(fs.readFileSync(path.join(root,'.local/runtime.json'),'utf8').replace(/^\uFEFF/,''));
function run(args,input) {
 if(!runtime.vercelCli || !fs.existsSync(runtime.vercelCli)) throw new Error('Cấu hình vercelCli trong .local/runtime.json và đăng nhập CLI trước.');
 const result=spawnSync(process.execPath,[runtime.vercelCli,...args,'--scope','ehis-capstone'],{cwd,encoding:'utf8',windowsHide:true,...(input===undefined?{stdio:'inherit'}:{input,stdio:['pipe','pipe','pipe']})});
 if(result.status!==0) {
  if(input!==undefined) console.error('Vercel secret operation failed. Exit code:',result.status);
  throw new Error('Vercel operation failed; deployment not confirmed.');
 }
}
try {
 const mode=process.argv[2];
 if(mode==='link') run(['link','--yes','--team','ehis-capstone','--project','ehis-next-api-hc03']);
 else if(mode==='secrets') {
  if(process.argv[3]!=='--confirmed-runtime-access') throw new Error('Cần xác nhận quyền runtime.');
  const credential=JSON.parse(fs.readFileSync(path.join(root,'.local/ehis-runtime-service-account.json'),'utf8'));
  if(credential.project_id!=='ehis-next-20261021-hc03') throw new Error('Sai project service account');
  const secretFile=path.join(root,'.local/cron-secret.txt');
  if(!fs.existsSync(secretFile))fs.writeFileSync(secretFile,randomBytes(32).toString('hex'),{mode:0o600});
  for(const [name,value] of [['EHIS_SERVICE_ACCOUNT_JSON',JSON.stringify(credential)],['CRON_SECRET',fs.readFileSync(secretFile,'utf8').trim()]]) {
   run(['env','add',name,'--environment','production','--sensitive','--yes'],value);
   console.log('Stored Vercel production secret:',name,'(value hidden)');
  }
 } else if(mode==='push-config') {
  if(process.argv[3]!=='--confirmed-send-only') throw new Error('Cần xác nhận quyền gửi FCM.');
  run(['env','add','EHIS_FCM_ENABLED','--environment','production','--yes'],'true');
  console.log('FCM flag stored for the next deployment; no secret printed.');
 } else if(mode==='deploy') run(['deploy','--prod','--yes']);
 else throw new Error('Dùng link / secrets --confirmed-runtime-access / deploy.');
}catch(error){console.error(error.message);process.exitCode=1;}
