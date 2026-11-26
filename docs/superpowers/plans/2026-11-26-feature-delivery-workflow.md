# Feature Delivery Workflow Implementation Plan

> Execute task by task in the existing isolated feature worktree. Issue #57 records the maintainer's revised scope.

**Goal:** Agent 在 feature 分支内集成子任务，阶段结束只提交一个 main PR。
**Architecture:** feature push 与 main PR 运行相同质量检查；可信控制器仅维护 main 的人工验收状态，不合并、不读取管理设置、不触发部署。
**Tech Stack:** Node 24, GitHub Actions/API, ESLint, Hexo.
**Spec:** Issue #57 and the maintainer's explicit request in this chat.

## Global Constraints

- 已审查的 #53/#54/#56 经既有验收流程合并；Dependabot 不在范围。
- 不绕过 main 保护、不伪造状态、不新增凭据、不开启自动发布。
- 用户的新指令替代“每个小任务向 main 提 PR”；一个交付阶段对应一个 feature 分支与汇总 PR。

## Review Focus

- 低风险文档、标签或旧自动化开关均不能自动合并 main。
- 当前 SHA 的人工验收保留；旧 SHA 和快照变化不能放行。
- feature push 真实执行质量检查，但不会发布网站。
- 控制器没有 merge/部署权限，也不需要读取分支管理设置。
- 原工作区、旧网址与已发布内容保持兼容。

## Tasks

- [ ] 1. 新增交付模式/状态控制器失败测试，再改实现。
- [ ] 2. 接入 feature push CI，收窄控制器权限并验证工作流。
- [ ] 3. 更新 Agent/贡献/验收文档与设置预览，归并 #55 的历史诊断证据。
- [ ] 4. lint、行为测试、构建、真实 feature CI 和最终 PR CI；只提交一个汇总 PR。
