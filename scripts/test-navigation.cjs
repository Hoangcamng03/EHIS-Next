const assert = require('node:assert/strict');
const { test } = require('node:test');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const modulePromise = import(pathToFileURL(path.resolve(__dirname, '../frontend/app/src/lib/directions.ts')).href);
const origin = { latitude: 10.7769, longitude: 106.7009 };
const destination = { latitude: 10.779, longitude: 106.699 };
const response = () => ({ code: 'Ok', routes: [{ distance: 1020, duration: 180, geometry: { coordinates: [[106.7009, 10.7769], [106.699, 10.779]] }, legs: [{ steps: [{ distance: 1020, name: 'Đường thử nghiệm', maneuver: { type: 'depart' } }, { distance: 0, name: '', maneuver: { type: 'arrive' } }] }] }] });
test('Google preview encodes exact origin and destination; navigation uses device location', async () => {
  const { googleDirections } = await modulePromise;
  const preview = new URL(googleDirections(destination, origin));
  assert.equal(preview.searchParams.get('api'), '1');
  assert.equal(preview.searchParams.get('origin'), '10.7769,106.7009');
  assert.equal(preview.searchParams.get('destination'), '10.779,106.699');
  const navigation = new URL(googleDirections(destination));
  assert.equal(navigation.searchParams.has('origin'), false);
  assert.equal(navigation.searchParams.get('dir_action'), 'navigate');
});
test('OSRM uses longitude first; rejects invalid geographic input', async () => {
  const { routeUrl, googleDirections } = await modulePromise;
  assert.match(routeUrl(origin, destination), /106\.7009,10\.7769;106\.699,10\.779/);
  for (const point of [{ latitude: NaN, longitude: 1 }, { latitude: 86, longitude: 1 }, { latitude: 1, longitude: 181 }]) {
    assert.throws(() => routeUrl(origin, point)); assert.throws(() => googleDirections(point));
  }
});
test('road response keeps network distance, geometry and readable maneuvers', async () => {
  const { parseRoute } = await modulePromise;
  const result = parseRoute(response());
  assert.equal(result.distance, 1020); assert.equal(result.duration, 180);
  assert.equal(result.steps[0].instruction, 'Bắt đầu · Đường thử nghiệm');
  assert.equal(result.steps[1].instruction, 'Đến điểm đích trên đường');
});
test('no route and malformed provider geometry are rejected, never rendered as a straight route', async () => {
  const { parseRoute } = await modulePromise;
  for (const value of [null, {}, { code: 'NoRoute', routes: [] }]) assert.throws(() => parseRoute(value));
  for (const change of [value => value.routes[0].geometry.coordinates = [[1800, 10], [106, 10]], value => value.routes[0].duration = -1, value => value.routes[0].legs = [{}]]) {
    const value = response(); change(value); assert.throws(() => parseRoute(value));
  }
});
test('provider outage and cancelled requests reject without fake fallback results', async () => {
  const { loadRoute } = await modulePromise;
  const original = global.fetch;
  try {
    global.fetch = async () => ({ ok: false });
    await assert.rejects(loadRoute(origin, destination, new AbortController().signal));
    global.fetch = async (_url, options) => { options.signal.throwIfAborted(); return { ok: true, json: async () => response() }; };
    const controller = new AbortController(); controller.abort();
    await assert.rejects(loadRoute(origin, destination, controller.signal));
  } finally { global.fetch = original; }
});
