const { createRequire } = require('node:module');
const { randomBytes } = require('node:crypto');
const { mkdirSync, writeFileSync } = require('node:fs');
const path = require('node:path');
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8180';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9199';
const requireFunctions = createRequire(path.resolve(__dirname, '../backend/package.json'));
const { initializeApp } = requireFunctions('firebase-admin/app');
const { getAuth } = requireFunctions('firebase-admin/auth');
initializeApp({ projectId: 'demo-ehis-next' });
async function main() {
  const accounts = {};
  for (const role of ['patient', 'volunteer', 'admin']) {
    const email = `trial-${role}-${randomBytes(4).toString('hex')}@example.test`,
      password = `Trial-${randomBytes(12).toString('hex')}!`;
    const user = await getAuth().createUser({ email, password, emailVerified: true });
    if (role === 'admin') await getAuth().setCustomUserClaims(user.uid, { admin: true });
    accounts[role] = { email, password, uid: user.uid };
  }
  const folder = path.resolve(__dirname, '../.local');
  mkdirSync(folder, { recursive: true });
  writeFileSync(
    path.join(folder, 'complete-demo.json'),
    JSON.stringify(
      {
        environment: 'LOCAL EMULATORS ONLY',
        app: 'http://localhost:8082',
        admin: 'http://localhost:3100/admin',
        accounts,
      },
      null,
      2,
    ),
  );
  console.log(
    'Đã tạo 3 tài khoản hư cấu trong Emulator: Patient, TNV chưa duyệt và quản trị. Xem .local/complete-demo.json. Admin đối chiếu checklist và kỹ năng rồi duyệt trực tiếp. Không tạo hồ sơ/thẻ hoặc tự duyệt TNV.',
  );
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
