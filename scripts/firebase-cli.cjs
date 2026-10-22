const { existsSync, readFileSync } = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
function firebaseInvocation(args) {
  const file = path.join(root, '.local/runtime.json');
  const local = existsSync(file) ? JSON.parse(readFileSync(file,'utf8').replace(/^\uFEFF/,'')) : {};
  if (local.firebaseCli && existsSync(local.firebaseCli)) return [local.firebaseCli, ...args];
  if (!process.env.npm_execpath) throw new Error('Chạy công cụ qua npm script.');
  return [process.env.npm_execpath,'exec','--yes','--package=firebase-tools@15.34.0','--','firebase',...args];
}
module.exports = { firebaseInvocation };
