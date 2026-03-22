---
title: 2026-03-17-GitHub Pages 部署Hexo添加个性化域名的配置方法(腾讯云域名)
date: 2026-03-17
tags:
  - GitHub Pages
  - 网站
categories:
  - 工具配置
  - 进击的码农
description: 本文介绍如何为部署在 GitHub Pages 上的 Hexo 博客配置腾讯云个性化域名，包括购买域名、DNS 解析、CNAME 文件及 HTTPS 启用全流程。
---

## GitHub Pages 个性化域名配置

[Hexo](https://hexo.io/) 是一个快速、简洁且高效的静态博客框架，使用 Markdown 解析文章，在几秒内即可生成静态网页。

本文主要介绍如何为部署在 GitHub Pages 上的 Hexo 博客配置个性化域名，以腾讯云域名为例，完整演示从购买到生效的全流程。

### 购买域名

在部署完 Hexo 博客之后，默认的访问地址是 `https://<用户名>.github.io/<仓库名>/`。如果想要使用个性化域名访问博客，需要先购买一个域名。

这里以腾讯云域名为例，进入 [腾讯云域名](https://cloud.tencent.com/product/domain) 购买，一般价格在 5~50 元/年不等。`.asia` 后缀的域名只需 5 元，非常划算。

![购买域名](https://tk-pichost-1325224430.cos.ap-chengdu.myqcloud.com/blog/1773744762304.png)

### DNS 解析

进入 [域名解析控制台](https://console.cloud.tencent.com/domain/all-domain/all#)，选择`域名列表`，在对应域名一栏点击`解析`，进入 DNS 解析界面。

在 DNS 解析界面添加如下两条记录：

| 记录类型 | 主机记录 | 记录值               |
| -------- | -------- | -------------------- |
| CNAME    | @        | `<用户名>.github.io` |
| CNAME    | www      | `<用户名>.github.io` |

![DNS 解析配置](https://tk-pichost-1325224430.cos.ap-chengdu.myqcloud.com/blog/1773745054007.png)

这样无论用户输入 `www.tanke.asia` 还是直接输入 `tanke.asia`，都可以正确定位到网站。请将记录值替换为你自己的 GitHub Pages 地址。

### 添加 CNAME 文件

在 Hexo 本地目录的 `source/` 文件夹中，创建一个名为 `CNAME` 的无后缀文件，文件内容填写你的域名（不加 `https://`）：

```text
tanke.asia
```

然后重新生成并部署：

```bash
hexo clean
hexo d -g
```

### GitHub Pages 添加自定义域名

进入你的 GitHub 仓库，选择 `Settings` -> `Pages`，在 `Custom domain` 处填写你的自定义域名并保存。

![GitHub Pages 自定义域名设置](https://tk-pichost-1325224430.cos.ap-chengdu.myqcloud.com/blog/1773745187397.png)

完成以上步骤后，即可通过自定义域名访问你的博客。

### 启用 HTTPS

建议同时勾选 `Enforce HTTPS` 选项，GitHub Pages 会自动为你申请免费的 SSL 证书，启用后访问会更加安全，同时避免浏览器的"不安全"警告。

> 注意：DNS 解析生效需要几分钟到几小时不等，若自定义域名验证失败，等待一段时间后重试即可。


好啦,感谢大家的观看,欢迎访问我的博客：[tanke.asia](https://tanke.asia/)，也欢迎各位小伙伴交换友链～

### 参考

- [GitHub Pages 个性化域名配置](https://cloud.tencent.com/developer/article/2142661)
- [GitHub Pages 官方文档](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)

---

