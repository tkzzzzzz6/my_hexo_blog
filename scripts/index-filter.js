/* global hexo */
/**
 * 首页分页生成器：在 hexo-generator-index 的基础上，把题解文章过滤掉。
 *
 * 背景
 * ----
 * 题解（放在 source/_posts/daily/ 下的文章）数量多、更新快，会把首页「最新文章」
 * 挤成一列流水账，读者找不到真正想看的归纳类长文。这里用同名 generator 覆盖
 * 内置的 index generator：先过滤，再分页，所以每页仍然是满的 10 条。
 *
 * 为什么是覆盖而不是改主题模板
 * --------------------------
 * 分页发生在 generator 阶段，模板只能拿到已经分好页的 page.posts，在模板里
 * 过滤会导致某些页不满、甚至整页空白。必须在分页之前动手。
 *
 * 注意
 * ----
 * 逻辑与 node_modules/hexo-generator-index/lib/generator.js 保持一致，
 * 升级插件时记得同步（sticky 排序、per_page、format）。
 */

'use strict';

const pagination = require('hexo-pagination');
const { isDailyPost } = require('./lib/daily');

hexo.extend.generator.register('index', function (locals) {
  const config = this.config;
  const indexConfig = config.index_generator || {};
  const perPage = indexConfig.per_page || 10;

  // 题解不参与首页分页；其余文章按 index_generator 的排序规则排
  const posts = locals.posts.sort(indexConfig.order_by || '-date').filter(post => !isDailyPost(post));

  // 置顶逻辑与原插件一致
  posts.data.sort((a, b) => (b.sticky || 0) - (a.sticky || 0));

  return pagination(indexConfig.path || '', posts, {
    perPage,
    layout: ['index', 'archive'],
    format: (config.pagination_dir || 'page') + '/%d/',
    data: {
      __index: true
    }
  });
});
