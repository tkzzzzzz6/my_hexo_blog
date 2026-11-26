# Feature Delivery Workflow Implementation Plan

> 维护者后续明确简化：Agent 只交最终 PR，合并由维护者操作；取消 agent/policy 与独立环境审批。下方旧验收控制器记录仅说明迭代过程。

## 当前简化设计与执行计划

**Goal:** 一个阶段一个 feature PR，Agent 完成验证后交付，维护者直接在 PR 页决定合并。

**Architecture:** 保留 feature/PR 的只读 quality CI；移除状态控制器、审批工作流和对应脚本。设置脚本仅要求 quality，不再配置审批环境。按维护者本次指令，通过独立 REST 更新将线上必需检查中的 agent/policy 移除，保留其他规则。

**Approaches:** 维护者已经选择普通 PR 手动合并；保留额外 SHA/环境审批会继续增加操作，不符合本次要求。无需引入新的批准标签或自动合并控制器。

**Constraints:** 不自动合并 #58，不改站点/依赖/发布开关；保留 strict、quality、讨论解决、管理员约束、禁强推和禁删除。复用现有隔离 feature 分支和 #57/#58，不新增交付 PR。

- [x] 增加设置预览的失败测试，证明不再要求额外验收，其他保护保留。
- [x] 删除退役的控制/审批模块及旧契约测试，更新当前流程文档与设置脚本。
- [x] 审查修正：setup 复核仅 PATCH 必需检查，保留其他检查、分支保护及 Actions 权限；新增四个先失败后通过的回归测试。
- [ ] Node 24 下依次运行 npm ci --ignore-scripts、lint、测试、构建与 actionlint。
- [ ] 提交并推送到当前 feature，更新 #57/#58 的最终描述。
- [ ] 根据维护者本次指令停用旧控制/审批工作流，只移除线上 agent/policy 必需状态；核对其余保护与当前 SHA CI。

---

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
