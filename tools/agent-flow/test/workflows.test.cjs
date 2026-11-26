'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const yaml = require('js-yaml');
const load = name => yaml.load(fs.readFileSync(`.github/workflows/${name}.yml`, 'utf8'));
test('feature pushes and main delivery PRs run the same quality gate', () => {
  const flow = load('pr-checks');
  assert.deepEqual(flow.on.push.branches, ['codex/feature/**']);
  assert.deepEqual(flow.on.pull_request.branches, ['main']);
  assert.equal(flow.permissions.contents, 'read');
  assert.equal(flow.jobs.quality.name, 'quality');
});
test('main status controller has no merge or deploy permissions or automation switches', () => {
  const flow = load('agent-control');
  assert.equal(flow.permissions.contents, 'read');
  assert.equal(flow.permissions['pull-requests'], 'read');
  assert.equal(flow.permissions.statuses, 'write');
  assert.equal(flow.permissions.actions, undefined);
  const raw = fs.readFileSync('.github/workflows/agent-control.yml', 'utf8');
  assert.equal(raw.includes('AGENT_AUTO_MERGE'), false);
  assert.equal(raw.includes('AUTO_DEPLOY'), false);
});
test('deployment remains main-only and independently opted in', () => {
  const flow = load('deploy');
  assert.deepEqual(flow.on.push.branches, ['main']);
  assert.match(flow.jobs['build-deploy'].if, /SITE_AUTO_DEPLOY/);
});
test('status evaluation and protected approval serialize per PR without cancellation', () => {
  const control = load('agent-control'), approval = load('maintainer-approval');
  assert.equal(control.concurrency.group, 'main-delivery-${{ github.event.pull_request.number || inputs.pr }}');
  assert.equal(control.concurrency.group, approval.concurrency.group);
  assert.equal(control.concurrency['cancel-in-progress'], false);
  assert.equal(approval.concurrency['cancel-in-progress'], false);
});
