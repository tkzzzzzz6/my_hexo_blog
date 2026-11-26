'use strict';

const protectedPath = path => /^(?:\.github\/|tools\/agent-flow\/|themes\/|scripts\/|packages\/|AGENTS\.md$|CONTRIBUTING\.md$|package(?:-lock)?\.json$|_config.*|eslint\.|\.npmrc$|\.gitignore$|source\/(?:robots\.txt|CNAME|404\.html)$)/.test(path);
const validPath = path => typeof path === 'string' && !path.startsWith('/') && !/[\\\r\n\0]/.test(path) && !path.split('/').some(part => part === '..' || part === '.' || part === '');

function issueNumbers(body = '') {
  return [...body.matchAll(/\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#([1-9]\d*)\b/gi)].map(match => Number(match[1]));
}

function classify(pr, files, policy, now = new Date()) {
  const manual = reason => ({ automatic: false, reason, issues: issueNumbers(pr.body) });
  const issues = issueNumbers(pr.body);
  if (pr.head?.repo?.full_name !== pr.base?.repo?.full_name || !pr.head?.repo?.full_name) return manual('外部 fork 或仓库身份不确定');
  if (!issues.length) return manual('需要关联同仓库 Issue：Fixes #编号');
  if (!files.length || files.some(file => !validPath(file.filename) || !['added', 'modified'].includes(file.status) || !Number.isSafeInteger(file.changes) || file.changes < 0)) return manual('空 diff、未知指标、删除、重命名或不规范路径');
  if (files.some(file => protectedPath(file.filename))) return manual('涉及策略、部署、依赖、全局脚本或主题');
  const lines = files.reduce((sum, file) => sum + file.changes, 0);
  if (!Number.isSafeInteger(policy.maxFiles) || !Number.isSafeInteger(policy.maxLines) || files.length > policy.maxFiles || lines > policy.maxLines) return manual('超过默认修改范围');
  if (files.every(file => file.filename === 'README.md' || /^docs\/guides\/.+\.md$/.test(file.filename))) return { automatic: true, reason: '低风险文档范围', issues };
  const authorization = (policy.authorizations || []).find(rule => issues.includes(rule.issue) && /^\d{4}-\d{2}-\d{2}$/.test(rule.expires) && new Date(rule.expires + 'T23:59:59Z') >= now && Number.isSafeInteger(rule.maxFiles) && Number.isSafeInteger(rule.maxLines) && files.length <= rule.maxFiles && lines <= rule.maxLines && files.every(file => rule.paths?.includes(file.filename)));
  return authorization ? { automatic: true, reason: `默认分支已授权 Issue #${authorization.issue}`, issues } : manual('一般功能尚无可信基线授权，需维护者验收');
}

function canMerge({ enabled, pr, expectedSha, automatic, quality, unresolvedThreads, changesRequested, protectionReady }) {
  return enabled === true && automatic === true && protectionReady === true && pr.state === 'open' && pr.draft === false && pr.mergeable === true && pr.mergeable_state === 'clean' && pr.head.sha === expectedSha && quality?.headSha === expectedSha && quality.conclusion === 'success' && quality.event === 'pull_request' && quality.workflowPath === '.github/workflows/pr-checks.yml' && unresolvedThreads === 0 && changesRequested === false;
}

function validApprovalEnvironment(environment, maintainers) {
  const reviewers = environment.protection_rules?.find(rule => rule.type === 'required_reviewers')?.reviewers;
  return Array.isArray(reviewers) && reviewers.length > 0 && reviewers.every(item => item.type === 'User' && maintainers.includes(item.reviewer?.login));
}

module.exports = { classify, canMerge, validApprovalEnvironment, issueNumbers };
