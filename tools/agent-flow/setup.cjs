'use strict';
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const policy = JSON.parse(fs.readFileSync('.github/agent-policy.json', 'utf8'));
const repository = 'tkzzzzzz6/my_hexo_blog';
function api(endpoint, method = 'GET', body) {
  const args = ['api', endpoint, '--method', method];
  if (body) args.push('--input', '-');
  const output = execFileSync('gh', args, { encoding: 'utf8', input: body ? JSON.stringify(body) : undefined });
  return output.trim() ? JSON.parse(output) : null;
}
const protection = {
  required_status_checks: { strict: true, checks: [{ context: 'quality', app_id: 15368 }, { context: 'agent/policy', app_id: 15368 }] },
  enforce_admins: true,
  required_pull_request_reviews: { required_approving_review_count: 0, dismiss_stale_reviews: true },
  restrictions: null,
  required_conversation_resolution: true,
  allow_force_pushes: false,
  allow_deletions: false
};
if (!process.argv.includes('--apply')) {
  console.log(JSON.stringify({ repository, protection, environment: 'maintainer-approval', reviewers: policy.maintainers, AGENT_AUTO_MERGE: false, SITE_AUTO_DEPLOY: false, note: 'Preview only. After the foundation PR is merged, run --apply from updated main.' }, null, 2));
} else {
  if (execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim()) throw new Error('Use a clean, reviewed checkout');
  const head = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  const remoteHead = execFileSync('git', ['ls-remote', 'origin', 'refs/heads/main'], { encoding: 'utf8' }).split(/\s+/)[0];
  if (head !== remoteHead) throw new Error('Use the current remote main commit');
  const remotePolicy = api(`repos/${repository}/contents/.github/agent-policy.json?ref=main`);
  const remote = JSON.parse(Buffer.from(remotePolicy.content, 'base64').toString('utf8'));
  if (JSON.stringify(remote) !== JSON.stringify(policy)) throw new Error('Run from reviewed and updated main; remote policy differs');
  for (const file of ['pr-checks.yml', 'agent-control.yml', 'maintainer-approval.yml']) api(`repos/${repository}/actions/workflows/${file}`);
  const reviewers = policy.maintainers.map(login => ({ type: 'User', id: api(`users/${login}`).id }));
  api(`repos/${repository}/environments/maintainer-approval`, 'PUT', { reviewers, prevent_self_review: false, can_admins_bypass: false });
  api(`repos/${repository}/actions/permissions`, 'PUT', { enabled: true, allowed_actions: 'all' });
  api(`repos/${repository}/branches/main/protection`, 'PUT', protection);
  for (const name of ['AGENT_AUTO_MERGE', 'SITE_AUTO_DEPLOY']) {
    let exists = false;
    try { api(`repos/${repository}/actions/variables/${name}`); exists = true; } catch { /* create a missing variable */ }
    api(`repos/${repository}/actions/variables${exists ? '/' + name : ''}`, exists ? 'PATCH' : 'POST', { name, value: 'false' });
  }
  console.log('Guardrails installed. Automatic merge/deploy remain off until their documented checks are complete.');
}
