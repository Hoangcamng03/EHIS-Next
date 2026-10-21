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
  for (const script of ['scripts/smoke-starter.cjs', 'scripts/smoke-reports.cjs']) execFileSync(process.execPath, [script], { stdio: 'inherit' });
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
