'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const controller = require('../controller.cjs');
const approve = require('../approve.cjs');

function fixture(overrides = {}) {
  const repo = { owner: 'tkzzzzzz6', repo: 'my_hexo_blog' };
  const pr = { number: 9, state: 'open', draft: false, body: 'Fixes #12', changed_files: 1, mergeable: true, mergeable_state: 'clean', head: { sha: 'a'.repeat(40), repo: { full_name: 'tkzzzzzz6/my_hexo_blog' } }, base: { ref: 'main', sha: 'c'.repeat(40), repo: { full_name: 'tkzzzzzz6/my_hexo_blog' } } };
  const state = { merges: [], statuses: [], ...overrides };
  let reads = 0;
  const routes = {};
  const endpoint = (name, handler = async () => ({})) => {
    const fn = async params => handler(params); fn.routeName = name; routes[name] = fn; return fn;
  };
  const github = {
    rest: {
      pulls: {
        get: endpoint('getPr', async () => {
          reads++;
          if (reads > 1 && state.stale) return { data: { ...pr, head: { ...pr.head, sha: 'b'.repeat(40) } } };
          if (reads > 2 && state.retarget) return { data: { ...pr, base: { ...pr.base, ref: 'release' } } };
          return { data: pr };
        }),
        listFiles: endpoint('files'), listReviews: endpoint('reviews'),
        merge: endpoint('merge', async params => { state.merges.push(params); return { data: { merged: true } }; })
      },
      issues: { get: endpoint('issue', async () => ({ data: { state: state.closedIssue ? 'closed' : 'open' } })) },
      repos: {
        compareCommitsWithBasehead: endpoint('compare', async params => {
          state.comparison = params.basehead;
          return { data: { files: state.files || [{ filename: 'docs/guides/example.md', status: 'modified', changes: 2 }] } };
        }),
        listCommitStatusesForRef: endpoint('statuses'),
        createCommitStatus: endpoint('status', async params => { state.statuses.push(params); return {}; }),
        getEnvironment: endpoint('env', async () => ({ data: state.environment || {} }))
      },
      actions: { listWorkflowRuns: endpoint('runs'), listJobsForWorkflowRun: endpoint('jobs'), createWorkflowDispatch: endpoint('dispatch') }
    },
    paginate: async fn => ({
      files: state.files || [{ filename: 'docs/guides/example.md', status: 'modified', changes: 2 }],
      statuses: [], reviews: state.reviews || [],
      runs: [{ id: 100, head_sha: pr.head.sha, conclusion: 'success', event: 'pull_request', path: '.github/workflows/pr-checks.yml', pull_requests: [{ number: state.runPrNumber || 9 }] }],
      jobs: [{ name: 'quality', conclusion: state.failed ? 'failure' : 'success' }]
    })[fn.routeName],
    graphql: async query => query.includes('branchProtectionRule')
      ? { repository: { ref: { branchProtectionRule: { requiresStrictStatusChecks: true, isAdminEnforced: true, requiresConversationResolution: true, requiredStatusCheckContexts: ['quality', 'agent/policy'] } } } }
      : { repository: { pullRequest: { reviewThreads: { nodes: state.unresolved ? [{ isResolved: false }] : [], pageInfo: { hasNextPage: false } } } } }
  };
  const summary = { addHeading() { return this; }, addRaw() { return this; }, async write() {} };
  return { github, context: { repo, actor: 'tkzzzzzz6', payload: { pull_request: pr } }, core: { summary }, enabled: true, number: 9, state, pr };
}

test('controller merges a current, checked, protected, low-risk PR at exact SHA', async () => {
  const f = fixture(); await controller(f);
  assert.equal(f.state.merges.length, 1);
  assert.equal(f.state.merges[0].sha, f.pr.head.sha);
  assert.equal(f.state.merges[0].merge_method, 'squash');
});
for (const override of [{ stale: true }, { failed: true }, { closedIssue: true }, { unresolved: true }, { reviews: [{ user: { login: 'reviewer' }, state: 'CHANGES_REQUESTED' }] }, { files: [{ filename: '.github/agent-policy.json', status: 'modified', changes: 1 }] }]) {
  test(`controller refuses merge: ${JSON.stringify(override)}`, async () => { const f = fixture(override); await controller(f); assert.equal(f.state.merges.length, 0); });
}
test('disabled controller reports policy without merging', async () => {
  const f = fixture(); await controller({ ...f, enabled: false }); assert.equal(f.state.merges.length, 0);
});
test('a quality run from another PR at the same SHA cannot authorize this PR', async () => {
  const f = fixture({ runPrNumber: 999 }); await controller(f); assert.equal(f.state.merges.length, 0);
});
test('diff is tied to immutable base/head and no success is written for a stale snapshot', async () => {
  const f = fixture({ stale: true }); await controller(f);
  assert.equal(f.state.comparison, `${f.pr.base.sha}...${f.pr.head.sha}`);
  assert.equal(f.state.statuses.filter(status => status.state === 'success').length, 0);
});
test('retargeting the PR after policy evaluation cannot merge another branch', async () => {
  const f = fixture({ retarget: true }); await controller(f); assert.equal(f.state.merges.length, 0);
});
test('human acceptance rejects unprotected environment and stale SHA', async () => {
  let f = fixture(); await assert.rejects(approve({ ...f, sha: f.pr.head.sha }), /reviewers/);
  f = fixture({ environment: { protection_rules: [{ type: 'required_reviewers', reviewers: [{ type: 'User', reviewer: { login: 'tkzzzzzz6' } }] }] } });
  await assert.rejects(approve({ ...f, sha: 'b'.repeat(40) }), /stale/);
  await approve({ ...f, sha: f.pr.head.sha });
  assert.equal(f.state.statuses.length, 1);
  assert.equal(f.state.statuses[0].description, `maintainer-approved:${f.pr.head.sha}`);
});
