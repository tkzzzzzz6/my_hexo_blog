'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { classify, canMerge, validApprovalEnvironment } = require('../policy.cjs');
const policy = { maintainers: ['owner'], maxFiles: 4, maxLines: 80, authorizations: [] };
const pr = { number: 7, state: 'open', draft: false, body: 'Fixes #12', head: { sha: 'abc', repo: { full_name: 'o/r' } }, base: { ref: 'main', sha: 'base', repo: { full_name: 'o/r' } } };
const file = (filename, status = 'modified', changes = 3) => ({ filename, status, changes });
test('explicit low-risk Markdown scope permits a small documentation edit', () => {
  assert.equal(classify(pr, [file('docs/guides/git.md')], policy).automatic, true);
});
for (const filename of ['AGENTS.md', 'CONTRIBUTING.md', '.github/workflows/x.yml', '.github/agent-policy.json', 'tools/agent-flow/policy.cjs', 'package.json', 'package-lock.json', '_config.yml', 'source/robots.txt', 'source/_posts/a.md', 'themes/hingle/_config.yml', 'docs/guides/../secret.md', 'docs\\guides\\x.md', '/README.md']) {
  test(`manual gate for ${filename}`, () => assert.equal(classify(pr, [file(filename)], policy).automatic, false));
}
for (const status of ['removed', 'renamed', 'copied', 'unknown']) {
  test(`manual gate for ${status}`, () => assert.equal(classify(pr, [file('README.md', status)], policy).automatic, false));
}
test('labels do not authorize a feature or policy change', () => {
  assert.equal(classify({ ...pr, labels: [{ name: 'small-change' }, { name: 'approved' }] }, [file('scripts/new.js')], policy).automatic, false);
});
test('fork, missing Issue, missing diff metrics, too many lines or files fail closed', () => {
  for (const [p, files] of [
    [{ ...pr, head: { ...pr.head, repo: { full_name: 'fork/r' } } }, [file('README.md')]],
    [{ ...pr, body: '' }, [file('README.md')]],
    [pr, [{ filename: 'README.md', status: 'modified' }]],
    [pr, [file('README.md', 'modified', 81)]],
    [pr, Array.from({ length: 5 }, (_, i) => file(`docs/guides/${i}.md`))]
  ]) assert.equal(classify(p, files, policy).automatic, false);
});
test('bounded feature authorization uses base policy Issue, exact scope and expiry', () => {
  const authorized = { ...policy, authorizations: [{ issue: 12, paths: ['source/search/index.md'], expires: '2099-01-01', maxLines: 40, maxFiles: 1 }] };
  assert.equal(classify(pr, [file('source/search/index.md')], authorized).automatic, true);
  assert.equal(classify(pr, [file('source/search/other.md')], authorized).automatic, false);
  assert.equal(classify(pr, [file('package.json')], { ...authorized, authorizations: [{ ...authorized.authorizations[0], paths: ['package.json'] }] }).automatic, false);
  assert.equal(classify(pr, [file('source/search/index.md')], { ...authorized, authorizations: [{ ...authorized.authorizations[0], expires: '2000-01-01' }] }).automatic, false);
});
const ready = { enabled: true, pr: { ...pr, mergeable: true, mergeable_state: 'clean' }, expectedSha: 'abc', expectedBase: { ref: 'main', sha: 'base', repository: 'o/r' }, automatic: true, quality: { headSha: 'abc', conclusion: 'success', event: 'pull_request', workflowPath: '.github/workflows/pr-checks.yml' }, unresolvedThreads: 0, changesRequested: false, protectionReady: true };
test('merge only current SHA with real successful PR quality run and branch protection', () => {
  assert.equal(canMerge(ready), true);
  for (const override of [
    { enabled: false }, { expectedSha: 'old' }, { automatic: false }, { protectionReady: false },
    { pr: { ...ready.pr, draft: true } }, { pr: { ...ready.pr, mergeable_state: 'behind' } },
    { pr: { ...ready.pr, base: { ...pr.base, ref: 'release' } } },
    { pr: { ...ready.pr, base: { ...pr.base, sha: 'new-base' } } },
    { unresolvedThreads: 1 }, { unresolvedThreads: null }, { changesRequested: true },
    { quality: { ...ready.quality, headSha: 'old' } },
    { quality: { ...ready.quality, conclusion: 'skipped' } },
    { quality: { ...ready.quality, event: 'push' } },
    { quality: { ...ready.quality, workflowPath: '.github/workflows/fake.yml' } }
  ]) assert.equal(canMerge({ ...ready, ...override }), false, JSON.stringify(override));
});
test('human approval environment must have trusted required reviewers', () => {
  assert.equal(validApprovalEnvironment({ protection_rules: [{ type: 'required_reviewers', reviewers: [{ type: 'User', reviewer: { login: 'owner' } }] }] }, ['owner']), true);
  for (const env of [{}, { protection_rules: [] }, { protection_rules: [{ type: 'required_reviewers', reviewers: [] }] }, { protection_rules: [{ type: 'required_reviewers', reviewers: [{ type: 'User', reviewer: { login: 'outsider' } }] }] }]) assert.equal(validApprovalEnvironment(env, ['owner']), false);
});
