const { spawn } = require('node:child_process');
const { existsSync } = require('node:fs');
const path = require('node:path');
const { root, localEnvironment, checkJava } = require('./local-runtime.cjs');
const { firebaseInvocation } = require('./firebase-cli.cjs');
async function main() {
  const mode = process.argv[2];
  if (!['start', 'test', 'snapshot'].includes(mode)) throw new Error('Dùng npm run emulators, npm run trial:snapshot hoặc npm run test:integration.');
  if (!process.env.npm_execpath) throw new Error('Chạy qua npm script trong README.');
  const env = localEnvironment(); checkJava(env);
  // Allow cold module discovery on Windows while Metro/TypeScript are also starting.
  env.FUNCTIONS_DISCOVERY_TIMEOUT ||= '60';
  const args = [mode === 'start' ? 'emulators:start' : 'emulators:exec', '--project', 'demo-ehis-next', '--only', 'auth,firestore,functions'];
  if (mode === 'snapshot') args.splice(0, args.length, 'emulators:export', path.join(root, '.local', 'emulator-data'), '--project', 'demo-ehis-next', '--force');
  else if (mode === 'test') { const suite=process.argv[3]||'all'; if(!['all','active','multi','scale','verification','health','handover'].includes(suite))throw new Error('Unknown test suite'); args.push(`node scripts/run-integration.cjs ${suite}`); }
  else {
    const snapshot = path.join(root, '.local', 'emulator-data');
    if (existsSync(path.join(snapshot, 'firebase-export-metadata.json'))) args.push('--import', snapshot);
    args.push('--export-on-exit', snapshot);
  }
  let backend;
  if (mode === 'start') {
    // Refuse occupied ports: never reuse or terminate a server owned by another task.
    await new Promise((resolve,reject) => {
      const probe = require('node:net').createServer();
      probe.once('error', () => reject(new Error('Cổng backend local 5201 đang được dùng. Dừng đúng phiên EHIS cũ trước khi chạy lại.')));
      probe.listen(5201, '127.0.0.1', () => probe.close(resolve));
    });
    backend = spawn(process.execPath, ['backend/server.cjs'], { cwd: root, stdio: 'inherit', windowsHide: true,
      env: { ...env, GCLOUD_PROJECT: 'demo-ehis-next', GOOGLE_CLOUD_PROJECT: 'demo-ehis-next',
        FIREBASE_CONFIG: JSON.stringify({ projectId:'demo-ehis-next' }),
        FIRESTORE_EMULATOR_HOST:'127.0.0.1:8180', FIREBASE_AUTH_EMULATOR_HOST:'127.0.0.1:9199',
        EHIS_SERVICE_ACCOUNT_JSON:'', GOOGLE_APPLICATION_CREDENTIALS:'', VERCEL:'', PORT:'5201' } });
    backend.on('error', error => { console.error(error.message); process.exitCode = 1; });
  }
  const child = spawn(process.execPath, firebaseInvocation(args), { cwd: root, env, stdio: 'inherit', windowsHide: true });
  const stopBackend = () => { if (backend && backend.exitCode === null) backend.kill(); };
  process.once('exit', stopBackend);
  for (const signal of ['SIGINT','SIGTERM']) process.once(signal, () => { stopBackend(); child.kill(signal); });
  child.on('error', error => { console.error(error.message); process.exitCode = 1; });
  child.on('exit', code => { stopBackend(); process.exitCode = code ?? 1; });
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
