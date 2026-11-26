# 构建时区与旧网址验证

站点配置与构建进程都使用 `Asia/Shanghai`。仅设置 `_config.yml` 的 timezone 不足以消除当前 Hexo 日期解析与 permalink 对宿主时区的依赖；两个 Actions 工作流通过 `TZ` 明确指定构建时区。

本地构建也应使用该时区：PowerShell 先执行 `$env:TZ = 'Asia/Shanghai'`，Linux/macOS 可运行 `TZ=Asia/Shanghai npm run check:build`。

`tools/agent-flow/fixtures/published-routes.json` 是本次发布前，静态部署提交 `876a26e59218be48a3059206b16d0d91169b58a7` 对应线上 Sitemap 的 361 个网址。`check:build` 会逐个检查生成目标，缺失时退出失败；新增文章不需要删除或重新生成这份兼容性基线。需要更改旧网址时应提供兼容路径或重定向，并在对应 PR 中说明。

Issue #59 记录了真实发布中 UTC 导致日期前移一天的问题，以及先恢复已验证静态树、再由维护者审查源码 PR 的处理。
