const fs = require('node:fs'),
  assert = require('node:assert/strict');
for (const name of ['travel-progress']) {
  const read = (folder) =>
    fs.readFileSync(`frontend/${folder}/src/lib/${name}.ts`, 'utf8').replaceAll('\r\n', '\n');
  assert.equal(read('app'), read('web'), `${name} app/web drift; update both contracts together`);
}
console.log(
  'PASS: travel progress contracts match app/web. Report status exists only in web; observation compatibility is covered by test-observations.cjs.',
);
