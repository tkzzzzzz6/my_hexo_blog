'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ejs = require('ejs');
const cheerio = require('cheerio');

function render(side) {
  const posts = Array.from({ length: 9 }, (_, i) => ({ title: `Article ${i}`, path: `post-${i}/`, date: i, daily: i === 8 }));
  const collection = values => ({
    filter: predicate => collection(values.filter(predicate)),
    sort: () => collection(values.slice().sort((a, b) => b.date - a.date)),
    limit: count => values.slice(0, count)
  });
  return cheerio.load(ejs.render(fs.readFileSync('themes/hingle/layout/_partial/home-sidebar.ejs', 'utf8'), {
    side, site: { posts: collection(posts) }, is_daily: post => post.daily, url_for: value => '/' + value,
    list_archives: () => '<ul>' + Array.from({ length: 15 }, (_, i) => `<li>Month ${i}</li>`).join('') + '</ul>',
    tagcloud: () => '<a href="/tags/example/">Example</a>'
  }));
}

test('left sidebar groups six non-daily recent links and the Live2D stage in one box', () => {
  const $ = render('left');
  const box = $('.home-side-left > .home-side-box');
  assert.equal(box.length, 1);
  assert.equal(box.find('.side-recent .post-list-link').length, 6);
  assert.equal(box.find('.side-recent .post-list-link').first().attr('href'), '/post-7/');
  assert.equal(box.find('.side-live2d-stage').length, 1);
  assert.equal($('.home-side-right').length, 0);
});

test('right sidebar groups timeline and tags while retaining expandable older months', () => {
  const $ = render('right');
  const box = $('.home-side-right > .home-side-box');
  assert.equal(box.length, 1);
  assert.equal(box.find('.side-timeline > .archive-list > li').length, 12);
  assert.equal(box.find('.side-timeline-rest[hidden] li').length, 3);
  assert.equal(box.find('.side-more').attr('aria-expanded'), 'false');
  assert.equal(box.find('.side-tags a').attr('href'), '/tags/example/');
  assert.equal($('.home-side-left').length, 0);
});
