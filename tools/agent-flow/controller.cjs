'use strict';

const fs = require('node:fs');
const { classify, canMerge } = require('./policy.cjs');

// This module runs ONLY from the default branch. Never require PR modules here.
module.exports = async function controller({ github, context, core, enabled = false, number }) {
  const repo = context.repo;
  const policy = JSON.parse(fs.readFileSync('.github/agent-policy.json', 'utf8'));
  const prNumber = Number(number || context.payload.pull_request?.number);
  if (!Number.isSafeInteger(prNumber) || prNumber < 1) throw new Error('Invalid PR number');
  const getPr = async () => (await github.rest.pulls.get({ ...repo, pull_number: prNumber })).data;
  let pr = await getPr();
  if (pr.state !== 'open' || pr.base.ref !== 'main') return;
  const sha = pr.head.sha;
  const files = await github.paginate(github.rest.pulls.listFiles, { ...repo, pull_number: prNumber, per_page: 100 });
  const decision = files.length === pr.changed_files ? classify(pr, files, policy) : { automatic: false, reason: '文件清单不完整', issues: [] };
  let issueValid = decision.issues.length > 0;
  for (const issue_number of decision.issues) {
    try {
      const issue = (await github.rest.issues.get({ ...repo, issue_number })).data;
      if (issue.pull_request || issue.state !== 'open') issueValid = false;
    } catch { issueValid = false; }
  }
  const automatic = decision.automatic && issueValid;
  core.summary.addHeading(`PR #${prNumber} 风险判定`).addRaw(`${automatic ? '可自动处理' : '人工验收'}：${decision.reason}\n\nhead: ${sha}\n`);

  // Preserve only an explicit, current-SHA approval produced by the protected workflow.
  const statuses = await github.paginate(github.rest.repos.listCommitStatusesForRef, { ...repo, ref: sha, per_page: 100 });
  const latestPolicy = statuses.find(status => status.context === 'agent/policy');
  const humanApproved = latestPolicy?.state === 'success' && latestPolicy.description === `maintainer-approved:${sha}`;
  if (!humanApproved) await github.rest.repos.createCommitStatus({ ...repo, sha, context: 'agent/policy', state: automatic ? 'success' : 'pending', description: automatic ? 'base-policy: low-risk or explicitly authorized' : '需维护者在受保护环境中验收当前 SHA' });
  if (!automatic || !enabled) { await core.summary.write(); return; }

  const runs = await github.paginate(github.rest.actions.listWorkflowRuns, { ...repo, workflow_id: 'pr-checks.yml', head_sha: sha, event: 'pull_request', per_page: 100 });
  const run = runs.find(item => item.pull_requests?.some(pull => pull.number === prNumber));
  const jobs = run ? await github.paginate(github.rest.actions.listJobsForWorkflowRun, { ...repo, run_id: run.id, filter: 'latest', per_page: 100 }) : [];
  const qualityJob = jobs.find(job => job.name === 'quality');
  const quality = run && { headSha: run.head_sha, conclusion: qualityJob?.conclusion === 'success' ? run.conclusion : null, event: run.event, workflowPath: run.path?.split('@')[0] };
  let protectionReady = false;
  try {
    const result = await github.graphql(`query($owner:String!,$repo:String!){ repository(owner:$owner,name:$repo){ ref(qualifiedName:"refs/heads/main"){ branchProtectionRule{ requiresStrictStatusChecks isAdminEnforced requiresConversationResolution requiredStatusCheckContexts } } } }`, { owner: repo.owner, repo: repo.repo });
    const protection = result.repository.ref?.branchProtectionRule;
    const required = protection?.requiredStatusCheckContexts || [];
    protectionReady = protection?.requiresStrictStatusChecks === true && protection.isAdminEnforced === true && protection.requiresConversationResolution === true && required.includes('quality') && required.includes('agent/policy');
  } catch { /* No permission to prove protection: refuse automatic merging. */ }

  let unresolvedThreads = null;
  let cursor = null;
  do {
    const result = await github.graphql(`query($owner:String!,$repo:String!,$number:Int!,$cursor:String){ repository(owner:$owner,name:$repo){ pullRequest(number:$number){ reviewThreads(first:100,after:$cursor){ nodes{isResolved} pageInfo{hasNextPage endCursor} } } } }`, { owner: repo.owner, repo: repo.repo, number: prNumber, cursor });
    const threads = result.repository.pullRequest.reviewThreads;
    unresolvedThreads = (unresolvedThreads || 0) + threads.nodes.filter(thread => !thread.isResolved).length;
    cursor = threads.pageInfo.hasNextPage ? threads.pageInfo.endCursor : null;
  } while (cursor);
  const reviews = await github.paginate(github.rest.pulls.listReviews, { ...repo, pull_number: prNumber, per_page: 100 });
  const latestReviews = new Map();
  for (const review of reviews) if (['APPROVED', 'CHANGES_REQUESTED', 'DISMISSED'].includes(review.state)) latestReviews.set(review.user.login, review.state);
  const changesRequested = [...latestReviews.values()].includes('CHANGES_REQUESTED');
  pr = await getPr();
  if (canMerge({ enabled, pr, expectedSha: sha, automatic, quality, unresolvedThreads, changesRequested, protectionReady })) {
    const merged = await github.rest.pulls.merge({ ...repo, pull_number: prNumber, sha, merge_method: 'squash' });
    if (!merged.data.merged) throw new Error('GitHub did not merge the PR');
    // A GITHUB_TOKEN merge does not trigger push workflows. Dispatch explicitly,
    // only after the maintainer has aligned source/live state and opted in.
    if (process.env.AUTO_DEPLOY === 'true') await github.rest.actions.createWorkflowDispatch({ ...repo, workflow_id: 'deploy.yml', ref: 'main' });
    core.summary.addRaw('\n已按当前 SHA 执行 squash merge。');
  } else core.summary.addRaw('\n尚未满足完整合并条件；保持 PR 打开，不绕过保护。');
  await core.summary.write();
};
