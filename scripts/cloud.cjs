const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { firebaseInvocation } = require('./firebase-cli.cjs');
const root = path.resolve(__dirname,'..');
const projectId = 'ehis-next-20261021-hc03';
const webUrl = `https://${projectId}.web.app`, appUrl = `https://${projectId}-app.web.app`;
function run(args, cwd = root, env = process.env) {
 const result = spawnSync(process.execPath,args,{cwd,env,stdio:'inherit',windowsHide:true});
 if(result.status !== 0) throw new Error('Bước thực hiện chưa thành công. Không tiếp tục deploy.');
}
function loadEnv(file) {
 const result = {};
 for (const line of fs.readFileSync(file,'utf8').split(/\r?\n/)) { const match = line.match(/^([A-Z_]+)=(.*)$/); if(match) result[match[1]] = match[2]; }
 return result;
}
async function main() {
 const mode = process.argv[2]; fs.mkdirSync(path.join(root,'.local'),{recursive:true});
 if(mode === 'configure') {
  const backend = process.argv[3];
  const url = new URL(backend);
  if(url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || !url.pathname.endsWith('/api')) throw new Error('Cần backend HTTPS đã xác nhận, kết thúc bằng /api.');
  const localConfig = path.join(root,'.local/cloud-sdk.json');
  if(!fs.existsSync(localConfig)) {
   const result = spawnSync(process.execPath,firebaseInvocation(['apps:sdkconfig','WEB','1:567075088954:web:03cd618db0172c3e60a303','--project',projectId,'--json']),{cwd:root,encoding:'utf8',windowsHide:true});
   if(result.status !== 0) throw new Error('Chưa tải được cấu hình Firebase.');
   fs.writeFileSync(localConfig,result.stdout);
  }
  const config = JSON.parse(fs.readFileSync(localConfig,'utf8').replace(/^\uFEFF/,'')).result.sdkConfig;
  if(config.projectId !== projectId || !config.apiKey || !config.appId) throw new Error('Sai cấu hình project.');
  const values = { FIREBASE_PROJECT_ID:projectId,FIREBASE_API_KEY:config.apiKey,FIREBASE_APP_ID:config.appId,FIREBASE_AUTH_DOMAIN:config.authDomain,USE_EMULATORS:'false',TRIAL_MODE:'true',BACKEND_URL:backend.replace(/\/+$/,''),HEALTH_URL:`${backend}/health` };
  for(const [folder,prefix] of [['frontend/app','EXPO_PUBLIC_'],['frontend/web','NEXT_PUBLIC_']]) {
   const extras = folder === 'frontend/app' ? {BYSTANDER_URL:webUrl} : {APP_URL:appUrl};
   fs.writeFileSync(path.join(root,folder,'.env.cloud.local'),Object.entries({...values,...extras}).map(([key,value])=>`${prefix}${key}=${value}`).join('\n')+'\n');
  }
  fs.writeFileSync(path.join(root,'.local/cloud-target.json'),JSON.stringify({projectId,backend,webUrl,appUrl},null,2));
  console.log('Cloud client configuration saved locally. No credentials printed or committed.'); return;
 }
 if(mode === 'build') {
  if(!process.env.npm_execpath) throw new Error('Chạy qua npm script.');
  for(const folder of ['frontend/web','frontend/app']) {
   const env = {...process.env,...loadEnv(path.join(root,folder,'.env.cloud.local'))};
   if(env[folder === 'frontend/web' ? 'NEXT_PUBLIC_USE_EMULATORS':'EXPO_PUBLIC_USE_EMULATORS'] !== 'false') throw new Error('Cloud build must not use emulators.');
   if(folder === 'frontend/web') { env.EHIS_STATIC_EXPORT = 'true'; run([process.env.npm_execpath,'run','build'],path.join(root,folder),env); }
   else run([path.join(root,'frontend/app/node_modules/expo/bin/cli'),'export','--clear','--platform','web','--output-dir','.local/cloud-app'],path.join(root,folder),env);
  }
  return;
 }
 if(mode === 'deploy-web' || mode === 'probe') {
  const target = JSON.parse(fs.readFileSync(path.join(root,'.local/cloud-target.json'),'utf8'));
  if(target.projectId !== projectId) throw new Error('Wrong cloud target');
  const response = await fetch(`${target.backend}/health`,{signal:AbortSignal.timeout(30000)});
  const health = await response.json();
  if(!response.ok || health.service !== 'ehis-next' || health.status !== 'ok' || health.projectId !== projectId) throw new Error('Chưa xác nhận backend đúng project. Chưa phát hành frontend.');
  const unauth = await fetch(`${target.backend}/getMyAccess`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({data:{}}),signal:AbortSignal.timeout(30000)});
  if(unauth.status !== 401) throw new Error('Backend chưa từ chối yêu cầu không đăng nhập.');
  console.log('Cloud backend health/project and unauthenticated denial passed.');
  if(mode === 'deploy-web') {
   for(const entry of ['frontend/web/.next-cloud/index.html','frontend/web/.next-cloud/card.html','frontend/web/.next-cloud/report.html','frontend/app/.local/cloud-app/index.html']) if(!fs.existsSync(path.join(root,entry))) throw new Error('Chưa có artifact cloud: '+entry);
   run(firebaseInvocation(['deploy','--only','hosting','--project',projectId,'--non-interactive']));
  }
  return;
 }
 throw new Error('Dùng configure <backend-url>/build/probe/deploy-web.');
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
