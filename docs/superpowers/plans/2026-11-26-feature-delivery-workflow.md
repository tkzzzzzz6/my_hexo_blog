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

- [x] 1. 新增交付模式/状态控制器失败测试，再改实现。
- [x] 2. 接入 feature push CI，收窄控制器权限并验证工作流。
- [x] 3. 更新 Agent/贡献/验收文档与设置预览，归并 #55 的历史诊断证据。
- [ ] 4. lint、行为测试、构建、真实 feature CI 和最终 PR CI；只提交一个汇总 PR。

## 验证记录

- 已审查的 #53/#54/#56 按当前 SHA、正常环境验收与必需检查顺序合并，无强推或保护绕过。
- 新行为测试先失败后通过：所有 main 交付均不自动合并，旧 SHA 不能放行；受保护审批继续覆盖边界。
- 独立审查发现的审批状态竞态与发布变量复核问题已补回归并修复；26 个测试通过。
- 本地 lint、actionlint、干净构建通过（451 HTML 页）；旧自动 main 合并测试按新规格替换，不以删除检查来放行 main。
- 真实 feature push CI 首次运行 45829227906 已通过；最终提交和 main 交付 PR 的最新结果以 GitHub 为准。
