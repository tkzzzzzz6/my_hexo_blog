'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const controller = require('../controller.cjs');
const { isFeatureBranch, deliveryDecision } = require('../policy.cjs');

test('feature branch naming identifies a delivery workspace, never main', () => {
  assert.equal(isFeatureBranch('codex/feature/site-basics'), true);
  assert.equal(isFeatureBranch('refs/heads/codex/feature/site-basics'), true);
  for (const name of ['main', 'codex/feature/', 'codex/issue-1-task', '', 'codex/feature/../main']) assert.equal(isFeatureBranch(name), false);
});

function fixture(overrides = {}) {
  const pr = { number: 9, state: 'open', draft: false, body: 'Fixes #57', head: { sha: 'a'.repeat(40), repo: { full_name: 'tkzzzzzz6/my_hexo_blog' } }, base: { ref: 'main', sha: 'c'.repeat(40), repo: { full_name: 'tkzzzzzz6/my_hexo_blog' } }, ...overrides.pr };
  const state = { writes: [], merges: 0, protectionReads: 0 }; let reads = 0;
  const github = { rest: {
    pulls: { get: async () => ({ data: ++reads > 1 && overrides.next ? { ...pr, ...overrides.next } : pr }), merge: async () => { state.merges++; throw Error('main must never auto merge'); } },
    repos: { listCommitStatusesForRef() {}, createCommitStatus: async value => { state.writes.push(value); } }
  }, paginate: async () => overrides.statuses || [], graphql: async () => { state.protectionReads++; throw Error('Resource not accessible by integration'); } };
  const summary = { addHeading() { return this; }, addRaw() { return this; }, async write() {} };
  return { github, context: { repo: { owner: 'tkzzzzzz6', repo: 'my_hexo_blog' }, payload: { pull_request: pr } }, core: { summary }, enabled: true, number: 9, pr, state };
}

test('main requires maintainer review for docs, features and misleading labels alike', () => {
  for (const body of ['Fixes #57', 'small-change approved', '']) {
    const f = fixture({ pr: { body, labels: [{ name: 'approved' }] } });
    assert.deepEqual(deliveryDecision(f.pr), { requiresMaintainer: true, automaticMerge: false });
  }
});
test('main controller marks pending without merge or protection-management reads', async () => {
  const f = fixture(); await controller(f);
  assert.equal(f.state.writes.length, 1); assert.equal(f.state.writes[0].state, 'pending');
  assert.equal(f.state.merges, 0); assert.equal(f.state.protectionReads, 0);
});
test('current-SHA protected maintainer acceptance is preserved, without automatic merge', async () => {
  const f = fixture({ statuses: [{ context: 'agent/policy', state: 'success', description: `maintainer-approved:${'a'.repeat(40)}` }] });
  await controller(f); assert.equal(f.state.writes.length, 0); assert.equal(f.state.merges, 0);
});
test('an old-SHA or label-style acceptance cannot replace current maintainer review', async () => {
  for (const description of [`maintainer-approved:${'b'.repeat(40)}`, 'base-policy: low-risk or explicitly authorized', 'approved']) {
    const f = fixture({ statuses: [{ context: 'agent/policy', state: 'success', description }] }); await controller(f);
    assert.equal(f.state.writes[0].state, 'pending');
  }
});
for (const pr of [{ state: 'closed' }, { base: { ref: 'codex/feature/site-basics' } }]) {
  test(`controller ignores closed or non-main PR: ${JSON.stringify(pr)}`, async () => { const f = fixture({ pr }); await controller(f); assert.equal(f.state.writes.length, 0); });
}
test('head, base or repository snapshot changes prevent any status write', async () => {
  const initial = fixture().pr;
  for (const next of [{ head: { ...initial.head, sha: 'b'.repeat(40) } }, { base: { ...initial.base, ref: 'release' } }, { base: { ...initial.base, sha: 'd'.repeat(40) } }, { head: { ...initial.head, repo: { full_name: 'other/repo' } } }]) {
    const f = fixture({ next }); await controller(f); assert.equal(f.state.writes.length, 0);
  }
});
