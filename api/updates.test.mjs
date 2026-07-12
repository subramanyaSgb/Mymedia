// Standalone check of isNewer (no RN deps). Run: node api/updates.test.mjs
import assert from 'node:assert';

// Inlined copy of isNewer to avoid importing expo-application in node.
function isNewer(a, b) {
  const pa = a.replace(/^v/, '').split('.').map(Number);
  const pb = b.replace(/^v/, '').split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d !== 0) return d > 0;
  }
  return false;
}

assert.equal(isNewer('1.1.0', '1.0.0'), true);
assert.equal(isNewer('v1.0.1', '1.0.0'), true);
assert.equal(isNewer('1.0.0', '1.0.0'), false);
assert.equal(isNewer('1.0.0', '1.2.0'), false);
assert.equal(isNewer('2.0', '1.9.9'), true);
assert.equal(isNewer('1.0.0', '1.0'), false); // equal, trailing zero
console.log('updates.test: OK');
