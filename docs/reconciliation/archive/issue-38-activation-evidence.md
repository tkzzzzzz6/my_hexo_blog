> 历史证据：此处的自动合并 main 设计已由 Issue #57 的 feature 阶段交付替代；不是当前操作指南。

# Issue #38：配置与真实验证记录

日期：2026-11-26。基础 PR #35 已合并，当前 main 基线 `7e5fea46a32fbff0d515dffcdbe4bb94e03f351d`。

## 已完成

- 在最新、干净的工作区运行依赖安装、lint、36 个行为测试和干净构建；验证 445 个 HTML 页面。
- 按已审查的 setup.cjs 应用设置；通过 API 核对 main 必需 `quality` / `agent/policy`、strict=true、enforce_admins=true、required_conversation_resolution=true。
- `maintainer-approval` 环境指定维护者 tkzzzzzz6，can_admins_bypass=false。
- 创建真实低风险任务 #48 / PR #52：14 行文档，quality 与 agent/policy 均通过。
- 对高风险内容/配置 PR #53 / #54 保持人工验收，不通过标签或直接合并绕过。

## 实测阻塞与处理

曾短暂启用 AGENT_AUTO_MERGE 进行真实验证，但受信控制器拒绝合并。只读诊断工作流运行 [45795065575](https://github.com/tkzzzzzz6/my_hexo_blog/actions/runs/45795065575) 证明：

- 当前 PR head、quality 工作流、quality job、目标 main 和 mergeable_state=clean 均正常。
- 默认 GitHub Actions 令牌查询 branchProtectionRule 返回 `Resource not accessible by integration`。
- 本地管理员 gh 能读该设置，并不等于 Actions 令牌可以读；原模拟测试没有验证这个平台权限边界。

控制器的拒绝行为正确，但原来吞掉了异常原因。本 PR 补充可观察的 warning、条件摘要及拒绝情形回归测试，不降低任何合并门槛，也不引入额外凭据。

## 当前状态

- AGENT_AUTO_MERGE 已恢复 **false**；PR #52 保持打开，没有冒充合并成功。
- SITE_AUTO_DEPLOY 始终 **false**；线上静态仓库未被重新发布。
- 分支保护和人工验收环境保持启用。
- #38 尚未完成“真实自动合并”验收，不应关闭。

## 维护者后续决策

按 AGENTS.md 的约定，不得为获得合并安装凭据、伪造状态或弱化检查。可先保留人工合并，完成 #37 的源码对齐；若继续实现强隔离与自动合并，提前处理 #47，明确受信控制器读取保护所需的最小权限，并由维护者私下配置独立身份后再实测。

本次临时只读诊断步骤已从最终 pr-checks.yml 移除，避免把特定 PR 编号留在通用 CI 中。
