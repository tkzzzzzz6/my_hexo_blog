'use strict';

const { parseVideoUrl } = require('./parser');

const defaults = {
    width: '100%',
    ratio: '56.25%', // 16:9 padding-bottom
    autoplay: false,
    highQuality: true,
    danmaku: false
};

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function buildIframe(src, options, platform, id) {
    const width = escapeHtml(options.width || defaults.width);
    const title = escapeHtml(`${platform} video ${id}`);
    return `
<div class="hexo-video-embed video-wrapper">
  <iframe
    src="${escapeHtml(src)}"
    width="${width}"
    title="${title}"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    scrolling="no"
    border="0"
    frameborder="no"
    framespacing="0"
    allowfullscreen="true"
  ></iframe>
</div>
`.trim();
}

function buildEmbed(rawUrl, customOptions) {
    const parsed = parseVideoUrl(rawUrl);
    if (!parsed) {
        return `<!-- hexo-video-embed: unsupported URL "${escapeHtml(rawUrl)}" -->`;
    }

    const options = Object.assign({}, defaults, customOptions || {});
    const { platform, id } = parsed;
    let src = '';

    switch (platform) {
        case 'bilibili':
            src = `https://player.bilibili.com/player.html?bvid=${id}&page=1` +
                  (options.highQuality ? '&high_quality=1' : '') +
                  (options.autoplay ? '&autoplay=1' : '&autoplay=0') +
                  (options.danmaku ? '&danmaku=1' : '&danmaku=0');
            break;
        case 'youtube':
            src = `https://www.youtube.com/embed/${id}` +
                  (options.autoplay ? '?autoplay=1' : '?autoplay=0') +
                  '&rel=0';
            break;
        case 'youku':
            src = `https://player.youku.com/embed/${id}`;
            break;
        case 'tencent':
            src = `https://v.qq.com/txp/iframe/player.html?vid=${id}`;
            break;
        case 'douyin':
            src = `https://www.douyin.com/video/${id}`;
            break;
        default:
            return `<!-- hexo-video-embed: unsupported platform "${escapeHtml(platform)}" -->`;
    }

    return buildIframe(src, options, platform, id);
}

module.exports = { buildEmbed, parseVideoUrl, defaults };
