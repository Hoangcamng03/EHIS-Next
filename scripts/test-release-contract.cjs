const { test } = require('node:test');
const assert = require('node:assert/strict');
const { assertBackendContract: check } = require('./release-contract.cjs');
const expected = {
  projectId: 'demo-ehis-next',
  version: '0.4.23',
  contract: require('../backend/api-contract.json'),
};
const health = {
  service: 'ehis-next',
  status: 'ok',
  projectId: expected.projectId,
  version: expected.version,
  apiRevision: expected.contract.revision,
  capabilities: [...expected.contract.capabilities],
};
test('release rejects an old backend even when its version label matches', () => {
  const { apiRevision, capabilities, ...legacy } = health;
  assert.throws(() => check(legacy, expected));
  assert.throws(() => check({ ...health, capabilities: health.capabilities.slice(1) }, expected));
  assert.throws(() => check({ ...health, apiRevision: 0 }, expected));
});
test('release rejects wrong service, project, unhealthy backend and version', () => {
  for (const update of [
    { service: 'other' },
    { status: 'down' },
    { projectId: 'other' },
    { version: '0.4.22' },
    { apiRevision: Infinity },
    { apiRevision: '1' },
    { capabilities: null },
  ])
    assert.throws(() => check({ ...health, ...update }, expected));
});
test('verified compatible backend may expose additional capabilities', () => {
  assert.doesNotThrow(() => check(health, expected));
  assert.doesNotThrow(() =>
    check(
      {
        ...health,
        apiRevision: health.apiRevision + 1,
        capabilities: [...health.capabilities, 'future-compatible-feature'],
      },
      expected,
    ),
  );
});
