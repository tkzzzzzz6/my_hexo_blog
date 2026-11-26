'use strict';

function isFeatureBranch(value) {
  if (typeof value !== 'string') return false;
  const name = value.replace(/^refs\/heads\//, '');
  return /^codex\/feature\/[a-z0-9][a-z0-9/-]*$/.test(name) && !name.includes('..') && !name.includes('//') && !name.endsWith('/');
}

function deliveryDecision(pr) {
  return { requiresMaintainer: pr.base?.ref === 'main', automaticMerge: false };
}

function validApprovalEnvironment(environment, maintainers) {
  const reviewers = environment.protection_rules?.find(rule => rule.type === 'required_reviewers')?.reviewers;
  return Array.isArray(reviewers) && reviewers.length > 0 && reviewers.every(item => item.type === 'User' && maintainers.includes(item.reviewer?.login));
}


function planVariableUpdates(existing) {
  const updates = [];
  if (existing.AGENT_AUTO_MERGE !== 'false') updates.push({ name: 'AGENT_AUTO_MERGE', value: 'false', method: existing.AGENT_AUTO_MERGE === undefined ? 'POST' : 'PATCH' });
  if (existing.SITE_AUTO_DEPLOY === undefined) updates.push({ name: 'SITE_AUTO_DEPLOY', value: 'false', method: 'POST' });
  return updates;
}

module.exports = { isFeatureBranch, deliveryDecision, validApprovalEnvironment, planVariableUpdates };
