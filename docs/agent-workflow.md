# Agent 分级合并与维护者验收

Issue #34 的约定：维护者决定方向、全局体验与高风险变更；Agent 自主处理范围清楚的实现、冲突和低风险合并。默认拒绝不确定情况。

## 1. 日常流程

Issue（问题、范围、验收）→ 独立 `codex/issue-N-topic` 分支/worktree → Draft PR → 检查与预览 → 按风险合并 → 经授权部署及线上验证。

- PR 必须关联真实、仍打开的同仓库 Issue：`Fixes #N`。
- `quality` 包含 ESLint、YAML/JSON/EJS 语法、Node 行为测试、干净 Hexo 构建、非空页面、CNAME 与公式渲染检查。它不等于浏览器视觉验收，不声称检查了所有历史 JS 或外链可用性。
- Agent 可自行解决冲突。必须理解两侧意图，记录处理并重跑检查；产品意图冲突交由维护者裁定，不盲目选 ours/theirs。
- 每个新提交都按新的 head SHA 判定；旧提交通过的检查与批准不能沿用。
- 界面功能必须补桌面/手机证据，维护者不必逐行审查一般细节。

## 2. 风险与授权

| 范围 | 合并方式 |
| --- | --- |
| README、`docs/guides/` 下 Markdown；最多 4 文件、80 行变更 | 满足所有检查后 Agent 控制器可 squash merge |
| 一般功能 | 先在默认分支策略中记录 Issue、精确文件清单、截止日期与 diff 上限，再允许控制器处理 |
| 主题、全局脚本、依赖、策略、工作流、权限、部署、网址规则；删除/重命名/未知文件 | 维护者验收当前 SHA 后手动合并 |
| 外部 fork、清单不完整、缺少 Issue、检查失败/跳过/过期、未解决审查 | 不自动合并 |

策略在 `.github/agent-policy.json`。一般功能的授权示例（须通过人工审查的策略 PR 合入 main，不能在任务 PR 自授权）：

```json
{
  "issue": 123,
  "paths": ["source/search/index.md", "source/search/search.js"],
  "expires": "2026-12-31",
  "maxFiles": 2,
  "maxLines": 80
}
```

策略的默认总上限仍生效。Issue 合并关闭后不能继续复用。标签、PR 描述中的“已批准”、Agent 自述均不授予权限。没有规则覆盖的代码变更自动升级为人工验收。

## 3. 信任边界

- `pr-checks.yml`：`pull_request`，只读令牌，无部署凭据；检出 GitHub PR 合并结果并执行检查。
- `agent-control.yml`：默认分支上的 `pull_request_target` / `workflow_run` / 手动重评。只读取默认分支代码和 API 文件清单，不检出 PR、不执行 PR 依赖或 artifact。只有明确开关开启才尝试合并。
- 控制器同时验证真实 Issue、当前 SHA、`PR checks` 工作流及 `quality` job 成功、严格分支保护、未解决线程和 Request changes。GitHub 合并 API 再以 SHA 锁定当前提交，不使用管理员绕过。
- `maintainer-approval.yml`：默认分支代码；先经过 `maintainer-approval` 环境的人工批准，再验证环境配置、发起者、PR 和完整 SHA。仅写入 `agent/policy` 状态，不自动合并全局功能。

**共享管理员账号不构成强权限隔离。** 当前账号能改仓库设置、状态或工作流，因此本方案初期约束正常协作，不能抵御该身份主动绕过。需要强隔离时，维护者保管管理员权限；Agent 使用独立受限 GitHub App/账号，不授予 Administration、Workflows、Commit statuses 写入或保护绕过权限。仓库 CI 的 GitHub Actions 身份与 Agent 的交互身份分开。

GitHub Actions 作为共享检查来源也并非独立审查者。对恶意工作流变更需要更强保证时，使用独立的受信 GitHub App/组织级必需工作流进行策略证明，不把同账号配置宣称为安全沙箱。

## 4. 基础 PR 合并后的启用步骤

本基础设施 PR 自身属高风险，由维护者审查合并。原工作区中未提交的主题/题解/文章不在本 PR。

1. 更新到已审查的 main，运行 `npm ci --ignore-scripts`、`npm run lint:agent`、`npm run test:agent`、`npm run check:build`。
2. `node tools/agent-flow/setup.cjs` 预览设置；`node tools/agent-flow/setup.cjs --apply` 应用。
3. 设置脚本创建有指定维护者审核的环境，配置 main 的必需 `quality` 与 `agent/policy` 检查、严格基线、管理员同样受限、讨论解决及禁用强推/删除。个人仓库不强制另一位 PR 审核者人数，人工验收通过环境完成。
4. 两个变量默认 `false`：`AGENT_AUTO_MERGE`、`SITE_AUTO_DEPLOY`。没有配置时也按 false 处理。
5. 先开一个真实的低风险文档 PR 验证 `quality` 和 `agent/policy` 结果；再由维护者设置 `AGENT_AUTO_MERGE=true`。必要时手动运行 Agent policy，输入 PR 编号重新评估。
6. 源码/main 与已上线版本对齐后，才设置 `SITE_AUTO_DEPLOY=true`。当前线上存在未入源码的文章和主题改动，切勿提前打开。

`--apply` 需要维护者本机 `gh` 的管理权限；不会创建或输出任何凭据。重复执行会把自动化开关恢复为 false，便于安全重新检查设置。

## 5. 如何验收大功能

维护者查看 PR 的效果、范围、兼容性和验收结果后，在 Actions → Maintainer approval → Run workflow，输入 PR 编号和完整 head SHA；在环境待审核入口批准这次执行。工作流校验通过会将该提交的 `agent/policy` 置为成功，维护者再执行 squash merge。

新提交需重新验收。尚未安装环境审核规则时，审批脚本拒绝放行，而不是把一个名字相同的无审核环境当作批准。基础 PR 首次合并前主分支没有这些脚本，不能把本 PR 缺失的可信控制器结果冒充为已通过；先由维护者完成引导合并，再安装保护。

## 6. 部署与回退

- PR 检查不部署。main 的自动部署需要 `SITE_AUTO_DEPLOY=true`，手动 workflow_dispatch 仍可由维护者显式发布。
- GITHUB_TOKEN 执行合并通常不会触发后续 push 工作流，因此控制器在自动发布已单独授权时显式 dispatch `deploy.yml`；不会因低风险合并静默跳过已授权的发布。
- 部署使用 `check:build` 检查日志和产物，避免 Hexo 退出 0 却输出 ERROR 时继续上传。
- 出问题先关闭 `AGENT_AUTO_MERGE` / `SITE_AUTO_DEPLOY`；用新 PR revert，重跑检查并验证线上页面，不重写 main 历史。

## 7. 当前边界

这不是“一切绿灯即正确”的承诺。CI 不判断视觉审美、研究结论和整体信息架构；维护者负责这些全局判断。仓库保护与自动化开关必须在基础 PR 审查合并后启用，独立身份由维护者私下配置。
