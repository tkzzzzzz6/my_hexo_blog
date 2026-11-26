'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { isFeatureBranch } = require('../policy.cjs');

test('feature branch naming identifies a delivery workspace, never main', () => {
  assert.equal(isFeatureBranch('codex/feature/site-basics'), true);
  assert.equal(isFeatureBranch('refs/heads/codex/feature/site-basics'), true);
  for (const name of ['main', 'codex/feature/', 'codex/issue-1-task', '', 'codex/feature/../main']) assert.equal(isFeatureBranch(name), false);
});
