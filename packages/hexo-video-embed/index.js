'use strict';

const { buildEmbed } = require('./lib/embed');

/**
 * Hexo video embed plugin.
 *
 * Usage:
 *   {% video URL %}
 *   {% video URL width:80% autoplay:true danmaku:true %}
 *
 * Or in templates/helpers:
 *   <%- video_embed(URL, { autoplay: true }) %>
 */

function register(hexo) {
    // tag: {% video ... %}
    hexo.extend.tag.register('video', function (args) {
        const url = args[0];
        if (!url) {
            return '<!-- hexo-video-embed: missing video URL -->';
        }

        const options = {};
        for (let i = 1; i < args.length; i++) {
            const part = args[i];
            const idx = part.indexOf(':');
            if (idx > 0) {
                const key = part.slice(0, idx).trim();
                let value = part.slice(idx + 1).trim();
                if (value === 'true') value = true;
                else if (value === 'false') value = false;
                options[key] = value;
            }
        }

        return buildEmbed(url, options);
    }, { ends: false });

    // helper: <%- video_embed(URL, options) %>
    hexo.extend.helper.register('video_embed', function (url, options) {
        if (!url) return '';
        return buildEmbed(url, options || {});
    });
}

// Hexo loads plugins by wrapping the script in a wrapper function and passing
// `hexo` as an argument. It does NOT automatically invoke the exported function,
// so we register everything immediately when the script runs (like hexo-wordcount).
if (typeof hexo !== 'undefined') {
    register(hexo);
}

// Also export a function so the plugin can be used as a module in tests or
// manually invoked by other loaders.
module.exports = register;
