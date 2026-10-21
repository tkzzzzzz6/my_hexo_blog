'use strict';

/**
 * Parse a video URL and return { platform, id, meta }.
 * Supported platforms: bilibili, youtube, youku, tencent, douyin.
 */
function parseVideoUrl(rawUrl) {
    const url = rawUrl.trim();

    // Bilibili: BVxxx  or  avxxx
    const bvidMatch = url.match(/\/?(BV[0-9A-Za-z]+)/);
    if (bvidMatch) {
        return { platform: 'bilibili', id: bvidMatch[1], meta: {} };
    }
    const biliAvMatch = url.match(/[?&]aid=(\d+)/);
    if (biliAvMatch) {
        return { platform: 'bilibili', id: 'av' + biliAvMatch[1], meta: {} };
    }

    // YouTube: watch?v=xxx  or  youtu.be/xxx  or  shorts/xxx
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) {
        return { platform: 'youtube', id: ytMatch[1], meta: {} };
    }

    // Youku
    const youkuMatch = url.match(/youku\.com\/v_show\/id_([a-zA-Z0-9=]+)/);
    if (youkuMatch) {
        return { platform: 'youku', id: youkuMatch[1], meta: {} };
    }

    // Tencent Video: x/cover/.../xxx.html  or  page/...
    const tencentMatch = url.match(/v\.qq\.com\/.*?\/(?:[a-z0-9]+\/)?([a-zA-Z0-9]{11,})/);
    if (tencentMatch) {
        return { platform: 'tencent', id: tencentMatch[1], meta: {} };
    }

    // Douyin
    const douyinMatch = url.match(/douyin\.com\/video\/(\d+)/);
    if (douyinMatch) {
        return { platform: 'douyin', id: douyinMatch[1], meta: {} };
    }

    return null;
}

module.exports = { parseVideoUrl };
