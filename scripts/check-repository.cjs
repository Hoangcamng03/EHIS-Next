// Read-only guard for broken documentation and build paths after reorganizing the repo.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const ignored = new Set(['.git', '.local', 'node_modules', '.expo', '.next', '.next-cloud', '.firebase', 'dist', 'out', 'lib', 'android', 'ios']);
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (ignored.has(entry.name)) return [];
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}
function headingIds(text) {
  const ids = new Set(), seen = new Map(); let fenced = false;
  for (const line of text.split(/\r?\n/)) {
    if (/^```/.test(line)) { fenced = !fenced; continue; }
    if (fenced) continue;
    for (const m of line.matchAll(/\bid="([^"]+)"/g)) ids.add(m[1]);
    const h = line.match(/^#{1,6}\s+(.+)/);
    if (!h) continue;
    const slug = h[1].toLowerCase().replace(/<[^>]*>/g, '').replace(/[^\p{L}\p{N}\p{M}_\-\s]/gu, '').replace(/ /g, '-');
    const count = seen.get(slug) || 0; seen.set(slug, count + 1);
    ids.add(slug + (count ? '-' + count : ''));
  }
  return ids;
}
const json = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const errors = []; let fileLinks = 0, anchors = 0;
const documents = walk(root).filter(file => file.endsWith('.md'));
for (const file of documents) {
  const text = fs.readFileSync(file, 'utf8');
  for (const m of text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    const ref = m[1].replace(/^<|>$/g, '');
    if (/^(https?:|mailto:)/.test(ref)) continue;
    const [name, fragment] = ref.split('#');
    const target = name ? path.resolve(path.dirname(file), decodeURIComponent(name)) : file;
    if (!fs.existsSync(target)) { errors.push(`${path.relative(root, file)}: missing ${name}`); continue; }
    if (name) fileLinks++;
    if (fragment && target.endsWith('.md')) {
      anchors++;
      if (!headingIds(fs.readFileSync(target, 'utf8')).has(decodeURIComponent(fragment))) errors.push(`${path.relative(root, file)}: missing anchor ${ref}`);
    }
  }
}
for (const modulePath of ['frontend/app', 'frontend/web', 'backend']) {
  assert.ok(fs.existsSync(path.join(root, modulePath, 'README.md')), `Missing module guide: ${modulePath}`);
  assert.ok(fs.existsSync(path.join(root, modulePath, 'package-lock.json')), `Missing module lockfile: ${modulePath}`);
}
const firebase = json('firebase.json');
for (const entry of firebase.functions) assert.ok(fs.existsSync(path.join(root, entry.source, 'package.json')), 'Invalid Firebase backend source');
for (const key of ['rules', 'indexes']) assert.ok(fs.existsSync(path.join(root, firebase.firestore[key])), `Missing Firestore ${key}`);
for (const command of Object.values(json('package.json').scripts)) {
  for (const m of command.matchAll(/node (scripts\/[\w/-]+\.cjs)/g)) assert.ok(fs.existsSync(path.join(root, m[1])), 'Missing npm script target: ' + m[1]);
  for (const m of command.matchAll(/--prefix ([\w/-]+)/g)) assert.ok(fs.existsSync(path.join(root, m[1], 'package.json')), 'Missing npm module: ' + m[1]);
}
const hook = json('frontend/app/package.json').scripts['eas-build-pre-install'];
assert.ok(hook.startsWith('node '), 'Review the EAS hook command');
assert.ok(fs.existsSync(path.resolve(root, 'frontend/app', hook.slice(5))), 'Broken EAS pre-install hook');
const catalog = fs.readFileSync(path.join(root, 'docs/README.md'), 'utf8');
const indexed = [...catalog.matchAll(/^\| \[[^\]]+\]\(([^)]+)\)/gm)].map(m => m[1]);
const inventory = walk(path.join(root, 'docs')).filter(file => /\.(md|json)$/.test(file) && !file.endsWith(path.join('docs', 'README.md')));
for (const file of inventory) {
  const ref = path.relative(path.join(root, 'docs'), file).split(path.sep).join('/');
  if (indexed.filter(link => link === ref).length !== 1) errors.push(`docs/README.md: expected one primary entry for ${ref}`);
}
if (errors.length) { errors.forEach(error => console.error(error)); process.exitCode = 1; }
else console.log(JSON.stringify({ documents: documents.length, catalogItems: inventory.length, relativeFileLinks: fileLinks, anchorLinks: anchors, moduleAndBuildPaths: 'PASS', status: 'PASS' }));
