// Runs only after APK verification. One current download configuration and QR pair.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const { createHash } = require('node:crypto');
const root = path.resolve(__dirname, '..');

async function publishAndroidDownload(record) {
  const configFile = path.join(root, 'frontend/web/src/config/releases.json');
  const native = JSON.parse(fs.readFileSync(path.join(root, 'frontend/app/app.json'), 'utf8')).expo;
  assert.equal(record.status, 'FINISHED');
  assert.equal(record.artifactVerified, true);
  assert.equal(record.version, native.version);
  assert.equal(record.versionCode, native.android.versionCode);
  assert.equal(record.packageName, native.android.package);
  assert.match(record.sha256, /^[a-f0-9]{64}$/);
  assert.ok(record.apkUrl.startsWith('https://expo.dev/artifacts/eas/') && record.apkUrl.endsWith('.apk'));
  const binary = fs.readFileSync(path.join(root, '.local/releases', `EHIS-Next-v${record.version}.apk`));
  assert.equal(createHash('sha256').update(binary).digest('hex'), record.sha256);
  // Resolve the QR generator already pinned in the app lockfile; no extra install.
  const qrRequire = createRequire(require.resolve('react-native-qrcode-svg/package.json', {
    paths: [path.join(root, 'frontend/app')],
  }));
  const qr = qrRequire('qrcode');
  const folder = path.join(root, 'frontend/web/public');
  const png = await qr.toBuffer(record.apkUrl, { type: 'png', width: 768, margin: 4, errorCorrectionLevel: 'M' });
  const svg = await qr.toString(record.apkUrl, { type: 'svg', margin: 4, errorCorrectionLevel: 'M' });
  fs.writeFileSync(path.join(folder, 'ehis-download-qr.png'), png);
  fs.writeFileSync(path.join(folder, 'ehis-download-qr.svg'), svg);
  const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
  config.android = {
    version: record.version,
    apkUrl: record.apkUrl,
    buildUrl: record.url,
    qrTarget: record.apkUrl,
    qrSha256: createHash('sha256').update(png).digest('hex'),
  };
  fs.writeFileSync(configFile, JSON.stringify(config, null, 2) + '\n');
  console.log(`Download link and QR updated together: Android ${record.version}. Not a phone scan/installation test.`);
}
module.exports = { publishAndroidDownload };
if (require.main === module) {
  const record = JSON.parse(fs.readFileSync(path.join(root, '.local/android-trial-artifact.json'), 'utf8'));
  publishAndroidDownload(record).catch(error => { console.error(error.message); process.exitCode = 1; });
}
