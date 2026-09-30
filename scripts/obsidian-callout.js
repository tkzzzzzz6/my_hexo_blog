'use strict';

const fs = require('fs');
const path = require('path');
const transformCallouts = require('../node_modules/hexo-obsidian-callout/lib/transform');

function buildAssetUrl(root, assetPath) {
  const normalizedRoot = root ? (root.endsWith('/') ? root : `${root}/`) : '/';
  const sanitizedPath = assetPath.replace(/^\//, '');
  return `${normalizedRoot}${sanitizedPath}`.replace(/\\/g, '/');
}

const cssPath = 'css/hexo-obsidian-callout.css';
const cssSource = path.join(
  __dirname,
  '..',
  'node_modules',
  'hexo-obsidian-callout',
  'styles',
  'callout.css'
);

hexo.extend.filter.register('after_post_render', function transformPostContent(data) {
  if (!data || !data.content) return data;
  data.content = transformCallouts(data.content);
  return data;
}, 5);

hexo.extend.generator.register('local-obsidian-callout-css', () => ({
  path: cssPath,
  data: fs.readFileSync(cssSource, 'utf8')
}));

hexo.extend.filter.register('after_render:html', function injectCssLink(html) {
  if (typeof html !== 'string') return html;

  const href = buildAssetUrl(hexo.config.root || '/', cssPath);
  if (html.includes(href)) return html;

  const linkTag = `\n<link rel="stylesheet" href="${href}">`;
  if (html.includes('</head>')) {
    return html.replace('</head>', `${linkTag}\n</head>`);
  }

  return `${linkTag}\n${html}`;
});