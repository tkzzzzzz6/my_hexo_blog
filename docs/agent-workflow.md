# Feature 分支内集成与阶段交付

当前规则由 Issue #57 及维护者后续指令确定：Agent 完成实现、验证并交 PR，维护者在 PR 页面决定并操作合并。取消独立的环境验收与 SHA 输入步骤。

## 1. 分支与任务

- 一个阶段使用一个隔离的 `codex/feature/<topic>` 分支，例如 `codex/feature/issue-57-delivery-workflow`。
- 主 Issue 定义目标与交付范围；子 Issue 和独立提交追踪小任务，默认不为每个任务单独创建 main PR。
- Agent 在约定范围内实现、集成本地子分支、处理冲突并回归验证。产品意图冲突或范围扩大交维护者判断。
- 阶段结束只提交一个 feature → main PR。交付后，下一阶段从最新 main 新建分支，避免永久 feature 分支不断积累任务。

```text
Issue → Feature 内实现与集成 → lint / 测试 / 构建 → 一个交付 PR
                                                       ↓
                                             维护者查看并点击 Merge
```

## 2. 分工与交付

Agent 自主完成已约定范围内的实现、冲突处理、检查及 feature 提交。最终 PR 关联主 Issue，并说明完成的任务、行为变化、验证结果、兼容性及回退方式；可见改动附桌面和手机预览。

Agent 的交付终点是 PR：不调用合并 API，不启用 auto-merge，不直接推送 main。维护者主要审查整体行为、信息架构、交互体验、兼容性及重要配置，并自行操作合并。

不额外要求维护者去 Actions 运行验收、填写 SHA、审批 Environment 或添加批准标签。普通 PR Review 和评论可以用于反馈，不要求同账号作者完成一次 GitHub 自我 Approve。

## 3. CI 与 main 保护

- `PR checks` 在 `codex/feature/**` push、main PR 和手动触发时执行相同的 quality job。
- quality 包含自动化代码 ESLint、YAML/JSON/EJS、变更 JS 语法、行为测试、干净 Hexo 构建和页面/公式/CNAME 检查。
- main 要求 quality、严格最新基线及讨论解决；保留管理员约束、禁强推和禁删除。
- 不再要求 `agent/policy`，删除 Agent policy 与 Maintainer approval 工作流及对应状态写入/审批脚本。
- PR/feature 检查使用只读令牌且没有部署凭据；合并职责由协作规则和维护者操作承担。共享管理员账号不构成强权限隔离，独立身份仍可通过 #47 后续完善。

新增提交必须重新通过检查；lint 不替代行为测试、实际预览与维护者判断。质量检查继续保留，调整的是额外人工验收步骤。

## 4. 维护者操作

1. 打开阶段 PR，查看说明、改动、测试及必要的预览。
2. 有问题直接评论，Agent 在同一 feature 分支修改并重新验证。
3. quality 通过、分支基线满足要求且讨论解决后，维护者点击 Merge（建议 Squash and merge）。

没有额外的 Actions 验收步骤。Agent 不代替维护者执行最终合并。

## 5. 设置迁移与发布

`node tools/agent-flow/setup.cjs` 只预览；合并本流程后，可在更新且干净的 main 使用 `--apply` 安装/复核设置。首次安装要求 quality；复核已有保护时保留其他必需检查和规则，仅移除旧 agent/policy 并确保有 quality，不创建或配置验收环境，不重设 Actions 权限。

针对已有仓库，维护者本次已明确要求取消额外门禁：停用旧 Agent policy / Maintainer approval 工作流，只从 main 的必需状态中移除 agent/policy，保留 quality 和其余保护。旧环境可以保留为无工作流引用的历史配置，无须修改其权限。设置迁移不等于为某个 PR 伪造成功状态或代为合并。

AGENT_AUTO_MERGE 已退役并保持 false。SITE_AUTO_DEPLOY 是独立发布选择，首次缺失时初始化 false，复核时保留已有选择；feature push 不发布网站。本次不修改发布开关。

交付合并与网站上线是两个步骤。发布前确认源码与线上内容对齐；发布后检查文章、链接、图床和 Sitemap。失败时通过新提交或 PR revert，保留历史。

## 6. 历史记录

#35 是初版分级自动合并流程；#55 的诊断已归档。#57/#58 最初使用当前 SHA 环境验收，维护者后续明确取消这一额外步骤，改为普通 PR 手动合并。旧控制器/审批测试随退役模块移除；保留并更新质量检查、设置预览、发布选择与只读工作流测试。
