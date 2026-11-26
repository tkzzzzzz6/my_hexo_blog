'use strict';
const fs = require('node:fs');
const { validApprovalEnvironment } = require('./policy.cjs');

module.exports = async function approve({ github, context, core, number, sha }) {
  const policy = JSON.parse(fs.readFileSync('.github/agent-policy.json', 'utf8'));
  if (!policy.maintainers.includes(context.actor)) throw new Error('Only a configured maintainer can request approval');
  const environment = (await github.rest.repos.getEnvironment({ ...context.repo, environment_name: 'maintainer-approval' })).data;
  if (!validApprovalEnvironment(environment, policy.maintainers)) throw new Error('Required maintainer environment reviewers are missing or untrusted');
  if (!/^[a-f0-9]{40}$/.test(sha)) throw new Error('Use the full current PR head SHA');
  const pr = (await github.rest.pulls.get({ ...context.repo, pull_number: Number(number) })).data;
  if (pr.state !== 'open' || pr.base.ref !== 'main' || pr.head.sha !== sha || pr.head.repo.full_name !== pr.base.repo.full_name) throw new Error('PR closed, forked, wrong base, or approval SHA is stale');
  await github.rest.repos.createCommitStatus({ ...context.repo, sha, context: 'agent/policy', state: 'success', description: `maintainer-approved:${sha}` });
  await core.summary.addHeading(`维护者已验收 PR #${number}`).addRaw(`仅授权当前提交 ${sha}。后续新提交须重新验收。此操作不自动合并高风险 PR。`).write();
};
