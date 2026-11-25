const assert = require('node:assert/strict');
// A matching version label alone does not prove that the backend supports
// the frontend being published. Never infer missing capabilities from a label.
function assertBackendContract(health, expected) {
  assert.ok(health && typeof health === 'object', 'Backend health is missing');
  assert.equal(health.service, 'ehis-next', 'Wrong backend service');
  assert.equal(health.status, 'ok', 'Backend is not healthy');
  assert.equal(health.projectId, expected.projectId, 'Wrong backend project');
  assert.equal(health.version, expected.version, 'Backend version does not match this release');
  assert.ok(
    Number.isSafeInteger(health.apiRevision) && health.apiRevision >= expected.contract.revision,
    'Backend API contract is missing or older; deploy and verify the backend before publishing clients',
  );
  assert.ok(Array.isArray(health.capabilities), 'Backend capabilities are missing');
  for (const capability of expected.contract.capabilities)
    assert.ok(
      health.capabilities.includes(capability),
      'Backend capability is missing: ' + capability,
    );
}
module.exports = { assertBackendContract };
