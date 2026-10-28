# hexo-video-embed

A Hexo plugin to embed videos from multiple platforms in your posts or pages.

## Supported Platforms

- Bilibili
- YouTube
- Youku
- Tencent Video
- Douyin

## Install

```bash
npm install hexo-video-embed
```

## Usage

### Tag (in Markdown)

```markdown
{% video https://www.bilibili.com/video/BV1wGnF6oEkd/ %}
```

With options:

```markdown
{% video https://www.bilibili.com/video/BV1wGnF6oEkd/ autoplay:true danmaku:true %}
```

### Helper (in templates)

```ejs
<%- video_embed(page.video, { autoplay: false, danmaku: false }) %>
```

## Options

| Option       | Default | Description                          |
|--------------|---------|--------------------------------------|
| width        | 100%    | iframe width                         |
| ratio        | 56.25%  | aspect ratio padding-bottom          |
| autoplay     | false   | auto-play (platform dependent)       |
| highQuality  | true    | Bilibili high quality                |
| danmaku      | false   | Bilibili danmaku                     |

## License

MIT
