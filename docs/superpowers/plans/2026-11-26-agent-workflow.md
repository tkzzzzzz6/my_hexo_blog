# Agent Workflow Implementation Plan

> For agentic workers: execute task by task using the executing-plans skill; preserve the existing main checkout.

**Goal:** Issue #34 的分级合并、质量检查与人工验收机制。
**Architecture:** 无凭据 PR 检查与可信默认分支控制器分离；默认拒绝，授权范围显式配置；人工审批绑定 SHA。
**Tech Stack:** Node 24、ESLint、Node test runner、GitHub Actions/API、Hexo。
**Spec:** `docs/superpowers/specs/2026-11-26-agent-workflow.md`

## Global Constraints

- 独立 worktree；不混入原目录中的未提交改动。
- 基础设施 PR 不自动合并；不自动发布线上站点。
- CI 不获取部署凭据；控制器不执行 PR 代码。

## Review Focus

- 修改/删除/重命名敏感路径及策略自授权：分类负例测试。
- 标签/PR 描述伪造：不能提供权限；测试只认可信策略。
- 过期 SHA、失败/跳过检查：合并资格测试。
- fork、无 Issue、过大 diff：默认人工处理。
- 旧主分支与原目录存在差异：从 origin/main 构建并记录基线。

## Tasks

- [x] 1. 先写策略与合并资格负例测试，确认失败，再实现纯函数。
- [x] 2. 实现质量检查、可信 API 控制器、受保护环境审批和工作流。
- [x] 3. 增加 Agent/贡献规则、Issue/PR 模板及幂等设置工具。
- [x] 4. 本地 lint/test/clean build；审查整条分支；建立 PR、执行 GitHub 检查。

## Decisions / evidence

- 本次只交付审查 PR；仓库保护与自动合并开关在合并本 PR 后通过设置脚本显式启用，避免先配置不存在的必需检查把仓库锁住。
- GitHub Actions 当前关闭：为了运行本 PR 的无部署检查，仅启用 Actions；不会合并 main 或触发既有 push 部署。
- 证据：全新依赖安装和基线构建通过；lint、actionlint v1.7.7、36 个行为测试通过；干净构建验证 445 个 HTML 页面。
- 审查修复：通过不可变 base/head 比较生成文件清单；写入策略状态前复核快照；合并前复核目标分支、仓库与 base SHA。新增竞态回归测试先失败后通过。
- PR #35 关联 Issue #34；可信控制器/环境审批的真实集成启用需基础 PR 先由维护者合并，不能在 main 尚无这些脚本时声称已经启用。
