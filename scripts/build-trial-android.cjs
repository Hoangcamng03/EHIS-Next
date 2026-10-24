// Builds an APK for controlled device testing. Does not publish OTA or store releases.
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const {easInvocation}=require('./eas-cli.cjs');
const root=path.resolve(__dirname,'..'),mobile=path.join(root,'mobile'),recordFile=path.join(root,'.local/android-trial-build.json');
function run(command,args,cwd=root){const r=spawnSync(command,args,{cwd,encoding:'utf8',windowsHide:true,maxBuffer:20*1024*1024,env:{...process.env,EXPO_NO_DOTENV:'1'},stdio:['ignore','pipe','inherit']});if(r.status!==0)throw Error('Command did not complete: '+args[0]);return r.stdout;}
function eas(args){return JSON.parse(run(process.execPath,easInvocation(args),mobile).replace(/^\uFEFF/,''));}
try {
 const mode=process.argv[2]||'status';let record=fs.existsSync(recordFile)?JSON.parse(fs.readFileSync(recordFile,'utf8')):null;
 if(mode==='start'){
  if(run('git',['status','--porcelain']).trim())throw Error('Commit reviewed source before building.');
  const config=JSON.parse(fs.readFileSync(path.join(mobile,'app.json'),'utf8')).expo;
  const previous=eas(['build:list','--build-profile','preview','--platform','android','--status','finished','--limit','1','--json','--non-interactive'])[0];
  if(config.android.versionCode<=Number(previous?.appBuildVersion||0))throw Error('Increase Android versionCode before a new APK.');
  const result=eas(['build','--platform','android','--profile','preview','--non-interactive','--no-wait','--json']);
  const build=Array.isArray(result)?result[0]:result;if(!build?.id)throw Error('No build id confirmed.');
  record={id:build.id,commit:run('git',['rev-parse','HEAD']).trim(),version:config.version,versionCode:config.android.versionCode,status:build.status,url:`https://expo.dev/accounts/ehiss-team/projects/ehis-next/builds/${build.id}`,startedAt:new Date().toISOString(),deviceVerified:false};
 }else if(mode==='status'){
  if(!record?.id)throw Error('No trial build recorded.');
  const build=eas(['build:view',record.id,'--json']);record.status=build.status;
  if(build.status==='FINISHED'){
   if(build.gitCommitHash!==record.commit||build.appVersion!==record.version||Number(build.appBuildVersion)!==record.versionCode)throw Error('Finished build does not match the recorded source/version.');
   const url=build.artifacts?.applicationArchiveUrl||build.artifacts?.buildUrl;
   if(!url?.startsWith('https://expo.dev/artifacts/eas/')||!url.endsWith('.apk'))throw Error('Finished build has no expected APK artifact.');
   record.apkUrl=url;
  }
 }else throw Error('Use start or status.');
 fs.mkdirSync(path.dirname(recordFile),{recursive:true});fs.writeFileSync(recordFile,JSON.stringify(record,null,2)+'\n');console.log(JSON.stringify(record,null,2));
}catch(error){console.error(error.message);process.exitCode=1;}
