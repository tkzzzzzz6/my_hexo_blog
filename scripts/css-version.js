/* global hexo */
/**
 * 给主题 CSS 注入版本查询参数（绕开模板变量，直接改写最终 HTML）。
 *
 * 背景
 * ----
 * 浏览器按 URL 缓存 /static/hingle.css，而 hexo 每次构建都把文件写到同一个
 * 路径，URL 不变。于是「改完主题样式刷新页面，样式却没变」——浏览器命中了
 * 旧缓存。这类问题极难自查，因为看源码是新文件，看页面是旧效果。
 *
 * 做法
 * ----
 * 在 HTML 渲染完成后，用 hingle.css 的修改时间当版本号，改写 <link> 的 href。
 * 内容不变则版本号不变，不会造成无谓的重新下载；一旦动了样式，时间戳变化，
 * URL 随之变化，浏览器必定重新拉取。
 *
 * 为什么不用模板变量
 * ----------------
 * 在 head.ejs 里读 theme.css_version 试过，模板作用域里的 theme 与 hexo.theme
 * 不是同一个对象引用，赋值不生效。这里直接对最终 HTML 做正则替换，行为确定。
 */

'use strict';

const fs = require('fs');
const path = require('path');

const TARGETS = ['kico.css', 'hingle.css'];

const cssVersion = () => {
  try {
    const target = path.join(hexo.theme_dir, 'source', 'static', 'hingle.css');
    return '?v=' + fs.statSync(target).mtime.getTime();
  } catch (err) {
    hexo.log.warn(`[css-version] 读取主题 CSS 失败，不加版本号: ${err.message}`);
    return '';
  }
};

hexo.extend.filter.register('_after_html_render', html => {
  if (!html.includes('href="/static/')) return html;

  const ver = cssVersion();
  if (!ver) return html;

  return html.replace(
    /(href=["']\/static\/(?:kico|hingle)\.css)(["'])/g,
    `$1${ver}$2`
  );
});