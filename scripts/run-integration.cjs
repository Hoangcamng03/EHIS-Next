const { execFileSync } = require('node:child_process');
async function main() {
  const deadline = Date.now() + 90000;
  let ready = false;
  while (Date.now() < deadline) {
    try {
      const response = await fetch('http://127.0.0.1:5101/demo-ehis-next/asia-southeast1/health', { signal: AbortSignal.timeout(3000) });
      if (response.ok && (await response.json()).service === 'ehis-next') { ready = true; break; }
    } catch { /* A listening emulator port does not yet imply loaded Functions. */ }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  if (!ready) throw new Error('Functions chưa sẵn sàng sau 90 giây. Kiểm tra log discovery, Java và port trước khi chạy lại.');
  const suites={all:['scripts/smoke-starter.cjs', 'scripts/smoke-reports.cjs', 'scripts/smoke-lifecycle.cjs', 'scripts/smoke-maintenance.cjs', 'scripts/smoke-portable.cjs', 'scripts/smoke-location-updates.cjs', 'scripts/smoke-multi-incident.cjs', 'scripts/smoke-active-alert.cjs', 'scripts/smoke-budget-queue.cjs'],active:['scripts/smoke-active-alert.cjs'],multi:['scripts/smoke-multi-incident.cjs']};
  suites.scale = ['scripts/smoke-scale.cjs'];
  const suite=process.argv[2]||'all';if(!suites[suite])throw Error('Unknown test suite');
  for (const script of suites[suite]) execFileSync(process.execPath, [script], { stdio: 'inherit' });
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
