# Sitemap 生成配置对齐

关联 #37 / #50。恢复已上线的 sitemap/robots 源配置，不改抓取规则。

- 独立批次基线生成 350 个 HTTPS URL，无重复，全部对应本地生成目标。
- robots.txt 与线上部署仓库逐字节一致。
- 此分支尚未包含待验收的文章批次，完整集合在批次汇合后核对。
- 保留 main 的 ESLint 和 CI 依赖；不复制旧工作区 package.json 整体覆盖。
