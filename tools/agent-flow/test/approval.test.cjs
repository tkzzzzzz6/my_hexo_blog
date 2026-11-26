'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const approve = require('../approve.cjs');
const { validApprovalEnvironment } = require('../policy.cjs');
const sha = 'a'.repeat(40);
const protectedEnvironment = { protection_rules: [{ type: 'required_reviewers', reviewers: [{ type: 'User', reviewer: { login: 'tkzzzzzz6' } }] }] };

function fixture(change = {}) {
  const writes = [];
  const pr = { state: 'open', head: { sha, repo: { full_name: 'o/r' } }, base: { ref: 'main', repo: { full_name: 'o/r' } }, ...change.pr };
  const summary = { addHeading() { return this; }, addRaw() { return this; }, async write() {} };
  return { github: { rest: {
    repos: { getEnvironment: async () => ({ data: change.environment || protectedEnvironment }), createCommitStatus: async value => { writes.push(value); } },
    pulls: { get: async () => ({ data: pr }) }
  } }, context: { repo: { owner: 'o', repo: 'r' }, actor: change.actor || 'tkzzzzzz6' }, core: { summary }, number: 9, sha: change.sha || sha, writes };
}
test('protected maintainer approval records exactly the reviewed head SHA', async () => {
  const f = fixture(); await approve(f);
  assert.equal(f.writes.length, 1); assert.equal(f.writes[0].sha, sha);
  assert.equal(f.writes[0].description, `maintainer-approved:${sha}`);
});
for (const [name, change] of [
  ['untrusted actor', { actor: 'outsider' }],
  ['short SHA', { sha: 'abc' }],
  ['stale SHA', { sha: 'b'.repeat(40) }],
  ['closed PR', { pr: { state: 'closed' } }],
  ['wrong target', { pr: { base: { ref: 'release', repo: { full_name: 'o/r' } } } }],
  ['fork', { pr: { head: { sha, repo: { full_name: 'fork/r' } } } }],
  ['unprotected environment', { environment: { protection_rules: [] } }],
  ['no reviewers', { environment: { protection_rules: [{ type: 'required_reviewers', reviewers: [] }] } }]
]) test(`approval rejects ${name} without writing a status`, async () => { const f = fixture(change); await assert.rejects(approve(f)); assert.equal(f.writes.length, 0); });
test('environment validation never accepts an unknown reviewer or a missing rule', () => {
  assert.equal(validApprovalEnvironment(protectedEnvironment, ['tkzzzzzz6']), true);
  for (const env of [{}, { protection_rules: [] }, { protection_rules: [{ type: 'required_reviewers', reviewers: [{ type: 'User', reviewer: { login: 'outsider' } }] }] }]) assert.equal(validApprovalEnvironment(env, ['tkzzzzzz6']), false);
});
