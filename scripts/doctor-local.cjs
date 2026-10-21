const { existsSync, readFileSync } = require('node:fs');
const path = require('node:path');
const { root, localEnvironment, checkJava } = require('./local-runtime.cjs');
let failures = 0;
function check(label, operation) {
  try { console.log(`OK ${label}: ${operation() || 'sẵn sàng'}`); }
  catch (error) { failures++; console.error(`FAIL ${label}: ${error.message}`); }
}
check('Node', () => {
  const [major, minor] = process.versions.node.split('.').map(Number);
  if (!((major === 22 && minor >= 13) || (major === 24 && minor >= 3) || major >= 26)) throw new Error('Dùng Node 22.13+ LTS; CI dùng Node 22.');
  return process.version;
});
check('Java', () => `Java ${checkJava(localEnvironment())}`);
for (const moduleName of ['functions', 'web', 'mobile']) check(`Thư viện ${moduleName}`, () => {
  const packageName = moduleName === 'functions' ? 'firebase-admin' : moduleName === 'web' ? 'next' : 'expo';
  if (!existsSync(path.join(root, moduleName, 'node_modules', packageName, 'package.json'))) throw new Error(`Chạy npm --prefix ${moduleName} ci`);
});
for (const [moduleName, prefix] of [['web', 'NEXT_PUBLIC'], ['mobile', 'EXPO_PUBLIC']]) check(`Môi trường ${moduleName}`, () => {
  const file = path.join(root, moduleName, '.env.local');
  if (!existsSync(file)) throw new Error('Chạy npm run setup:local');
  const config = Object.fromEntries(readFileSync(file, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/).filter(line => line && !line.startsWith('#')).map(line => { const at = line.indexOf('='); return [line.slice(0, at), line.slice(at + 1).trim()]; }));
  if (config[`${prefix}_FIREBASE_PROJECT_ID`] !== 'demo-ehis-next' || config[`${prefix}_USE_EMULATORS`] !== 'true') throw new Error('Đây là doctor cho local: yêu cầu demo-ehis-next + USE_EMULATORS=true. Không tự sửa cấu hình cloud.');
  if (!config[`${prefix}_FIREBASE_API_KEY`] || !config[`${prefix}_FIREBASE_APP_ID`] || !config[`${prefix}_EMULATOR_HOST`]) throw new Error('Thiếu cấu hình Firebase hoặc host.');
  return 'demo-ehis-next, Emulator';
});
console.log(failures ? `Chưa sẵn sàng: ${failures} mục cần sửa.` : 'Sẵn sàng khởi động local. Chưa xác nhận thiết bị, APK hoặc cloud.');
process.exitCode = failures ? 1 : 0;
