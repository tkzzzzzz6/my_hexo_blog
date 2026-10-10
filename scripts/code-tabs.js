/* global hexo */
/**
 * 多语言代码块 Tab 切换
 *
 * 把一篇 post 中「连续写、彼此只隔一个空行」的多个围栏代码块合并成一组 tab，
 * 默认选中第一个，其余隐藏。语言名（或 ```lang 标题 里的标题）作为 tab 标签。
 *
 * 实现思路参考 hexo-tabbed-code-block，但有两点不同：
 *
 *   1. 不重复实现语法高亮。本 filter 注册在 hexo 自带的 backtick_code_block
 *      之后（priority 11 > 10），此时每个围栏块已经被高亮成了
 *      <hexoPostRenderCodeBlock><pre class="language-x" data-language="x">…</pre></hexoPostRenderCodeBlock>，
 *      我们只负责把这些相邻块套一层 tab 容器。因此 highlight / prismjs /
 *      line_number 等所有既有配置自动保持一致，无需同步维护两份高亮逻辑。
 *
 *   2. 不依赖 jQuery。原插件往每个页面注入 `$(document).ready(...)`，
 *      而本博客用的 hinge 主题并不引入 jQuery，注入后一点 tab 就报
 *      ReferenceError。这里改为原生 JS + 事件委托。
 *
 * CSS 同样只用主题已有的 CSS 变量（--blue / --border / --radius 等），
 * 因此夜间模式自动跟随，不需要为深浅色各写一套。
 *
 * ---------------------------------------------------------------------------
 * 用法
 * ---------------------------------------------------------------------------
 * 直接连续写多个代码块，中间不夹其他内容即可：
 *
 *     ```cpp
 *     cout << "Hello";
 *     ```
 *
 *     ```python
 *     print("Hello")
 *     ```
 *
 * 想给 tab 起中文/自定义名字，在语言后加空格再写标题：
 *
 *     ```bash Debian
 *     apt install pcre2-utils
 *     ```
 *
 *     ```bash CentOS
 *     yum install pcre
 *     ```
 *
 * ---------------------------------------------------------------------------
 * 配置（_config.yml）
 * ---------------------------------------------------------------------------
 *
 *     code_tabs:
 *       enable: true        # 全局开关；单篇可用 front matter 的 code_tabs: false 关闭
 *       merge: true         # 是否自动合并相邻代码块；false 则必须用 {% code_tabs %} 手写分组
 *       min_blocks: 2       # 少于这个数量的连续块不转成 tab，保持原样
 *       default_label: text # 代码块没写语言时，tab 上显示的文字
 *
 */

'use strict';

const { filter } = hexo.extend;

const config = Object.assign(
  {
    enable: true,
    merge: true,
    min_blocks: 2,
    default_label: 'text'
  },
  hexo.config.code_tabs
);

// hexo 自带的 backtick_code_block 注册在 priority 10，
// 我们排在其后，拿到的是已经高亮好的 HTML。
const PRIORITY = 11;

/**
 * 匹配一个代码块。
 *
 * 这里必须用「带前瞻的贪婪匹配」而不是 `[\s\S]*?`：后者虽然惰性，但在整串
 * 匹配失败时仍会回溯扩张，于是第一个代码块会一路吞掉中间的标题和后续代码块，
 * 导致本该分开的两组被误判成相邻。tempered greedy token 不允许跨过标签边界，
 * 才是这里真正需要的语义。
 */
const BLOCK_SOURCE =
  '<hexoPostRenderCodeBlock>(?:(?!<\\/?hexoPostRenderCodeBlock>)[\\s\\S])*</hexoPostRenderCodeBlock>';

// 一串「只被空白字符隔开」的代码块。组与组之间只要有别的内容就不会被匹配。
const rBlockRun = new RegExp(
  `(${BLOCK_SOURCE})(?:\\s*(${BLOCK_SOURCE}))+`,
  'g'
);

const rSingleBlock = new RegExp(BLOCK_SOURCE, 'g');

const rCodeBlock = /<pre[^>]*>[\s\S]*?<\/pre>/;
const rCaption = /<div class="caption">\s*<span>([\s\S]*?)<\/span>/;
const rLangAttr = /data-language="([^"]*)"/;

const stripTags = str => str.replace(/<[^>]*>/g, '');

const decodeEntities = str => str
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/&amp;/g, '&');

/**
 * 从一个已高亮的代码块 HTML 里取出 tab 标签文字。
 * 优先级：```lang 标题 的标题 > 语言名 > default_label。
 */
const labelOf = html => {
  const caption = html.match(rCaption);
  if (caption) return decodeEntities(stripTags(caption[1])).trim();

  // 没写语言时 hexo 不会输出 data-language，这种情况落到 default_label
  const lang = html.match(rLangAttr);
  if (lang && lang[1]) return lang[1];

  return config.default_label;
};

/**
 * 把连续代码块包成 tab 结构。
 * 每篇文章单独从 0 计数，保证生成的 id 稳定、可复现。
 */
let seq = 0;

const buildTabs = blocks => {
  const groupId = `code-tabs-${seq++}`;

  const buttons = blocks
    .map((html, i) => {
      const active = i === 0 ? ' is-active' : '';
      const selected = i === 0 ? 'true' : 'false';
      const tabId = `${groupId}-tab-${i}`;
      const panelId = `${groupId}-panel-${i}`;

      return `<button type="button" role="tab" class="code-tabs-tab${active}"`
        + ` id="${tabId}" aria-controls="${panelId}"`
        + ` aria-selected="${selected}" tabindex="${i === 0 ? '0' : '-1'}">`
        + `${labelOf(html)}</button>`;
    })
    .join('');

  const panels = blocks
    .map((html, i) => {
      const active = i === 0 ? ' is-active' : '';
      const hidden = i === 0 ? '' : ' hidden';
      const tabId = `${groupId}-tab-${i}`;
      const panelId = `${groupId}-panel-${i}`;

      return `<div role="tabpanel" class="code-tabs-panel${active}"${hidden}`
        + ` id="${panelId}" aria-labelledby="${tabId}">${html}</div>`;
    })
    .join('');

  return `<div class="code-tabs" data-code-tabs>`
    + `<div class="code-tabs-bar" role="tablist">${buttons}</div>`
    + `<div class="code-tabs-body">${panels}</div>`
    + `</div>`;
};

filter.register('before_post_render', data => {
  if (!config.enable) return;
  if (data.code_tabs === false) return;
  if (!data.content || !data.content.includes('hexoPostRenderCodeBlock')) return;

  // 页面级资源交给下面的 _after_html_render 统一注入
  seq = 0;

  data.content = data.content.replace(rBlockRun, run => {
    const blocks = run.match(rSingleBlock) || [];
    if (blocks.length < config.min_blocks) return run;
    if (!blocks.some(html => rCodeBlock.test(html))) return run;

    // 标签全一样的连续块（比如三段 cpp）转成 tab 没有任何意义，
    // 反而会把本来连贯的代码切碎，因此这种情况保持原样。
    const labels = blocks.map(labelOf);
    if (new Set(labels).size < 2) return run;

    return buildTabs(blocks);
  });
}, PRIORITY);

const CSS = `
.code-tabs{
    margin: 1em 0;
}
.code-tabs-bar{
    display: flex;
    flex-wrap: wrap;
    border: 1px solid #ddd;
    border-color: var(--border);
    border-bottom: 0;
    border-radius: .25em .25em 0 0;
    border-radius: var(--radius) var(--radius) 0 0;
    background: #fff;
    background: var(--light-background);
    overflow: hidden;
}
.code-tabs-tab{
    margin: 0;
    padding: .45em 1em;
    color: inherit;
    font: inherit;
    font-size: .9em;
    cursor: pointer;
    border: 0;
    border-right: 1px solid #ddd;
    border-right-color: var(--border);
    background: transparent;
    transition: background .2s, color .2s;
}
.code-tabs-tab:last-child{
    border-right: 0;
}
.code-tabs-tab:hover{
    background: rgba(111, 159, 199, .12);
}
.code-tabs-tab.is-active{
    color: #fff;
    background: #6f9fc7;
    background: var(--blue);
}
.code-tabs-tab:focus-visible{
    outline: 2px solid rgba(111, 159, 199, .5);
    outline-offset: -2px;
}
.code-tabs-panel[hidden]{
    display: none;
}
.code-tabs-body > .code-tabs-panel > .code-copy-wrap{
    margin: 0;
}
.code-tabs-body pre{
    margin: 0;
    border-radius: 0 0 .25em .25em;
    border-radius: 0 0 var(--radius) var(--radius);
}
@media screen and (max-width: 599px){
    .code-tabs-tab{
        font-size: .82em;
        padding: .45em .7em;
    }
}
`;

const JS = `
(function () {
  var select = function (group, index, focus) {
    var tabs = group.querySelectorAll('.code-tabs-tab');
    var panels = group.querySelectorAll('.code-tabs-panel');
    if (!tabs.length || !tabs[index]) return;

    for (var i = 0; i < tabs.length; i++) {
      var on = i === index;
      tabs[i].classList.toggle('is-active', on);
      tabs[i].setAttribute('aria-selected', on ? 'true' : 'false');
      tabs[i].setAttribute('tabindex', on ? '0' : '-1');
      if (panels[i]) {
        panels[i].classList.toggle('is-active', on);
        if (on) panels[i].removeAttribute('hidden');
        else panels[i].setAttribute('hidden', '');
      }
    }

    if (focus) tabs[index].focus();
  };

  document.addEventListener('click', function (ev) {
    var tab = ev.target.closest && ev.target.closest('.code-tabs-tab');
    if (!tab) return;

    var group = tab.closest('.code-tabs');
    if (!group) return;

    var tabs = Array.prototype.slice.call(group.querySelectorAll('.code-tabs-tab'));
    select(group, tabs.indexOf(tab), false);
  });

  // 左右方向键在 tab 之间移动，符合 WAI-ARIA 的 tablist 交互约定
  document.addEventListener('keydown', function (ev) {
    if (ev.key !== 'ArrowRight' && ev.key !== 'ArrowLeft') return;

    var tab = ev.target.closest && ev.target.closest('.code-tabs-tab');
    if (!tab) return;

    var group = tab.closest('.code-tabs');
    if (!group) return;

    var tabs = Array.prototype.slice.call(group.querySelectorAll('.code-tabs-tab'));
    var index = tabs.indexOf(tab);
    if (index < 0) return;

    var next = ev.key === 'ArrowRight' ? index + 1 : index - 1;
    if (next < 0) next = tabs.length - 1;
    if (next >= tabs.length) next = 0;

    ev.preventDefault();
    select(group, next, true);
  });
})();
`;

filter.register('_after_html_render', html => {
  // 没有 tab 的页面一律不注入，保持首页、归档页的体积不变
  if (!html.includes('data-code-tabs')) return html;

  html = html.replace('</head>', `<style>${CSS}</style></head>`);

  return html.replace(/<\/body>/, `<script>${JS}</script></body>`);
});