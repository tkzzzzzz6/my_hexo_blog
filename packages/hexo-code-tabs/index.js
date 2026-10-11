'use strict';

const fs = require('fs');
const path = require('path');
const { transform } = require('./lib/parse');

const DEFAULT_CONFIG = {
  // 总开关
  enable: true,
  // 少于这个数量的连续代码块不转成 tab
  min_blocks: 2,
  // 代码块没写语言时，tab 上显示的文字
  default_label: 'text',
  // 标签全相同的连续块是否也转成 tab（默认否，避免把连贯代码切碎）
  allow_duplicate_labels: false,
  // tab 容器的 class 前缀，默认 code-tabs
  class_prefix: 'code-tabs',
  // 是否自动注入 CSS / JS
  inject: true,
  // 覆盖内置资源，留空则使用 lib/assets 下的文件
  css_file: null,
  js_file: null,
  // 自定义 filter 优先级。
  # hexo 自带的 backtick_code_block 是 10，本插件必须排在它之后才能拿到高亮结果
  priority: 11
};

/**
 * 读取资源文件内容
 * @param {string} filePath
 * @returns {string}
 */
const readAsset = filePath => {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    hexo.log.warn(`[code-tabs] 读取资源文件失败，已跳过注入: ${filePath}`);
    return '';
  }
};

/**
 * @param {object} ctx hexo 实例
 */
module.exports = ctx => {
  const config = Object.assign({}, DEFAULT_CONFIG, ctx.config.code_tabs);

  if (!config.enable) {
    hexo.log.info('[code-tabs] 已在配置中关闭');
    return;
  }

  const css = config.css_file
    ? readAsset(path.resolve(ctx.base_dir, config.css_file))
    : readAsset(path.join(__dirname, 'lib/assets/style.css'));

  const js = config.js_file
    ? readAsset(path.resolve(ctx.base_dir, config.js_file))
    : readAsset(path.join(__dirname, 'lib/assets/script.js'));

  // 把 class 前缀替换成配置值
  const prefix = config.class_prefix || 'code-tabs';
  const applyPrefix = str => (prefix === 'code-tabs'
    ? str
    : str.replace(/code-tabs/g, prefix));

  // ---------------------------------------------------------------------
  // 1) 合并相邻代码块
  // ---------------------------------------------------------------------
  ctx.extend.filter.register('before_post_render', data => {
    // 单篇可用 front matter 的 code_tabs: false 关闭
    if (data.code_tabs === false) return;

    const { content } = transform(data.content, {
      minBlocks: config.min_blocks,
      defaultLabel: config.default_label,
      allowDuplicateLabels: config.allow_duplicate_labels,
      idPrefix: prefix
    });

    data.content = content;
  }, config.priority);

  // ---------------------------------------------------------------------
  // 2) 仅在出现 tab 的页面注入资源
  // ---------------------------------------------------------------------
  if (!config.inject) {
    hexo.log.info('[code-tabs] inject 已关闭，请自行在主题中引入样式与脚本');
    return;
  }

  ctx.extend.filter.register('_after_html_render', html => {
    const marker = `data-${prefix}`;
    if (!html.includes(marker)) return html;

    let result = html;

    if (css) {
      const tag = `<style>${applyPrefix(css)}</style>`;
      result = result.includes('</head>')
        ? result.replace('</head>', `${tag}</head>`)
        : tag + result;
    }

    if (js) {
      const tag = `<script>${applyPrefix(js)}</script>`;
      result = result.includes('</body>')
        ? result.replace(/<\/body>/, `${tag}</body>`)
        : result + tag;
    }

    return result;
  });
};