'use strict';
const { deliveryDecision } = require('./policy.cjs');

// Runs only from the trusted default branch. This controller never merges,
// dispatches deployments, or reads branch-management settings.
module.exports = async function controller({ github, context, core, number }) {
  const repo = context.repo;
  const prNumber = Number(number || context.payload.pull_request?.number);
  if (!Number.isSafeInteger(prNumber) || prNumber < 1) throw new Error('Invalid PR number');
  const getPr = async () => (await github.rest.pulls.get({ ...repo, pull_number: prNumber })).data;
  const pr = await getPr();
  if (pr.state !== 'open' || !deliveryDecision(pr).requiresMaintainer) return;
  const sha = pr.head.sha;
  const snapshot = await getPr();
  const sameRepo = snapshot.base.repo.full_name === pr.base.repo.full_name && snapshot.head.repo.full_name === pr.head.repo.full_name;
  if (snapshot.state !== 'open' || snapshot.head.sha !== sha || snapshot.base.ref !== pr.base.ref || snapshot.base.sha !== pr.base.sha || !sameRepo) {
    await core.summary.addHeading(`PR #${prNumber}`).addRaw('PR snapshot changed; wait for a fresh evaluation.').write();
    return;
  }
  const statuses = await github.paginate(github.rest.repos.listCommitStatusesForRef, { ...repo, ref: sha, per_page: 100 });
  const latest = statuses.find(status => status.context === 'agent/policy');
  const approved = latest?.state === 'success' && latest.description === `maintainer-approved:${sha}`;
  if (!approved) await github.rest.repos.createCommitStatus({ ...repo, sha, context: 'agent/policy', state: 'pending', description: '阶段交付到 main：等待维护者验收当前 SHA' });
  await core.summary.addHeading(`PR #${prNumber} 阶段交付`).addRaw(`head: ${sha}\n\n${approved ? '当前提交的维护者验收已记录。' : '等待维护者验收；小任务在 feature 内集成。'}\n\n控制器不自动合并 main，也不触发发布。`).write();
};
