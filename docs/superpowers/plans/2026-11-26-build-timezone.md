# Build Timezone and Published Routes Plan

**Goal:** 修复 UTC runner 造成永久链接前移一天的问题，保留线上旧网址。

**Architecture:** 检查与发布工作流统一 TZ=Asia/Shanghai；check:build 对照发布前 361 个网址验证真实产物，缺失时阻止发布。实现只交 #59 对应的一个 feature PR，维护者合并。

**Scope:** 不改文章日期/URL/正文、依赖、评论 mapping、发布凭据或自动发布开关。

- [x] 用真实 Hexo 日期调整和 permalink 生成复现 UTC 下 /11/25/ 与 /11/07/，增加先失败测试。
- [x] 用新静态提交恢复发布前已验证树，FlowAlign 与 Colab 原网址均恢复 HTTP 200，不重写历史。
- [x] 设置两个工作流的宿主时区；增加已发布路由检查和回归。
- [ ] 本地 lint / 测试 / 干净构建、真实 Linux CI 通过；只交修复 PR。

发布恢复提交 e8b834ca 的树与 876a26e5 完全一致。发布构建成功不等于旧网址正确，后续必须核对 Pages 及真实页面响应。
