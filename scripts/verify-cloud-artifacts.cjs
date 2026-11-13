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
    ['https://ehis-next-20261021-hc03.web.app','frontend/web/.next-cloud'],
    ['https://ehis-next-20261021-hc03-app.web.app','frontend/app/.local/cloud-app'],
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
  await check('https://ehis-next-20261021-hc03-app.firebaseapp.com/volunteer','frontend/app/.local/cloud-app/index.html');checked++;
  const release=JSON.parse(fs.readFileSync('frontend/web/src/config/releases.json','utf8')).android;
  assert.equal(release.qrTarget,release.apkUrl,'QR and download must target the same verified APK');
  assert.equal(hash(fs.readFileSync('frontend/web/public/ehis-download-qr.png')),release.qrSha256,'QR metadata drift');
  const install=fs.readFileSync('frontend/web/.next-cloud/install.html','utf8');
  assert.ok(install.includes(release.apkUrl)&&install.includes('ehis-download-qr.png'),'Install export must include APK and QR');
  let qrChecks=0;
  for(const base of ['https://ehis-next-20261021-hc03.web.app','https://ehis-next-20261021-hc03.firebaseapp.com']){
    for(const ext of ['png','svg']){
      const file=`frontend/web/public/ehis-download-qr.${ext}`;
      assert.equal(hash(fs.readFileSync(file)),hash(fs.readFileSync(`frontend/web/.next-cloud/ehis-download-qr.${ext}`)),'QR export drift');
      await check(`${base}/ehis-download-qr.${ext}?v=${release.version}`,file);qrChecks++;
    }
  }
  fs.mkdirSync('.local',{recursive:true});
  fs.writeFileSync('.local/cloud-artifact-proof.json',JSON.stringify({checkedAt:new Date().toISOString(),checked,qrChecks,qrVersion:release.version,qrTarget:release.qrTarget,sha256Match:true,targets:targets.map(([url])=>url)},null,2));
  console.log(`PASS ${checked} deployed HTML/JS/CSS checks and ${qrChecks} QR checks: bytes match local build artifacts.`);
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
