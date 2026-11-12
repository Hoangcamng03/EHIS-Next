const { spawn, spawnSync } = require('node:child_process'),
  path = require('node:path');
const root = path.resolve(__dirname, '..');
(async () => {
  if (process.env.GCLOUD_PROJECT !== 'demo-ehis-next')
    throw Error('Use npm run test:ui with local emulators');
  const probe = require('node:net').createServer();
  await new Promise((resolve, reject) => {
    probe.once('error', reject);
    probe.listen(5201, '127.0.0.1', () => probe.close(resolve));
  });
  const server = spawn(process.execPath, ['backend/server.cjs'], {
    cwd: root,
    stdio: 'ignore',
    windowsHide: true,
    env: {
      ...process.env,
      PORT: '5201',
      VERCEL: '',
      EHIS_SERVICE_ACCOUNT_JSON: '',
      GOOGLE_APPLICATION_CREDENTIALS: '',
    },
  });
  try {
    let ready = false;
    for (let i = 0; i < 60; i++) {
      try {
        ready = (await fetch('http://127.0.0.1:5201/api/health')).ok;
        if (ready) break;
      } catch {}
      await new Promise((r) => setTimeout(r, 250));
    }
    if (!ready) throw Error('Portable API not ready');
    for (const args of [
      ['scripts/test-support/ui-fixtures.cjs'],
      [
        'frontend/web/node_modules/@playwright/test/cli.js',
        'test',
        '--config',
        'frontend/web/playwright.config.ts',
      ],
    ]) {
      const r = spawnSync(process.execPath, args, {
        cwd: root,
        stdio: 'inherit',
        windowsHide: true,
      });
      if (r.status !== 0) {
        process.exitCode = r.status || 1;
        break;
      }
    }
  } finally {
    server.kill();
  }
})().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
