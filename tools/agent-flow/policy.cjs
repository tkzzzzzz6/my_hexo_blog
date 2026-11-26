'use strict';

function isFeatureBranch(value) {
  if (typeof value !== 'string') return false;
  const name = value.replace(/^refs\/heads\//, '');
  return /^codex\/feature\/[a-z0-9][a-z0-9/-]*$/.test(name) && !name.includes('..') && !name.includes('//') && !name.endsWith('/');
}

function planVariableUpdates(existing) {
  const updates = [];
  if (existing.AGENT_AUTO_MERGE !== 'false') updates.push({ name: 'AGENT_AUTO_MERGE', value: 'false', method: existing.AGENT_AUTO_MERGE === undefined ? 'POST' : 'PATCH' });
  if (existing.SITE_AUTO_DEPLOY === undefined) updates.push({ name: 'SITE_AUTO_DEPLOY', value: 'false', method: 'POST' });
  return updates;
}

function planRequiredChecks(existing) {
  const source = existing?.checks || existing?.contexts?.map(context => ({ context })) || [];
  const checks = source.filter(check => check.context !== 'agent/policy').map(check => ({ context: check.context, app_id: check.app_id ?? -1 }));
  if (!checks.some(check => check.context === 'quality')) checks.push({ context: 'quality', app_id: 15368 });
  return { strict: existing?.strict ?? true, contexts: [], checks };
}

module.exports = { isFeatureBranch, planVariableUpdates, planRequiredChecks };
