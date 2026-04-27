---
title: 因服务器网络访问问题从 GitHub 平滑迁移至 Gitee 等国内平台的方法
categories:
  - 进击的码农
date: 2026-03-15
tags:
  - Git
  - 环境配置
---


在日常开发中，我们经常需要将代码仓库从 GitHub 迁移到 Gitee，以获得更快的访问速度。本文将教你如何优雅地修改远程源，并理清 `origin` 与 `upstream` 的关系。

## 1. 查看当前配置

首先，在终端（Ubuntu/Windows/Mac 通用）进入项目目录，查看现有的远程仓库：

```bash
git remote -v
```

你可能会看到类似下面的输出：

- `origin`：指向你自己的仓库（GitHub）。
- `upstream`：指向原作者的仓库（如果你是 Fork 的项目）。

## 2. 修改远程仓库地址

核心命令是重置 `origin`。直接将你的主要推送目标 `origin` 修改为 Gitee 地址：

```bash
git remote set-url origin https://gitee.com/你的用户名/你的仓库名称.git
```

## 3. upstream 和 origin？

如果你的仓库是从别人那里 Fork 来的，除了 `origin` 你还会看到一个 `upstream` 源。
- `origin`：你自己的仓库，负责推送和拉取。
- `upstream`：原作者的仓库，负责同步更新。

如图所示,在 vscode 中初次执行 `push` 命令的时候,会要求选择 push to 的仓库: 

![1773543044252.png](https://tk-pichost-1325224430.cos.ap-chengdu.myqcloud.com/blog/1773543044252.png)


## 4. 验证与首次推送

修改完成后，执行一次带参数的推送，重新建立本地分支与 Gitee 远程分支的绑定关系：

```bash
# 检查地址是否已变更为 Gitee
git remote -v

# 推送并关联分支（假设分支名为 main）
git push -u origin main
```

> 小贴士：`-u` 参数只需执行一次。之后直接点击 VS Code 的同步按钮或输入 `git push` 即可。

## 5. 常见问题：推送被拒绝（Rejected）？

如果 Gitee 仓库不是空的（例如自带 README），直接推送会报错。

解决方案：强制合并一次远程历史。

```bash
# 拉取并合并不相关的历史记录
git pull origin main --allow-unrelated-histories

# 再次推送
git push origin main
```

## 总结：跨平台通用逻辑

无论是在 Windows（PowerShell）、Ubuntu（Terminal）还是 macOS，Git 的底层命令完全一致。

- 想换地址？用 `set-url`。
- 想断绝关系？用 `remove`。
- 想保持同步？保留 `upstream`。