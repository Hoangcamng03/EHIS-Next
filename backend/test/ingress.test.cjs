const { test } = require('node:test'),
  assert = require('node:assert/strict');
const { clientIp } = require('../lib/clientIp'),
  { nextCardRequests } = require('../lib/cardRequestBudget');
test('Vercel budget uses its ingress header, never a shared proxy socket or user XFF', () => {
  const req = {
    ip: '10.0.0.1',
    headers: { 'x-vercel-forwarded-for': '203.0.113.12', 'x-forwarded-for': '198.51.100.2' },
  };
  assert.equal(clientIp(req, true), '203.0.113.12');
  assert.equal(
    clientIp({ ...req, headers: { 'x-vercel-forwarded-for': '203.0.113.13' } }, true),
    '203.0.113.13',
  );
  assert.equal(clientIp(req, false), '10.0.0.1');
  for (const value of [undefined, 'spoof', '203.0.113.12, 10.0.0.1', ['203.0.113.12']])
    assert.equal(
      clientIp({ ...req, headers: { 'x-vercel-forwarded-for': value } }, true),
      undefined,
    );
  assert.equal(clientIp({ ip: '::ffff:127.0.0.1', headers: {} }, false), '127.0.0.1');
});
test('card budget is shared across reporters and reopens only outside its rolling hour', () => {
  const now = 7200000,
    full = Array.from({ length: 6 }, (_, i) => now - i * 1000);
  assert.equal(nextCardRequests(full, now), null);
  assert.equal(nextCardRequests(full, now + 3600000).length, 1);
  assert.deepEqual(nextCardRequests([null, 'bad', NaN, now + 1, now - 3600000, now - 1000], now), [
    now - 1000,
    now,
  ]);
});
test('portable routes track every compiled callable and exclude health/scheduler', () => {
  process.env.GCLOUD_PROJECT = 'demo-ehis-next';
  const functions = require('../lib/index'),
    { callableRoutes } = require('../routes.cjs');
  const names = callableRoutes(functions);
  assert.deepEqual(
    [...names].sort(),
    Object.keys(functions)
      .filter((x) => !['health', 'maintenance'].includes(x))
      .sort(),
  );
  assert(names.has('acceptIncidentHandover'));
  assert(!names.has('maintenance'));
});
