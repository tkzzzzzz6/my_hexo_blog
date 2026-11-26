# Feature Delivery Workflow Implementation Plan

> Execute in the existing isolated codex/feature/issue-57-delivery-workflow worktree. Issue #57 / PR #58 track the whole delivery. The maintainer's latest instruction supersedes the initial environment-approval design.

**Goal:** Agent 在 feature 内完成小任务与验证，阶段结束只交一个 main PR，维护者在 PR 页面自行合并。

**Architecture:** Feature push 与 main PR 共用只读 quality CI。删除 agent/policy 控制器和独立审批工作流。已有保护只精准更新必需检查，不重置其他规则。

**Tech Stack:** Node 24, GitHub Actions/API, ESLint, Hexo.

**Spec:** 维护者明确要求：不用额外验收，Agent 只交 PR，合并留给维护者。当前规则见 [交付流程](../../agent-workflow.md)。

## Design decisions

- 采用普通 PR 手动合并，不再要求填写 SHA、Environment 审批或批准标签。
- 一个短期 feature 对应一个可验收目标；子任务用 Issue 和提交追踪，默认不单独向 main 提 PR。
- Agent 不调用合并 API、不启用 auto-merge、不直接推 main。
- 保留 quality、现有 strict、其他必需检查、管理员约束、讨论解决、禁强推和禁删除。
- 不改站点正文、URL、评论映射、依赖和发布开关；Dependabot 不在本次范围。

## Tasks and evidence

- [x] 设置预览测试先失败，证明旧 agent/policy 是额外必需项；删除后通过。
- [x] 删除 Agent policy / Maintainer approval 工作流、控制器、审批模块及其退役契约测试；更新 Agent/贡献/交付指南。
- [x] 审查发现 setup 会全量重置已有保护；四项回归先失败后通过。已有保护改为只 PATCH 必需检查，保留其他集成、App 绑定和 strict，不重设 Actions 权限。
- [x] Node 24：npm ci --ignore-scripts、完整 npm run lint:agent、13 项测试、actionlint 通过；干净构建验证 451 HTML 页。
- [x] 实现提交 d389088 已推送；feature push CI 45836399674 与 PR CI 45836408654 均通过。最终文档提交的结果以 PR Checks 为准。
- [x] 按维护者本次明确指令迁移线上设置：只移除 agent/policy 必需状态，停用旧两个验收工作流；前后 API 快照确认其余保护完全一致。
- [x] 独立只读审查确认设置覆盖问题已修正；发布开关未变，main 未合并、网站未发布。

## Handoff

当前阶段仍只有 PR #58，维护者查看并决定合并。旧环境保留为未引用的历史配置；旧等待状态不再是必需检查，后续提交不再创建该状态。已合并的 #53/#54/#56 和 #55 历史诊断不混入当前功能差异。

**Review focus:** 最终流程是否符合维护者分工；quality 是否运行在当前 head；设置复核是否仅修改目标检查；发布与合并是否分开。此前的自动 main 合并、SHA 验收与状态串行设计均已退役。
