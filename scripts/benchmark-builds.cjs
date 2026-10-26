// Run separately from the API benchmark so competing compilation cannot bias latency.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');const {gzipSync}=require('node:zlib');
const root=path.resolve(__dirname,'..'),out=path.join(root,'.local/performance');
assert.ok(process.env.npm_execpath,'Use npm run perf:builds');fs.mkdirSync(out,{recursive:true});
const flag=process.argv.indexOf('--baseline'),baseline=path.resolve(flag<0?path.join(root,'../ehis-next-baseline'):process.argv[flag+1]);
const targets={baseline:{root:baseline,app:'mobile',web:'web',backend:'functions'},current:{root,app:'frontend/app',web:'frontend/web',backend:'backend'}};
if(fs.existsSync(path.join(baseline,'backend')))Object.assign(targets.baseline,{app:'frontend/app',web:'frontend/web',backend:'backend'});
const onlyAt=process.argv.indexOf('--only'),only=onlyAt<0?null:process.argv[onlyAt+1];
assert.ok(only===null||['backend','web','android'].includes(only),'--only accepts backend, web or android');
const rows=only?JSON.parse(fs.readFileSync(path.join(out,'build-comparison.json'),'utf8')).rows.filter(r=>r.task!==only):[];
function run(variant,task,round){const t=targets[variant],folder=path.join(t.root,t[task==='backend'?'backend':task==='web'?'web':'app']);
 const args=task==='backend'||task==='web'?[process.env.npm_execpath,'run','build']:[path.join(folder,'node_modules/expo/bin/cli'),'export','--platform',task==='android'?'android':'web','--output-dir',task==='android'?'.local/perf-android':'.local/perf-web'];
 const fd=fs.openSync(path.join(out,`build-${variant}-${task}-${round}.log`),'w'),start=performance.now();
 const result=spawnSync(process.execPath,args,{cwd:folder,env:{...process.env,CI:'1',EHIS_STATIC_EXPORT:'false',NEXT_TELEMETRY_DISABLED:'1'},windowsHide:true,stdio:['ignore',fd,fd],timeout:180000});fs.closeSync(fd);
 assert.equal(result.status,0,`${variant}/${task}/${round} failed; inspect its local log`);
 const row={variant,task,round,ms:Math.round(performance.now()-start)};rows.push(row);console.log(JSON.stringify(row));return row;
}
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
function payload(dir,type){const files=walk(dir),selected=files.filter(f=>type==='android'?f.endsWith('.hbc'):f.endsWith('.js'));return {files:selected.length,bytes:selected.reduce((n,f)=>n+fs.statSync(f).size,0),gzipBytes:type==='android'?null:selected.reduce((n,f)=>n+gzipSync(fs.readFileSync(f)).length,0),totalExportBytes:files.reduce((n,f)=>n+fs.statSync(f).size,0)};}
for(const task of (only?[only]:['backend','web','android'])){
 for(const variant of ['baseline','current'])run(variant,task,'warmup');
 for(const [i,variant]of ['baseline','current','current','baseline','baseline','current'].entries())run(variant,task,i);
}
if(!only)for(const variant of ['baseline','current'])run(variant,'appWeb','payload-only');
const median=a=>{const s=[...a].sort((x,y)=>x-y),i=Math.floor(s.length/2);return s.length%2?s[i]:(s[i-1]+s[i])/2;};
const builds={};for(const variant of ['baseline','current']){builds[variant]={};for(const task of ['backend','web','android']){const times=rows.filter(r=>r.variant===variant&&r.task===task&&r.round!=='warmup').map(r=>r.ms);builds[variant][task]={samples:times,medianMs:median(times),minMs:Math.min(...times),maxMs:Math.max(...times)};}}
const payloads={};for(const [name,t]of Object.entries(targets))payloads[name]={web:payload(path.join(t.root,t.web,'.next/static'),'web'),appWeb:payload(path.join(t.root,t.app,'.local/perf-web'),'web'),android:payload(path.join(t.root,t.app,'.local/perf-android'),'android')};
const comparisons=Object.keys(builds.baseline).map(task=>{const b=builds.baseline[task].medianMs,c=builds.current[task].medianMs;return {task,baselineMedianMs:b,currentMedianMs:c,changePercent:Math.round((c/b-1)*1000)/10,status:c<=Math.max(b*1.2,b+1000)?'PASS':'RECHECK'};});
const payloadChecks=Object.keys(payloads.baseline).map(task=>{const key=task==='android'?'bytes':'gzipBytes',b=payloads.baseline[task][key],c=payloads.current[task][key];return {task,metric:key,baseline:b,current:c,changePercent:Math.round((c/b-1)*10000)/100,status:c<=b*1.05?'PASS':'RECHECK'};});
const report={scope:'Same-machine warm builds and static payload, not device startup/FPS/battery',node:process.version,threshold:'Build median <= max(baseline*1.20,baseline+1000ms); payload <= baseline*1.05',rows,builds,payloads,comparisons,payloadChecks};
fs.writeFileSync(path.join(out,'build-comparison.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({comparisons,payloadChecks}));if([...comparisons,...payloadChecks].some(r=>r.status!=='PASS'))process.exitCode=2;
