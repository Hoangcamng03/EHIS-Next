const { existsSync, readFileSync } = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
function localEnvironment() {
  const env = { ...process.env };
  const file = path.join(root, '.local/runtime.json');
  if (existsSync(file)) {
    const config = JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
    if (typeof config.javaHome === 'string') env.JAVA_HOME = config.javaHome;
  }
  if (env.JAVA_HOME) env.PATH = `${path.join(env.JAVA_HOME, 'bin')}${path.delimiter}${env.PATH || env.Path || ''}`;
  return env;
}
function checkJava(env) {
  const executable = env.JAVA_HOME ? path.join(env.JAVA_HOME, 'bin', process.platform === 'win32' ? 'java.exe' : 'java') : 'java';
  const result = spawnSync(executable, ['-version'], { encoding: 'utf8', env, windowsHide: true });
  const output = `${result.stderr || ''}${result.stdout || ''}`;
  const major = Number(output.match(/version "(\d+)/)?.[1]);
  if (result.status !== 0 || major < 21 || !major) throw new Error('Cần Java 21+. Cài JDK 21 và đặt JAVA_HOME; hoặc ghi {"javaHome":"đường dẫn JDK"} vào .local/runtime.json (không commit).');
  return major;
}
module.exports = { root, localEnvironment, checkJava };
