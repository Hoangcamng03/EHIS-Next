// Read-only release check. Run after cloud:build and cloud:deploy-web.
const fs = require('node:fs'), path = require('node:path');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const hash = buffer => createHash('sha256').update(buffer).digest('hex');
function files(folder) {
  return fs.readdirSync(folder,{withFileTypes:true}).flatMap(entry=>{
    const file=path.join(folder,entry.name);
    return entry.isDirectory()?files(file):[file];
  });
}
async function check(url, file) {
  const response=await fetch(url,{signal:AbortSignal.timeout(30000)});
  assert.equal(response.status,200,url);
  assert.equal(hash(Buffer.from(await response.arrayBuffer())),hash(fs.readFileSync(file)),`Artifact mismatch: ${url}`);
}
async function main() {
  const targets=[
    ['https://ehis-next-20261021-hc03.web.app','web/.next-cloud'],
    ['https://ehis-next-20261021-hc03-app.web.app','mobile/.local/cloud-app'],
  ];
  let checked=0;
  for(const [base,folder] of targets){
    for(const file of files(folder).filter(file=>/\.(html|js|css)$/.test(file))){
      const relative=path.relative(folder,file).split(path.sep).join('/');
      const route=relative==='index.html'?'/':relative.endsWith('.html')?'/'+relative.slice(0,-5):'/'+relative;
      // Next's exported 404 is served with an intentional HTTP 404, not a 200.
      if(relative==='404.html'||relative==='_not-found.html'||relative.startsWith('404/')) continue;
      await check(base+route,file);checked++;
    }
  }
  await check('https://ehis-next-20261021-hc03-app.firebaseapp.com/volunteer','mobile/.local/cloud-app/index.html');checked++;
  fs.mkdirSync('.local',{recursive:true});
  fs.writeFileSync('.local/cloud-artifact-proof.json',JSON.stringify({checkedAt:new Date().toISOString(),checked,sha256Match:true,targets:targets.map(([url])=>url)},null,2));
  console.log(`PASS ${checked} deployed HTML/JS/CSS checks: bytes match local build artifacts.`);
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
