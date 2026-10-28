/**
 * hexo-code-tabs 交互脚本
 *
 * 纯原生 JS，无依赖。用事件委托挂在 document 上，因此主题怎么渲染都无所谓，
 * 也支持页面内后续动态插入的 tab 组。
 */
(function () {
  'use strict';

  var TAB = '.code-tabs-tab';
  var GROUP = '.code-tabs';

  function tabsOf(group) {
    return group.querySelectorAll(TAB);
  }

  function panelsOf(group) {
    return group.querySelectorAll('.code-tabs-panel');
  }

  function toArray(nodeList) {
    return Array.prototype.slice.call(nodeList);
  }

  function select(group, index, moveFocus) {
    var tabs = tabsOf(group);
    var panels = panelsOf(group);
    if (!tabs.length || !tabs[index]) return;

    for (var i = 0; i < tabs.length; i++) {
      var on = i === index;
      tabs[i].classList.toggle('is-active', on);
      tabs[i].setAttribute('aria-selected', on ? 'true' : 'false');
      tabs[i].setAttribute('tabindex', on ? '0' : '-1');

      var panel = panels[i];
      if (!panel) continue;
      panel.classList.toggle('is-active', on);
      if (on) panel.removeAttribute('hidden');
      else panel.setAttribute('hidden', '');
    }

    if (moveFocus) tabs[index].focus();
  }

  function groupOf(node) {
    return node && node.closest ? node.closest(GROUP) : null;
  }

  function tabOf(node) {
    return node && node.closest ? node.closest(TAB) : null;
  }

  document.addEventListener('click', function (ev) {
    var tab = tabOf(ev.target);
    if (!tab) return;

    var group = groupOf(tab);
    if (!group) return;

    var index = toArray(tabsOf(group)).indexOf(tab);
    if (index < 0) return;

    select(group, index, false);
  });

  // 方向键 / Home / End 在 tab 间移动，符合 WAI-ARIA tablist 的交互约定
  document.addEventListener('keydown', function (ev) {
    if (ev.key !== 'ArrowRight' && ev.key !== 'ArrowLeft'
      && ev.key !== 'Home' && ev.key !== 'End') return;

    var tab = tabOf(ev.target);
    if (!tab) return;

    var group = groupOf(tab);
    if (!group) return;

    var tabs = toArray(tabsOf(group));
    var index = tabs.indexOf(tab);
    if (index < 0) return;

    var next;
    if (ev.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (ev.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    else if (ev.key === 'Home') next = 0;
    else next = tabs.length - 1;

    ev.preventDefault();
    select(group, next, true);
  });
})();