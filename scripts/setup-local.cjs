const { copyFileSync, existsSync } = require('node:fs');
const path = require('node:path');
const { root } = require('./local-runtime.cjs');
for (const moduleName of ['frontend/web', 'frontend/app']) {
  const target = path.join(root, moduleName, '.env.local');
  if (existsSync(target)) console.log(`${moduleName}: giữ nguyên .env.local đang có.`);
  else { copyFileSync(path.join(root, moduleName, '.env.example'), target); console.log(`${moduleName}: tạo .env.local cho demo-ehis-next.`); }
}
console.log('Tiếp theo: npm run doctor:local. Không tạo tài nguyên cloud hoặc bật thanh toán.');
