const { test } = require('node:test'),
  assert = require('node:assert/strict');
test('countdown uses minutes and seconds and never displays negative or invalid values', async () => {
  const { formatCountdown } = await import('../frontend/app/src/lib/alert-format.ts');
  for (const [n, want] of [
    [503, '8:23'],
    [60, '1:00'],
    [0, '0:00'],
    [-2, '0:00'],
    [NaN, '0:00'],
    [0.2, '0:01'],
  ])
    assert.equal(formatCountdown(n), want);
});
test('distance avoids false zero precision and handles unknown input', async () => {
  const { formatDistance } = await import('../frontend/app/src/lib/alert-format.ts');
  for (const [n, want] of [
    [0, 'dưới 10 m'],
    [354, '350 m'],
    [1500, '1.5 km'],
    [-1, 'chưa rõ khoảng cách'],
    [NaN, 'chưa rõ khoảng cách'],
  ])
    assert.equal(formatDistance(n), want);
});
