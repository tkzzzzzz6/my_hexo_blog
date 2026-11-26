# 设计：每日一题改造成 changelog 式索引页（/daily）

- 日期：2026-11-21
- 状态：已实施（2026-11-21）；后续调整见 §9
- 关联清单：[2026-11-21-daily-manifest.md](./2026-11-21-daily-manifest.md)

## 1. 目标

首页「最新文章」只呈现有归纳价值的文章；单题题解不再占据首屏，改为在一个类似 changelog 的索引页 `/daily` 里按时间倒序集中展示，便于读者检索与回看。

不改变已发布题解的 URL（仍是 `/:year/:month/:day/:title/`），不改变归档/标签/分类的既有语义。

## 2. 判定口径

题解放在 `source/_posts/daily/` 下，**目录位置就是判定依据**，唯一实现在
`scripts/lib/daily.js`（`isDailyPost`），脚本与模板共用（模板经 `is_daily` helper）。

第一版曾用 frontmatter `daily: true` 标记、文件不移动；后来改成目录，理由是
「是不是题解」和「文件放在哪」本来是同一件事，两处表达会漂移——新写一篇题解
忘了加字段，它就会悄悄回到首页「最新文章」。

文件进目录会带来一个副作用需要处理：Hexo 把 `_posts` 的子目录名算进 slug，
默认永久链接会多出一段 `/daily/`。URL 一变，`giscus`（按 pathname 映射）的
评论区就全部变空，所以 `scripts/daily-folder.js` 里注册了 `post_permalink`
filter 把该段抹掉，URL 与迁移前逐字节一致。

判定依据标题关键词（见清单文档「判定规则」），边界情况由人工拍板后写死一份名单。

## 3. frontmatter 契约

```yaml
# 开关不再是字段：放进 source/_posts/daily/ 即为题解
platform: LeetCode     # LeetCode | 牛客 | AcWing | CSP | AtCoder | Codeforces
difficulty: 中等        # 可选，简单/中等/困难，没有就留空
summary: 一句话说明这题考什么   # 可选，列表行右侧灰字
digest: 2026-10-30-论文阅读-...  # 可选，被哪篇归纳收录（反向链接用）
```

`platform` 缺失时从现有 tags 推导，再缺失显示「其他」。

## 4. /daily 页面

路由：`source/daily/index.md`（`layout: daily`）+ `themes/hingle/layout/daily.ejs`。
数据来源：`site.posts` 里 `is_daily(post)` 为真的文章，用 Hexo 解析好的 `post.date` 分组（不能按文件名/字符串排序，frontmatter 日期格式不统一）。

结构：

1. 顶部一行工具条：平台筛选 chips（全部 / LeetCode / 牛客 / AcWing / CSP / 其他）+ 关键词搜索框 + 计数「共 59 题」。
2. 正文按月份分组，月份标题右侧显示题数；行格式：
   `10-21  杨辉三角  牛客 · 简单 · 模拟` 行尾 `收录于《…》→`（有 digest 时）。
3. 交互：筛选与搜索纯客户端 JS（一次渲染全量 60–200 条），状态写入 `location.hash`，可直接分享 `#牛客`、`#搜索词`。
4. 移动端：月份分组可折叠，默认展开最近两个月。
5. 不做分页（条数可控），不做标签云。

## 5. 首页改造（四处）

1. `scripts/index-filter.js`：注册同名 `index` generator 覆盖 hexo-generator-index，逻辑照抄其实现，只在 `locals.posts` 上先 `filter(p => !p.daily)` 再分页（保留 sticky 排序、per_page、`page/%d/` 格式），保证过滤后每页仍是 10 条。
2. `themes/hingle/layout/_partial/home-sidebar.ejs`：「最新文章」6 条同一过滤规则。
3. 首页列表底部加固定入口卡：`📎 每日一题 · 共 59 题 → /daily/`。
4. `theme.menu` 增加「题解」指向 `/daily/`。

## 6. 边界与风险

- 过滤后总页数减少，旧的 `/page/N/` 可能 404：接受，启用主题 404 页兜底。
- 批量改 frontmatter 会触发 `updated` 变化（`updated_option` 默认 mtime）：不影响页面展示，可忽略。
- 题解页保留索引（不加 noindex），保留长尾流量。
- RSS 一期不动：feed limit 20，一周一两篇题解不会挤掉专题文章；若以后积压再议。
- 不做「专题归纳」内容：等正文写出来再回填 `digest`。

## 7. 实施步骤

1. 写迁移脚本 `scripts/migrate-daily.js`（一次性，跑完删或留档），按名单写入 `daily: true` + `platform`，对 54 篇缺 `description` 的补一行 summary 化的 description（可选，第二步做）。
2. 加 `scripts/index-filter.js`、`source/daily/index.md`、`themes/hingle/layout/daily.ejs`。
3. 改 `home-sidebar.ejs`、`_config.yml` 菜单。
4. 本地 `hexo clean && hexo g` 校验：首页前 10 条无题解、`/daily/` 有 59 条、`/daily/` 月份分组正确、筛选可用。
5. ~~删重复文件~~ 核查结论：带 ` copy` 后缀的 3 个文件（3070 题、WSL 网络配置、vscode 常用命令）**没有同名原件**，就是仅存的正文，删掉等于丢文章。它们只是 URL 里多了个 ` copy`；重命名会改变永久链接，得配 redirect 插件才安全，留作独立任务。

## 8. 实施记录（2026-11-21 已完成）

- 61 篇题解写入 `daily: true` + `platform`（`git diff` 61 文件 / 122 行，只加字段）。
- 新增 `scripts/index-filter.js`（覆盖 index generator）、`source/daily/index.md`、`themes/hingle/layout/daily.ejs`、`themes/hingle/layout/_partial/daily-entry.ejs`。
- 改 `home-sidebar.ejs`（最新文章过滤）、`index.ejs`（入口卡）、`_config.yml`（菜单加「题解」）、`hingle.css`（约 300 行新样式）。
- `hexo-pagination@^3.0.0` 提升为直接依赖（原来只是 hexo-generator-index 的传递依赖，靠 npm 扁平化偶然可用）。
- 构建校验：487 files / 5.9s；首页 10 条里 0 条题解；`/daily/` 61 条、13 个月份分组；分页 10 页（97 篇非题解）；内联脚本语法 OK、CSS 括号平衡。
- 遗留：56/61 篇题解没有 `description`（全站 13/158），`/daily` 列表行只对有的那 5 篇显示一句话摘要。

## 9. 迁移记录：frontmatter 标记 → 目录（2026-11-21 第二轮）

用户要求把题解物理收进 `source/_posts/daily/`。做法与验证：

1. `git mv` 迁移 61 篇（保留重命名历史），同时摘掉 frontmatter 里的 `daily: true`。
2. 新增 `scripts/daily-folder.js`：`post_permalink` filter 抹掉日期段后面的 `daily/`，
   并注册 `is_daily` helper；判定函数下沉到 `scripts/lib/daily.js`。
3. `scripts/index-filter.js`、`daily.ejs`、`daily-entry.ejs`、`home-sidebar.ejs`
   统一改用 `isDailyPost` / `is_daily`，不再读 frontmatter。
4. 迁移前后各用 Hexo API dump 一份 `source → path` 清单做逐条对比：
   **61/61 URL 完全一致**（0 差异），首页 10 条仍无题解，`/daily` 仍 61 条。
5. 图片不受影响：61 篇里 9 张图全部是外链，0 相对路径、0 `asset_img`。

已知注意点：

- 以后若把目录改名，或改 `_config.yml` 的 permalink 结构，要同步 `daily-folder.js` 的正则。
- `hexo new` 仍把新文章生成在 `_posts/` 根目录，写题解后手动移进 `daily/`。
- 仓库既有的 URL 现象（与本次无关）：`new_post_name: :title.md` 让文件名里的日期
  也进了 slug，所以真实链接是 `/2026/04/03/2026-04-03-标题/`，日期重复。
  修它等于全站换链接，需要 301，留作独立任务。
