const { test } = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs'),
  vm = require('node:vm');
const ts = require('../frontend/web/node_modules/typescript');
async function harness() {
  const policy = await import('../frontend/web/src/lib/location-fix.ts');
  const exports = {},
    callbacks = {},
    cleared = [];
  const geolocation = {
    watchPosition(receive, fail, options) {
      Object.assign(callbacks, { receive, fail, options });
      return 7;
    },
    clearWatch(id) {
      cleared.push(id);
    },
  };
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync('frontend/web/src/lib/accurate-position.ts', 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText,
    { exports, require: () => policy, navigator: { geolocation }, Date, setTimeout, clearTimeout },
  );
  return { request: exports.accuratePosition, callbacks, cleared };
}
const position = (accuracy) => ({
  coords: { latitude: 10.8, longitude: 106.7, accuracy },
  timestamp: Date.now(),
});
test('reporter ignores initial coarse position then accepts fresh precise GPS and closes watcher', async () => {
  const h = await harness(),
    controller = new AbortController();
  let settled = false;
  const result = h.request(controller.signal).then((value) => {
    settled = true;
    return value;
  });
  assert.equal(h.callbacks.options.enableHighAccuracy, true);
  h.callbacks.receive(position(80));
  await Promise.resolve();
  assert.equal(settled, false);
  h.callbacks.receive(position(15));
  assert.equal((await result).coords.accuracy, 15);
  assert.deepEqual(h.cleared, [7]);
  controller.abort();
  assert.deepEqual(h.cleared, [7]);
});
test('reporter location abort and denied permission clean up without publishing a fix', async () => {
  for (const reason of ['abort', 'denied']) {
    const h = await harness(),
      controller = new AbortController(),
      pending = h.request(controller.signal);
    if (reason === 'abort') controller.abort();
    else h.callbacks.fail({ code: 1 });
    await assert.rejects(pending, /location/);
    assert.deepEqual(h.cleared, [7]);
    h.callbacks.receive(position(10));
    assert.deepEqual(h.cleared, [7]);
  }
});
