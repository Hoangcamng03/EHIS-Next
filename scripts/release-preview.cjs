const fs = require('node:fs'), path = require('node:path');
const { spawnSync } = require('node:child_process');
const { easInvocation } = require('./eas-cli.cjs');
const root = path.resolve(__dirname, '..'), mobile = path.join(root, 'frontend/app');
const args = process.argv.slice(2), native = args.includes('--native');
const messageAt = args.indexOf('--message'), message = messageAt >= 0 ? args[messageAt + 1] : undefined;
if (!message || message.startsWith('--'))
    throw new Error('Dùng npm run release:preview -- --message "mô tả" [--native]');
const local = path.join(root, '.local');
fs.mkdirSync(local, { recursive: true });
let record;
function save() { if (record)
    fs.writeFileSync(path.join(local, 'release-preview.latest.json'), JSON.stringify(record, null, 2) + '\n'); }
function command(bin, argv, cwd = root, json = false) {
    const result = spawnSync(bin, argv, { cwd, env: { ...process.env, EXPO_NO_DOTENV: '1' }, windowsHide: true, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024, stdio: json ? ['ignore', 'pipe', 'inherit'] : 'inherit' });
    if (result.status !== 0)
        throw new Error('Bước phát hành thất bại: ' + argv[0] + '. Xem kết quả đã hoàn tất trong .local/release-preview.latest.json.');
    if (json) {
        try {
            return JSON.parse(result.stdout.replace(/^\uFEFF/, ''));
        }
        catch {
            throw new Error('CLI không trả JSON hợp lệ; không coi bước đó đã được xác minh.');
        }
    }
}
function git(argv) { const r = spawnSync('git', argv, { cwd: root, encoding: 'utf8', windowsHide: true }); if (r.status !== 0)
    throw new Error('Git preflight failed'); return r.stdout.trim(); }
function npm(script) { if (!process.env.npm_execpath)
    throw new Error('Chạy qua npm script.'); command(process.execPath, [process.env.npm_execpath, 'run', script]); }
function eas(argv) { return command(process.execPath, easInvocation(argv), mobile, true); }
try {
    if (git(['status', '--porcelain']))
        throw new Error('Commit source trước khi phát hành để frontend/web/APK/OTA dùng cùng snapshot có thể truy vết.');
    const config = JSON.parse(fs.readFileSync(path.join(mobile, 'app.json'), 'utf8')).expo;
    const profile = JSON.parse(fs.readFileSync(path.join(mobile, 'eas.json'), 'utf8')).build.preview;
    if (config.extra?.eas?.projectId !== 'eb11cc2d-e7b9-46ed-8794-0eae2b3495ed' || profile.channel !== 'preview' || profile.environment !== 'preview' || config.android.runtimeVersion?.policy !== 'fingerprint')
        throw new Error('Sai project/channel/environment/runtime policy.');
    for (const [folder, prefix] of [['frontend/app', 'EXPO_PUBLIC_'], ['frontend/web', 'NEXT_PUBLIC_']]) {
        const env = fs.readFileSync(path.join(root, folder, '.env.cloud.local'), 'utf8');
        if (!env.includes(prefix + 'FIREBASE_PROJECT_ID=ehis-next-20261021-hc03') || !env.includes(prefix + 'USE_EMULATORS=false'))
            throw new Error('Cấu hình cloud chưa đúng trong ' + folder);
    }
    record = { startedAt: new Date().toISOString(), commit: git(['rev-parse', 'HEAD']), version: config.version, channel: 'preview', nativeRequested: native, status: 'preflight' };
    save();
    const previous = eas(['build:list', '--build-profile', 'preview', '--platform', 'android', '--status', 'finished', '--limit', '1', '--json', '--non-interactive'])[0];
    if (native) {
        const versionCode = Number(config.android.versionCode), previousCode = Number(previous?.appBuildVersion || 0);
        if (!Number.isSafeInteger(versionCode) || versionCode <= previousCode)
            throw new Error('APK mới cần android.versionCode lớn hơn APK FINISHED gần nhất. Tăng version/code và commit trước khi phát hành native.');
    }
    npm('check');
    record.checks = 'passed';
    save();
    const fingerprint = eas(['fingerprint:generate', '--build-profile', 'preview', '--platform', 'android', '--json', '--non-interactive']);
    if (typeof fingerprint.hash !== 'string')
        throw new Error('Không đọc được native fingerprint');
    record.fingerprint = fingerprint.hash;
    save();
    if (native) {
        const builds = eas(['build', '--platform', 'android', '--profile', 'preview', '--non-interactive', '--no-wait', '--json']);
        const build = Array.isArray(builds) ? builds[0] : builds;
        if (!build?.id)
            throw new Error('Chưa xác nhận build ID Android');
        record.androidBuild = { id: build.id, status: build.status, url: `https://expo.dev/accounts/ehiss-team/projects/ehis-next/builds/${build.id}` };
        save();
        console.log('Android build đã gửi: ' + record.androidBuild.url);
    }
    else {
        const build = previous;
        if (build?.fingerprint?.hash !== fingerprint.hash)
            throw new Error('Native fingerprint khác APK preview gần nhất. Chạy lại với --native để xuất APK mới, không chỉ phát OTA.');
        record.androidBuild = { id: build.id, status: build.status, runtimeMatched: true };
        save();
    }
    npm('cloud:build');
    record.frontendBuild = 'passed';
    save();
    const updates = eas(['update', '--channel', 'preview', '--environment', 'preview', '--platform', 'android', '--message', message, '--non-interactive', '--json', '--emit-metadata', '--input-dir', '.local/ota-preview']);
    const list = Array.isArray(updates) ? updates : updates.updates;
    if (!Array.isArray(list) || !list.length)
        throw new Error('Không đọc được bản OTA đã xuất');
    if (list.some(update => update.runtimeVersion !== fingerprint.hash))
        throw new Error('OTA runtime không trùng native fingerprint; dừng phát hành web để kiểm tra.');
    record.ota = { status: 'published', updates: list.map(u => ({ id: u.id, group: u.group, runtimeVersion: u.runtimeVersion, platform: u.platform })) };
    save();
    npm('cloud:deploy-web');
    record.web = { status: 'published', url: 'https://ehis-next-20261021-hc03-app.web.app' };
    record.status = native ? 'web-and-ota-published-apk-pending' : 'web-and-ota-published';
    record.finishedAt = new Date().toISOString();
    save();
    console.log(JSON.stringify({ status: record.status, commit: record.commit, web: record.web.url, androidBuild: record.androidBuild, fingerprint: record.fingerprint }));
    console.log('Chưa phải xác nhận điện thoại đã cài/áp dụng. Kiểm tra build FINISHED và nghiệm thu thiết bị riêng.');
}
catch (error) {
    if (record) {
        record.status = 'incomplete';
        record.error = error.message;
        save();
    }
    console.error(error.message);
    process.exitCode = 1;
}
