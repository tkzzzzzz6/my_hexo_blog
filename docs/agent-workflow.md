# Feature 分支内集成与阶段交付

当前规则由 Issue #57 及维护者明确指令确定，替代 #34 初版的“每个小任务向 main 提 PR”和“自动合并低风险 main PR”。

## 1. 分支与任务

- 一个阶段使用一个 `codex/feature/<topic>` 分支及隔离 worktree，例如 `codex/feature/issue-57-delivery-workflow`。
- 主 Issue 定义目标与交付范围；子 Issue 记录独立问题和验收标准，不等于必须创建子 PR。
- Agent 在约定范围内完成小功能、提交、集成本地子分支和处理冲突。默认不为小任务制造 GitHub PR。
- 阶段结束才创建一个 feature → main 的汇总 PR。不要维护无限增长的永久 feature 分支；交付后下一阶段从最新 main 新建。

```text
main ────────────────────────────────── 维护者验收后合并
   └─ codex/feature/<topic>
        ├─ 子任务 A：实现 → 测试 → 提交
        ├─ 子任务 B：实现/集成 → 回归 → 提交
        └─ 阶段验证 → 一个交付 PR ────────┘
```

## 2. Agent 与维护者的分工

Agent 自主完成已约定范围内的实现、冲突处理、检查及 feature 提交。全局改动可以在 feature 内准备，但范围扩张、产品意图冲突和不可逆操作仍需维护者决定。

维护者主要审查最终全局行为、信息架构、交互体验、兼容性及高风险配置。进入 main 的交付一律需要维护者验收，文档和小改动也不能自行绕过。

阶段 PR 正文关联主 Issue，并逐项说明：已完成子任务、行为变化、验证结果、桌面/手机预览、URL/评论兼容性、部署与回退。新提交需要重新检查和当前 SHA 验收。

## 3. CI 与 main 保护

- `PR checks` 在 `codex/feature/**` push、main PR 和手动触发时执行相同的 quality job。
- quality 包含自动化代码 ESLint、YAML/JSON/EJS、变更 JS 语法、行为测试、干净 Hexo 构建和页面/公式/CNAME 检查。
- main 仍要求 quality 与 agent/policy、严格最新基线、讨论解决，并禁止强推/删除及管理员绕过。
- 可信默认分支控制器仅将当前 main PR 标记为“等待维护者验收”，保留受保护工作流写入的当前 SHA 批准；它没有 merge/部署 API 调用，也不再读取 branchProtectionRule。
- 控制器权限收窄为 contents/read、pull-requests/read、statuses/write。feature/PR 检查只读且不持有部署凭据，不执行来自 PR 的代码来决定授权。

默认 Actions 令牌无法读取分支管理详情的旧阻塞因此不再是交付前置条件：规则由 GitHub 服务端和既有保护执行，Agent 不再尝试自动合并 main。没有移除任何 main 必需检查。

## 4. 维护者验收与合并

1. 查看交付 PR 的最终结果和当前 SHA 检查。
2. Actions → Maintainer approval → Run workflow，输入 PR 编号与完整 head SHA。
3. 在 maintainer-approval 环境批准这次执行。脚本核对指定维护者、环境审核规则、目标 main 与当前 SHA 后记录 agent/policy 成功。
4. 维护者合并，或明确授权 Agent 代为合并；使用 SHA 锁定当前提交，不能管理员绕过。

聊天中的明确验收和代合并授权可以由 Agent 通过正常环境审批/API 留痕执行；这不允许 Agent 在没有维护者同意时替自己批准。共享管理员身份仍然只是协作约束，不是强权限沙箱；真正的身份隔离继续跟踪 #47。

## 5. 设置与发布

`node tools/agent-flow/setup.cjs` 预览，合并此流程后在更新且干净的 main 使用 `--apply` 安装/复核既有保护及环境。保留相同的必需检查和人工验收入口。

AGENT_AUTO_MERGE 已退役并保持 false，控制器不再读取该开关。SITE_AUTO_DEPLOY 独立控制发布，首次安装缺失时初始化为 false，复核设置时保留已有选择；feature push 从不发布网站。

控制器与维护者审批共用按 PR 编号区分的串行组，避免控制器读取旧状态后将刚批准的 success 覆盖为 pending；等待环境验收的运行不被新事件取消。

交付合并和网站上线是两个步骤。发布前确认源码与线上内容对齐；发布后检查文章、链接、图床和 Sitemap。失败时用新提交/PR revert，保留历史，不重写 main。

## 6. 历史记录

#35 是初版流程；#55 中的旧权限诊断已归入本交付的历史证据，其原自动 main 合并方案被本模式替代。原有测试中允许自动 main 合并的断言，改为覆盖“任何 main 交付均不自动合并”；人工审批、旧 SHA 拒绝、快照变化和工作流权限检查继续保留。
