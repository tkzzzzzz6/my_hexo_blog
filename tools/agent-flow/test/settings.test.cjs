'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { planVariableUpdates } = require('../policy.cjs');
test('first installation creates both automation switches off', () => {
  assert.deepEqual(planVariableUpdates({}), [{ name: 'AGENT_AUTO_MERGE', value: 'false', method: 'POST' }, { name: 'SITE_AUTO_DEPLOY', value: 'false', method: 'POST' }]);
});
test('rechecking guardrails preserves an explicit deployment opt-in', () => {
  assert.deepEqual(planVariableUpdates({ AGENT_AUTO_MERGE: 'false', SITE_AUTO_DEPLOY: 'true' }), []);
});
test('rechecking guardrails does not touch an explicit disabled deployment', () => {
  assert.deepEqual(planVariableUpdates({ AGENT_AUTO_MERGE: 'false', SITE_AUTO_DEPLOY: 'false' }), []);
});
test('retired main auto-merge is disabled without resetting deployment or unrelated settings', () => {
  assert.deepEqual(planVariableUpdates({ AGENT_AUTO_MERGE: 'true', SITE_AUTO_DEPLOY: 'true', OTHER: 'keep' }), [{ name: 'AGENT_AUTO_MERGE', value: 'false', method: 'PATCH' }]);
});
