const fs = require('node:fs'),
  path = require('node:path');
const { pathToFileURL } = require('node:url'),
  { createRequire } = require('node:module');
const dir = path.resolve(__dirname, '../.local/flow-final');
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
(async () => {
  const data = JSON.parse(fs.readFileSync(path.join(dir, 'flow.json'), 'utf8'));
  const groups = [...new Set(data.steps.map((step) => step.scenario))];
  for (const step of data.steps)
    if (!/^\d{2}\.png$/.test(step.image) || !fs.existsSync(path.join(dir, step.image)))
      throw Error('Missing or invalid captured image');
  const sections = groups
    .map((group) => {
      const steps = data.steps.filter((step) => step.scenario === group);
      return `<section><h2>${escape(group)}</h2><p class="flow">${steps.map((step) => escape(step.title)).join(' → ')}</p><div class="grid">${steps.map((step) => `<article><div class="top"><span>${String(step.number).padStart(2, '0')}</span><b>${escape(step.role)}</b></div><h3>${escape(step.title)}</h3><p>${escape(step.action)}</p><a href="${step.image}" target="_blank" rel="noopener"><img src="${step.image}" alt="${escape(step.title)}" loading="eager"></a><small>${step.width}×${step.height} · Ảnh thao tác thực trên trình duyệt</small></article>`).join('')}</div></section>`;
    })
    .join('');
  fs.writeFileSync(
    path.join(dir, 'index.html'),
    `<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>EHIS · Quy trình sử dụng</title><style>
 *{box-sizing:border-box}body{margin:0;background:#f3f6fa;color:#18344b;font:16px/1.5 Arial,sans-serif}main{max-width:1280px;margin:auto;padding:28px}header{padding:24px;background:#153d63;color:white;border-radius:18px}h1{margin:0 0 8px;font-size:32px}header p{margin:6px 0}.status{font-weight:bold}.flow{padding:16px;background:#e7eef6;border-radius:12px;font-weight:600}section{margin:32px 0}.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px}article{padding:14px;background:white;border:1px solid #bfd0df;border-radius:14px;display:flex;flex-direction:column}article h3{font-size:18px;margin:12px 0 4px}article p{font-size:14px;min-height:64px}article img{width:100%;height:auto;display:block;border:1px solid #c7d4df;border-radius:10px}.top{display:flex;gap:8px;align-items:center}.top span{background:#165ba2;color:white;padding:4px 8px;border-radius:8px}small{font-size:12px;color:#52697d;margin-top:8px}.warning{padding:14px;background:#fff0d3;color:#674200;border-radius:12px}@media(max-width:900px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:500px){.grid{grid-template-columns:1fr}main{padding:14px}}@media print{article{break-inside:avoid}header{color:#18344b;background:white}.grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
 </style><main><header><h1>EHIS · Quy trình sử dụng</h1><p>Đăng ký, xác minh, báo hỗ trợ, tiếp nhận và kết thúc</p><p class="status">${data.status === 'PASS' ? 'Đã đi hết các bước và nhánh trong bộ flow này.' : 'Luồng chưa hoàn tất — xem phần dừng bên dưới.'}</p></header><p class="warning">Ghi nhận trên môi trường local, dùng hồ sơ hư cấu và vị trí trình duyệt cấu hình. Đây là bằng chứng thao tác phần mềm, chưa thay thế nghiệm thu GPS, chuông hoặc thiết bị Android thật. Bấm ảnh để xem kích thước đầy đủ.</p>${data.error ? `<p class="warning">${escape(data.error)}</p>` : ''}${sections}</main></html>`,
  );
  const req = createRequire(path.resolve(__dirname, '../frontend/web/package.json'));
  const { chromium } = req('@playwright/test');
  const browser = await chromium.launch(
    process.env.EHIS_BROWSER_EXECUTABLE
      ? { executablePath: process.env.EHIS_BROWSER_EXECUTABLE }
      : {},
  );
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(pathToFileURL(path.join(dir, 'index.html')).href);
    await page.evaluate(() =>
      Promise.all(
        [...document.images].map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise((resolve) => {
                img.onload = resolve;
                img.onerror = resolve;
              }),
        ),
      ),
    );
    await page.screenshot({ path: path.join(dir, 'contact-sheet.png'), fullPage: true });
  } finally {
    await browser.close();
  }
  console.log(
    JSON.stringify({
      status: data.status,
      images: data.steps.length,
      gallery: path.join(dir, 'index.html'),
    }),
  );
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
