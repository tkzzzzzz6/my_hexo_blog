'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { planVariableUpdates, planRequiredChecks } = require('../policy.cjs');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const vm = require('node:vm');

test('setup preview requires quality without a separate acceptance workflow', () => {
  const preview = JSON.parse(execFileSync(process.execPath, ['tools/agent-flow/setup.cjs'], { encoding: 'utf8' }));
  assert.deepEqual(preview.protection.required_status_checks, { strict: true, checks: [{ context: 'quality', app_id: 15368 }] });
  assert.equal(preview.protection.required_pull_request_reviews.required_approving_review_count, 0);
  assert.equal(preview.environment, undefined);
  assert.equal(preview.mergeBy, 'maintainer');
  assert.equal(preview.protection.enforce_admins, true);
  assert.equal(preview.protection.required_conversation_resolution, true);
  assert.equal(preview.protection.allow_force_pushes, false);
  assert.equal(preview.protection.allow_deletions, false);
});
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

test('existing required checks retain other integrations while removing the retired approval gate', () => {
  const existing = { strict: true, checks: [{ context: 'quality', app_id: 15368 }, { context: 'agent/policy', app_id: 15368 }, { context: 'security', app_id: 42 }] };
  assert.deepEqual(planRequiredChecks(existing), { strict: true, contexts: [], checks: [{ context: 'quality', app_id: 15368 }, { context: 'security', app_id: 42 }] });
  assert.equal(existing.checks.length, 3);
});

test('legacy required contexts preserve their app-independent binding and strict setting', () => {
  assert.deepEqual(planRequiredChecks({ strict: false, contexts: ['external-check', 'agent/policy'] }), { strict: false, contexts: [], checks: [{ context: 'external-check', app_id: -1 }, { context: 'quality', app_id: 15368 }] });
});

test('first installation requires quality without a separate policy status', () => {
  assert.deepEqual(planRequiredChecks(null), { strict: true, contexts: [], checks: [{ context: 'quality', app_id: 15368 }] });
});

test('setup recheck patches only status checks without replacing other protections or Actions permissions', () => {
  const writes = [];
  const policy = fs.readFileSync('.github/agent-policy.json', 'utf8');
  const childProcess = { execFileSync(command, args, options) {
    if (command === 'git') return args[0] === 'status' ? '' : 'a'.repeat(40);
    assert.equal(command, 'gh');
    const endpoint = args[1], method = args[args.indexOf('--method') + 1];
    if (method !== 'GET') { writes.push({ endpoint, method, body: JSON.parse(options.input) }); return ''; }
    if (endpoint.endsWith('/commits/main')) return JSON.stringify({ sha: 'a'.repeat(40) });
    if (endpoint.includes('/contents/')) return JSON.stringify({ content: Buffer.from(policy).toString('base64') });
    if (endpoint.endsWith('/protection')) return JSON.stringify({ required_status_checks: { strict: true, checks: [{ context: 'quality', app_id: 15368 }, { context: 'agent/policy', app_id: 15368 }, { context: 'security', app_id: 42 }] }, restrictions: { users: ['maintainer'] } });
    if (endpoint.includes('/variables/')) return JSON.stringify({ value: 'false' });
    if (endpoint.endsWith('/workflows/pr-checks.yml')) return '{}';
    throw new Error(`Unexpected API read: ${endpoint}`);
  } };
  vm.runInNewContext(fs.readFileSync('tools/agent-flow/setup.cjs', 'utf8'), {
    require(name) { return name === 'node:child_process' ? childProcess : name === './policy.cjs' ? require('../policy.cjs') : require(name); },
    process: { argv: ['node', 'setup.cjs', '--apply'] }, Buffer, console: { log() {} }
  });
  assert.deepEqual(writes, [{ endpoint: 'repos/tkzzzzzz6/my_hexo_blog/branches/main/protection/required_status_checks', method: 'PATCH', body: { strict: true, contexts: [], checks: [{ context: 'quality', app_id: 15368 }, { context: 'security', app_id: 42 }] } }]);
});
