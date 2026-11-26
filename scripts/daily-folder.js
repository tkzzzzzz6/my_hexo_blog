/* global hexo */
/**
 * 题解目录约定：`source/_posts/daily/` 下的一律算题解。
 *
 * 为什么是目录而不是 frontmatter 字段
 * ----------------------------------
 * 早期版本用 `daily: true` 标记，但「文章是不是题解」和「文章放在哪」本来是
 * 同一件事，用两个地方表达就容易漂移：新写一篇题解忘了加字段，它就会悄悄
 * 出现在首页「最新文章」里。改成目录后，放进 daily/ 就自动生效，漏标不可能发生。
 *
 * URL 兼容层（关键）
 * ----------------
 * Hexo 会把 `_posts` 下的子目录名算进 slug：`_posts/daily/foo.md` 的默认
 * 永久链接会变成 `/年/月/日/daily/foo/`，多出一段 `daily/`。这不是小事：
 * 61 篇题解的链接会全部改变，而 giscus 评论是按 pathname 映射 discussion 的，
 * 链接一变，这 61 篇的评论区就全部变空。
 *
 * 所以这里注册一个 `post_permalink` filter，把日期段后面的 `daily/` 抹掉，
 * 让 URL 和迁移前逐字节一致。filter 在默认 post_permalink 之后执行，
 * 拿到的是已经算好的路径字符串。
 *
 * 副作用提醒：以后若把目录改名，或者改 permalink 结构，记得同步第 27 行的正则。
 */

'use strict';

const { DAILY_DIR, isDailyPost } = require('./lib/daily');

hexo.extend.filter.register('post_permalink', function (permalinkPath) {
  if (typeof permalinkPath !== 'string') return permalinkPath;
  return permalinkPath.replace(/^\/?(\d{4}\/\d{2}\/\d{2})\/daily\//, '$1/');
});

// 模板里统一用 is_daily(post)，避免每个模板各写一遍字符串判断
hexo.extend.helper.register('is_daily', isDailyPost);

module.exports = { DAILY_DIR };
