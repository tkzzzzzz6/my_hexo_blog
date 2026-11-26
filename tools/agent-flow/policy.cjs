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


module.exports = { isFeatureBranch, deliveryDecision, validApprovalEnvironment };
