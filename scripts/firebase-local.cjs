const { spawn } = require('node:child_process');
const { root, localEnvironment, checkJava } = require('./local-runtime.cjs');
try {
  const mode = process.argv[2];
  if (!['start', 'test'].includes(mode)) throw new Error('Dùng npm run emulators hoặc npm run test:integration.');
  if (!process.env.npm_execpath) throw new Error('Chạy qua npm script trong README.');
  const env = localEnvironment(); checkJava(env);
  // Allow cold module discovery on Windows while Metro/TypeScript are also starting.
  env.FUNCTIONS_DISCOVERY_TIMEOUT ||= '60';
  const args = [process.env.npm_execpath, 'exec', '--yes', '--package=firebase-tools@15.34.0', '--', 'firebase',
    mode === 'start' ? 'emulators:start' : 'emulators:exec', '--project', 'demo-ehis-next', '--only', 'auth,firestore,functions'];
  if (mode === 'test') args.push('node scripts/run-integration.cjs');
  const child = spawn(process.execPath, args, { cwd: root, env, stdio: 'inherit', windowsHide: true });
  child.on('error', error => { console.error(error.message); process.exitCode = 1; });
  child.on('exit', code => { process.exitCode = code ?? 1; });
} catch (error) { console.error(error.message); process.exitCode = 1; }
