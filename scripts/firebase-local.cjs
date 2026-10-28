const { spawn } = require('node:child_process');
const { existsSync } = require('node:fs');
const path = require('node:path');
const { root, localEnvironment, checkJava } = require('./local-runtime.cjs');
const { firebaseInvocation } = require('./firebase-cli.cjs');
try {
  const mode = process.argv[2];
  if (!['start', 'test', 'snapshot'].includes(mode)) throw new Error('Dùng npm run emulators, npm run trial:snapshot hoặc npm run test:integration.');
  if (!process.env.npm_execpath) throw new Error('Chạy qua npm script trong README.');
  const env = localEnvironment(); checkJava(env);
  // Allow cold module discovery on Windows while Metro/TypeScript are also starting.
  env.FUNCTIONS_DISCOVERY_TIMEOUT ||= '60';
  const args = [mode === 'start' ? 'emulators:start' : 'emulators:exec', '--project', 'demo-ehis-next', '--only', 'auth,firestore,functions'];
  if (mode === 'snapshot') args.splice(0, args.length, 'emulators:export', path.join(root, '.local', 'emulator-data'), '--project', 'demo-ehis-next', '--force');
  else if (mode === 'test') { const suite=process.argv[3]||'all'; if(!['all','active','multi','scale','verification'].includes(suite))throw new Error('Unknown test suite'); args.push(`node scripts/run-integration.cjs ${suite}`); }
  else {
    const snapshot = path.join(root, '.local', 'emulator-data');
    if (existsSync(path.join(snapshot, 'firebase-export-metadata.json'))) args.push('--import', snapshot);
    args.push('--export-on-exit', snapshot);
  }
  const child = spawn(process.execPath, firebaseInvocation(args), { cwd: root, env, stdio: 'inherit', windowsHide: true });
  child.on('error', error => { console.error(error.message); process.exitCode = 1; });
  child.on('exit', code => { process.exitCode = code ?? 1; });
} catch (error) { console.error(error.message); process.exitCode = 1; }
