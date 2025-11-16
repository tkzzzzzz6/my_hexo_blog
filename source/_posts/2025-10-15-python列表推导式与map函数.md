---
title: 2025-10-15-浏览器批量下载文件的方法
date: 2025-10-15
tags: 
    问题解决
---

# 2025-10-15-浏览器批量下载文件的方法

> 参考资料
> [wget 的安装与使用（Windows）](https://blog.csdn.net/m0_45447650/article/details/125786723)
> [我怎样才能批量下载一个网站链接里的所有文件？](https://www.reddit.com/r/techsupport/comments/1dsuawu/how_can_i_massdownload_all_the_files_in_the_links/?tl=zh-hans)

今天在下载课资料时,遇到了单个页面有多个文件资源链接需要批量下载的问题,通过查找资料,总结了以下几种方法:

## 方法一: 使用浏览器扩展插件
- 浏览器插件:Instant Data Scraper:可以自动从任何网页中提取数据并导出为 Excel 或 CSV 文件。[下载链接](https://chromewebstore.google.com/detail/instant-data-scraper/ofaokhiedipichpaobibbnahnkdoiiah?hl=zh-CN)

- 下载软件:IDM或者JDownloader 2



这里有两种思路,一种是将csv文件中的链接列全部复制,通过下载软件的通过剪贴板批量下载的功能进行批量下载,另一种是将对应的链接转化为csv格式的文件,再使用ai编写对应的下载的脚本

这里我只介绍第一种思路下载软件通过剪贴板批量下载的思路
1. 使用Instant Data Scraper插件,提取网页中的链接,并选中和复制链接相关列
![1760523559939.png](http://t2z9ig7uo.hn-bkt.clouddn.com/blog/1760523559939.png)

2. 打开下载软件,在设置中找到“通过剪贴板监控”或类似选项,并启用它

- IDM:任务->从剪贴板中添加批量下载
  ![1760525166362.png](http://t2z9ig7uo.hn-bkt.clouddn.com/blog/1760525166362.png)

- JDownloader 2:链接抓取器->ctrl+v 粘贴剪贴板内容
![1760523940222.png](http://t2z9ig7uo.hn-bkt.clouddn.com/blog/1760523940222.png)

右键开始所有下载

![1760524005163.png](http://t2z9ig7uo.hn-bkt.clouddn.com/blog/1760524005163.png)



## 方法二:使用wget -r 命令批量下载

需要网站有robots.txt文件,且允许爬取,深度学习的数据集相关网站一般都允许爬取

示例:
```sh
wget -r -c https://cdn.nohesi.gg/cars/
```

-c 选项表示断点续传
![1760522349155.png](http://t2z9ig7uo.hn-bkt.clouddn.com/blog/1760522349155.png)

如果你有更好的方法,欢迎在评论区留言分享