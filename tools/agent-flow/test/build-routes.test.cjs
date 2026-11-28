'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const yaml = require('js-yaml');
const { verifyPublishedRoutes } = require('../verify-build.cjs');

for (const [file, job] of [['pr-checks', 'quality'], ['deploy', 'build-deploy']]) {
  test(`${file} keeps date-only post permalinks stable on a UTC runner`, () => {
    const workflow = yaml.load(fs.readFileSync(`.github/workflows/${file}.yml`, 'utf8'));
    const env = { ...process.env, TZ: 'UTC', ...workflow.env, ...workflow.jobs[job].env };
    const script = `
      const moment = require('moment-timezone');
      const { adjustDateForTimezone } = require('hexo/dist/plugins/processor/common');
      const permalink = require('hexo/dist/plugins/filter/post_permalink');
      const config = require('js-yaml').load(require('node:fs').readFileSync('_config.yml', 'utf8'));
      const routes = ['2026-11-26', '2026-11-08'].map(day => permalink.call({ config }, {
        title: 'Reading note', slug: 'reading-note', date: moment(adjustDateForTimezone(new Date(day), config.timezone)), categories: []
      }));
      console.log(JSON.stringify(routes));
    `;
    const routes = JSON.parse(execFileSync(process.execPath, ['-e', script], { env, encoding: 'utf8' }));
    assert.deepEqual(routes, ['2026/11/26/reading-note/', '2026/11/08/reading-note/']);
  });
}

test('published-route validation rejects shifted dates and resolves encoded paths', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'blog-route-check-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const url = 'https://tanke.asia/2026/11/26/%E7%AC%94%E8%AE%B0/';
  const shifted = path.join(root, '2026/11/25/笔记');
  fs.mkdirSync(shifted, { recursive: true });
  fs.writeFileSync(path.join(shifted, 'index.html'), '<html></html>');
  assert.throws(() => verifyPublishedRoutes(root, [url]), /Missing published route/);
  const expected = path.join(root, '2026/11/26/笔记');
  fs.mkdirSync(expected, { recursive: true });
  fs.writeFileSync(path.join(expected, 'index.html'), '<html></html>');
  assert.doesNotThrow(() => verifyPublishedRoutes(root, [url]));
});
