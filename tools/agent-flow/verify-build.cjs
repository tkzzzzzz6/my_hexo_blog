'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const cheerio = require('cheerio');

function verifyPublishedRoutes(root, urls) {
  for (const url of urls) {
    const pathname = decodeURIComponent(new URL(url).pathname).replace(/^\/+/, '');
    const file = path.join(root, pathname, pathname.endsWith('/') || !pathname ? 'index.html' : '');
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) throw new Error(`Missing published route: ${url}`);
  }
}

function build() {
  for (const command of ['clean', 'generate']) {
    const result = spawnSync(process.execPath, ['node_modules/hexo/bin/hexo', command], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
    const log = (result.stdout || '') + (result.stderr || '');
    process.stdout.write(log);
    if (result.error || result.status !== 0 || /(?:^|\s)(?:ERROR|FATAL)(?:\s|$)/m.test(log)) throw new Error(`Hexo ${command} failed or logged an error`);
  }
  const config = require('js-yaml').load(fs.readFileSync('_config.yml', 'utf8'));
  const root = path.resolve(config.public_dir || 'public');
  const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  if (!home.includes('<html') || !home.includes(config.title)) throw new Error('Missing or invalid homepage');
  if (fs.readFileSync(path.join(root, 'CNAME'), 'utf8').trim() !== new URL(config.url).hostname) throw new Error('CNAME does not match the configured site');
  const publishedRoutes = require('./fixtures/published-routes.json');
  verifyPublishedRoutes(root, publishedRoutes);
  console.log(`Verified ${publishedRoutes.length} published routes.`);
  const files = [];
  function visit(dir) {
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, item.name);
      if (item.isDirectory()) visit(file);
      else if (item.name.endsWith('.html')) files.push(file);
    }
  }
  visit(root);
  if (files.length < 2) throw new Error('Empty site output');
  for (const file of files) {
    const $ = cheerio.load(fs.readFileSync(file, 'utf8'));
    if ($('[data-mjx-error], mjx-merror').length) throw new Error(`Math rendering error: ${file}`);
    if (!$('title').text().trim()) throw new Error(`Missing page title: ${file}`);
  }
  console.log(`Verified ${files.length} HTML pages, homepage, CNAME and MathJax output.`);
}
if (require.main === module) {
  try { build(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { build, verifyPublishedRoutes };
