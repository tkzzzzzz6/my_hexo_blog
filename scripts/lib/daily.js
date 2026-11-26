/**
 * 「这篇文章是不是题解」的唯一判定处。
 *
 * 纯函数、无副作用，可以被脚本（scripts/*.js）和主题模板（经 is_daily helper）
 * 共同使用。改判定口径只改这里。
 */

'use strict';

const DAILY_DIR = '_posts/daily/';

/**
 * @param {{source?: string}} post Hexo 的 post 对象
 * @returns {boolean}
 */
function isDailyPost(post) {
  if (!post || typeof post.source !== 'string') return false;
  return post.source.replace(/\\/g, '/').startsWith(DAILY_DIR);
}

module.exports = { DAILY_DIR, isDailyPost };
