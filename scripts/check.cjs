const { spawnSync } = require('node:child_process');
const { readdirSync } = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const npm = (folder, task) => [process.env.npm_execpath, '--prefix', folder, 'run', task];
if (!process.env.npm_execpath) throw new Error('Run npm run check');
const steps = [
  ['Repository and links', ['scripts/check-repository.cjs']],
  ['Shared contracts', ['scripts/check-shared-contracts.cjs']],
  ['App types', npm('frontend/app', 'typecheck')],
  ['App lint', npm('frontend/app', 'lint')],
  ['Web lint', npm('frontend/web', 'lint')],
  ['Web types', npm('frontend/web', 'typecheck')],
  ['Backend build', npm('backend', 'build')],
  ['Backend tests', npm('backend', 'test')],
  [
    'Client behavior tests',
    [
      '--test',
      ...readdirSync(path.join(root, 'scripts'))
        .filter((x) => /^test-.*\.cjs$/.test(x))
        .sort()
        .map((x) => 'scripts/' + x),
    ],
  ],
];
for (const [name, args] of steps) {
  console.log(`\n[CHECK] ${name}`);
  const start = performance.now(),
    r = spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit', windowsHide: true });
  console.log(
    `[${r.status === 0 ? 'PASS' : 'FAIL'}] ${name} (${Math.round(performance.now() - start)} ms)`,
  );
  if (r.status !== 0) process.exit(r.status || 1);
}
