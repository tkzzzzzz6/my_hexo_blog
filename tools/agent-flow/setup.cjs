'use strict';
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const { planVariableUpdates, planRequiredChecks } = require('./policy.cjs');
const policy = JSON.parse(fs.readFileSync('.github/agent-policy.json', 'utf8'));
const repository = 'tkzzzzzz6/my_hexo_blog';
function api(endpoint, method = 'GET', body) {
  const args = ['api', endpoint, '--method', method];
  if (body) args.push('--input', '-');
  const output = execFileSync('gh', args, { encoding: 'utf8', input: body ? JSON.stringify(body) : undefined });
  return output.trim() ? JSON.parse(output) : null;
}
const protection = {
  required_status_checks: { strict: true, checks: [{ context: 'quality', app_id: 15368 }] },
  enforce_admins: true,
  required_pull_request_reviews: { required_approving_review_count: 0, dismiss_stale_reviews: true },
  restrictions: null,
  required_conversation_resolution: true,
  allow_force_pushes: false,
  allow_deletions: false
};
if (!process.argv.includes('--apply')) {
  console.log(JSON.stringify({ repository, mode: 'feature-delivery', featurePrefix: policy.featurePrefix, mergeBy: 'maintainer', protection, AGENT_AUTO_MERGE: false, SITE_AUTO_DEPLOY: { default: false, preserveExisting: true }, note: 'Preview only. After this workflow is reviewed and merged, run --apply from updated main.' }, null, 2));
} else {
  if (execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim()) throw new Error('Use a clean, reviewed checkout');
  const head = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  const remoteHead = api(`repos/${repository}/commits/main`).sha;
  if (head !== remoteHead) throw new Error('Use the current remote main commit');
  const remotePolicy = api(`repos/${repository}/contents/.github/agent-policy.json?ref=main`);
  const remote = JSON.parse(Buffer.from(remotePolicy.content, 'base64').toString('utf8'));
  if (JSON.stringify(remote) !== JSON.stringify(policy)) throw new Error('Run from reviewed and updated main; remote policy differs');
  api(`repos/${repository}/actions/workflows/pr-checks.yml`);
  let currentProtection;
  try { currentProtection = api(`repos/${repository}/branches/main/protection`); }
  catch (error) { if (!String(error.stderr).includes('HTTP 404')) throw error; }
  if (currentProtection) {
    api(`repos/${repository}/branches/main/protection/required_status_checks`, 'PATCH', planRequiredChecks(currentProtection.required_status_checks));
  } else {
    api(`repos/${repository}/branches/main/protection`, 'PUT', protection);
  }
  const existing = {};
  for (const name of ['AGENT_AUTO_MERGE', 'SITE_AUTO_DEPLOY']) {
    try { existing[name] = api(`repos/${repository}/actions/variables/${name}`).value; }
    catch (error) { if (!String(error.stderr).includes('HTTP 404')) throw error; }
  }
  for (const { name, value, method } of planVariableUpdates(existing)) {
    api(`repos/${repository}/actions/variables${method === 'PATCH' ? '/' + name : ''}`, method, { name, value });
  }
  console.log('Guardrails installed. Agent delivers a PR; the maintainer merges after quality passes. No separate environment approval.');
}
