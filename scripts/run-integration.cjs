const { execFileSync } = require('node:child_process');
for (const script of ['scripts/smoke-starter.cjs', 'scripts/smoke-reports.cjs']) {
  execFileSync(process.execPath, [script], { stdio: 'inherit' });
}
