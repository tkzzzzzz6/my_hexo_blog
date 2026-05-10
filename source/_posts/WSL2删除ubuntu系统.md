---
title: WSL2 Docker释放磁盘空间
date: 2026-04-28
tags:
---


检查系统安装好的linux系统:

```
wsl -l -v
```

![1777691135174.png](https://tk-pichost-1325224430.cos.ap-chengdu.myqcloud.com/blog/1777691135174.png)

这里删除Ubuntu-20.04:

```
wsl --unregister Ubuntu-20.04
```
![1777691159180.png](https://tk-pichost-1325224430.cos.ap-chengdu.myqcloud.com/blog/1777691159180.png)

重新查看系统安装好的linux系统:

```
wsl -l -v
```

![1777691213998.png](https://tk-pichost-1325224430.cos.ap-chengdu.myqcloud.com/blog/1777691213998.png)