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
test('repository workflows cannot merge PRs or write approval statuses', () => {
  for (const file of fs.readdirSync('.github/workflows').filter(name => /\.ya?ml$/.test(name))) {
    const flow = yaml.load(fs.readFileSync(`.github/workflows/${file}`, 'utf8'));
    assert.equal(flow.permissions.contents, 'read', file);
    for (const permissions of [flow.permissions, ...Object.values(flow.jobs).map(job => job.permissions).filter(Boolean)]) {
      assert.notEqual(permissions, 'write-all', file);
      for (const key of ['contents', 'pull-requests', 'statuses']) assert.notEqual(permissions[key], 'write', `${file}: ${key}`);
    }
  }
});
test('deployment remains main-only and independently opted in', () => {
  const flow = load('deploy');
  assert.deepEqual(flow.on.push.branches, ['main']);
  assert.match(flow.jobs['build-deploy'].if, /SITE_AUTO_DEPLOY/);
});
