const fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname, '..');
function easInvocation(args) {
    const file = path.join(root, '.local/runtime.json');
    if (fs.existsSync(file)) {
        const runtime = JSON.parse(fs.readFileSync(file, 'utf8'));
        if (runtime.easCli && fs.existsSync(runtime.easCli))
            return [runtime.easCli, ...args];
    }
    if (!process.env.npm_execpath)
        throw new Error('Run from npm so the EAS CLI can be resolved.');
    return [process.env.npm_execpath, 'exec', '--yes', '--package=eas-cli@latest', '--', 'eas', ...args];
}
module.exports = { easInvocation };
