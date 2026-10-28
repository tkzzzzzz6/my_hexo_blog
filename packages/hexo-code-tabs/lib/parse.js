'use strict';

/**
 * 纯逻辑部分：识别相邻代码块、抽取 tab 标签、拼装 tab 结构。
 * 不依赖 hexo 全局对象，因此可以单独跑单元测试。
 */

/**
 * 匹配一个「已被 hexo 高亮好、等待还原」的代码块。
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

const rPre = /<pre[^>]*>[\s\S]*?<\/pre>/;
// highlight.js 会渲染成 <figure class="highlight lang-x"><figcaption>标题</figcaption>
const rFigcaption = /<figcaption[^>]*>([\s\S]*?)<\/figcaption>/;
// prismjs 会渲染成 <pre ...><div class="caption"><span>标题</span>
const rCaption = /<div class="caption">([\s\S]*?)<\/div>/;
const rLangAttr = /data-language="([^"]*)"/;
// highlight.js 关闭 wrap 时：<figure class="highlight lang-x">
const rLangClass = /class="[^"]*\blang-([a-z0-9+#._-]+)/i;
const rLanguageClass = /class="[^"]*\blanguage-([a-z0-9+#._-]+)/i;

const stripTags = str => String(str).replace(/<[^>]*>/g, '');

const decodeEntities = str => str
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
  .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
  .replace(/&amp;/g, '&');

const clean = str => decodeEntities(stripTags(str)).trim();

/**
 * 从一个已高亮的代码块 HTML 里取出 tab 标签文字。
 * 优先级：```lang 标题 > 语言名 > defaultLabel。
 */
const labelOf = (html, defaultLabel) => {
  const figcaption = html.match(rFigcaption);
  if (figcaption && clean(figcaption[1])) return clean(figcaption[1]);

  const caption = html.match(rCaption);
  if (caption && clean(caption[1])) return clean(caption[1]);

  const lang = html.match(rLangAttr);
  if (lang && lang[1]) return lang[1];

  const cls = html.match(rLangClass) || html.match(rLanguageClass);
  if (cls && cls[1]) return cls[1];

  return defaultLabel;
};

const escapeAttr = str => String(str)
  .replace(/&/g, '&amp;')
  .replace(/"/g, '&quot;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

/**
 * 把一组代码块包成 tab 结构。
 *
 * @param {string[]} blocks  已高亮的代码块 HTML
 * @param {object}   opts
 * @param {string}   opts.defaultLabel
 * @param {number}   opts.startIndex  id 计数器起始值，保证同一篇文章内 id 稳定
 * @param {string}   opts.idPrefix
 */
const buildTabs = (blocks, opts = {}) => {
  const { defaultLabel = 'text', idPrefix = 'code-tabs' } = opts;
  const groupId = `${idPrefix}-${opts.startIndex || 0}`;

  const buttons = blocks
    .map((html, i) => {
      const active = i === 0;
      return `<button type="button" role="tab"`
        + ` class="code-tabs-tab${active ? ' is-active' : ''}"`
        + ` id="${escapeAttr(`${groupId}-tab-${i}`)}"`
        + ` aria-controls="${escapeAttr(`${groupId}-panel-${i}`)}"`
        + ` aria-selected="${active ? 'true' : 'false'}"`
        + ` tabindex="${active ? '0' : '-1'}"`
        + `>${escapeAttr(labelOf(html, defaultLabel))}</button>`;
    })
    .join('');

  const panels = blocks
    .map((html, i) => {
      const active = i === 0;
      return `<div role="tabpanel"`
        + ` class="code-tabs-panel${active ? ' is-active' : ''}"`
        + `${active ? '' : ' hidden'}`
        + ` id="${escapeAttr(`${groupId}-panel-${i}`)}"`
        + ` aria-labelledby="${escapeAttr(`${groupId}-tab-${i}`)}"`
        + `>${html}</div>`;
    })
    .join('');

  return `<div class="code-tabs" data-code-tabs>`
    + `<div class="code-tabs-bar" role="tablist">${buttons}</div>`
    + `<div class="code-tabs-body">${panels}</div>`
    + `</div>`;
};

/**
 * 主入口：把内容里所有「相邻且值得合并」的代码块换成 tab 结构。
 *
 * @param {string} content
 * @param {object} options
 * @returns {{ content: string, groupCount: number }}
 */
const transform = (content, options = {}) => {
  const {
    minBlocks = 2,
    defaultLabel = 'text',
    // 标签全一样的连续块（例如三段 cpp）转成 tab 没有任何意义，
    // 反而会把本来连贯的代码切碎，默认保持原样。
    allowDuplicateLabels = false,
    idPrefix = 'code-tabs'
  } = options;

  let groupCount = 0;

  if (typeof content !== 'string' || !content.includes('hexoPostRenderCodeBlock')) {
    return { content, groupCount };
  }

  const result = content.replace(rBlockRun, run => {
    const blocks = run.match(rSingleBlock) || [];
    if (blocks.length < minBlocks) return run;
    if (!blocks.some(html => rPre.test(html))) return run;

    if (!allowDuplicateLabels) {
      const labels = blocks.map(html => labelOf(html, defaultLabel));
      if (new Set(labels).size < 2) return run;
    }

    groupCount++;
    return buildTabs(blocks, {
      defaultLabel,
      startIndex: groupCount - 1,
      idPrefix
    });
  });

  return { content: result, groupCount };
};

module.exports = {
  BLOCK_SOURCE,
  labelOf,
  buildTabs,
  transform,
  // 导出正则常量便于测试
  _rBlockRun: rBlockRun,
  _rSingleBlock: rSingleBlock
};