const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
async function main(){
 const root=path.resolve(__dirname,'..'),target=JSON.parse(fs.readFileSync(path.join(root,'.local/cloud-target.json'),'utf8'));
 assert.equal(target.projectId,'ehis-next-20261021-hc03');
 const url=new URL('/internal/maintenance',target.backend);
 assert.equal((await fetch(url)).status,401);
 const secret=fs.readFileSync(path.join(root,'.local/cron-secret.txt'),'utf8').trim();
 const response=await fetch(url,{headers:{Authorization:'Bearer '+secret},signal:AbortSignal.timeout(60000)});
 assert.equal(response.status,200,'Cloud maintenance must be authenticated and indexes ready');
 const result=await response.json();
 console.log('PASS cloud maintenance endpoint and indexes:',JSON.stringify(result));
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
