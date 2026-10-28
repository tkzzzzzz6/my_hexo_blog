---
title: GitHub CLI 核心命令使用指南与速查手册
date: 2026-09-23
categories:
  - 开发工具
  - 速查
tags:
  - 开发效率
  - 终端工具

---

# GitHub CLI 核心命令使用指南与速查手册

> **工具简介**：`gh` 是 GitHub 官方提供的命令行工具，可直接在终端中完成仓库、Issue、PR、Actions 等操作。

---

## 📌 快速速查表（Cheat Sheet）

| 操作场景         | 核心命令                                     | 说明                    |
| :--------------- | :------------------------------------------- | :---------------------- |
| **登录认证**     | `gh auth login` / `gh auth status`           | 登录账号 / 查看登录状态 |
| **克隆仓库**     | `gh repo clone <owner>/<repo>`               | 快捷克隆仓库            |
| **新建仓库**     | `gh repo create <name> --public`             | 创建并推送到 GitHub     |
| **在网页打开**   | `gh repo view --web` / `gh pr view 12 --web` | 在浏览器中打开对应页面  |
| **创建 Issue**   | `gh issue create -t "标题" -b "内容"`        | 快速新建 Issue          |
| **创建 PR**      | `gh pr create --base main --title "..."`     | 发起 Pull Request       |
| **检出 PR 分支** | `gh pr checkout <pr_id>`                     | 本地直接切换到指定 PR   |
| **合并 PR**      | `gh pr merge <pr_id> --squash`               | 压缩并合并 PR           |
| **查看 CI 运行** | `gh run list` / `gh run view <id> --log`     | 查看 Actions 运行日志   |
| **查看帮助**     | `gh help` / `gh <子命令> --help`             | 查看详细帮助文档        |

---

### 一、安装与认证

#### 1. 安装方式

* **macOS (Homebrew)**：
  ```bash
  brew install gh
  ```
* **Windows (Scoop / Chocolatey)**：
  ```bash
  scoop install gh
  # 或
  choco install gh
  ```
* **Linux (Debian/Ubuntu/CentOS)**：
  ```bash
  # Ubuntu / Debian
  sudo apt update && sudo apt install gh
  ```

#### 2. 账号登录认证

```bash
# 1. 发起登录（根据提示选择 GitHub.com 还是 Enterprise，选择浏览器授权或 Token）
gh auth login

# 2. 检查当前登录状态与当前账号
gh auth status
```

---

### 二、仓库管理（`gh repo`）

#### 1. 克隆仓库
```bash
gh repo clone owner/repo
# 示例：克隆官方 gh 仓库
gh repo clone cli/cli
```

#### 2. 创建新仓库
```bash
gh repo create my-project \
  --public \
  --description "我的项目描述"
```
> **参数提示**：支持 `--public`（公开）、`--private`（私有）或 `--internal`（组织内部）。

#### 3. 查看仓库信息
```bash
# 在终端中查看当前或目标仓库信息
gh repo view [owner/]repo

# 在默认浏览器中直接打开该仓库主页
gh repo view [owner/]repo --web
```

#### 4. Fork 仓库并自动克隆到本地
```bash
gh repo fork owner/repo --clone=true
```

---

### 三、Issue 管理（`gh issue`）

#### 1. 查看 Issue 列表
```bash
# 查看所有 open 状态的 bug 标签 Issue
gh issue list --state open --label bug
```

#### 2. 新建 Issue
```bash
gh issue create \
  --title "Bug: 登录失败" \
  --body "在输入用户名后，界面无响应。\n重现步骤：..." \
  --label bug,help-wanted
```

#### 3. 查看指定 Issue 详情
```bash
# 浏览器打开
gh issue view 123 --web

# 以 JSON 格式输出（方便脚本或 jq 处理）
gh issue view 123 --json title,body,state
```

---

### 四、Pull Request 管理（`gh pr`）

#### 1. 列出 PR
```bash
# 筛选状态：open / closed / merged
gh pr list --state open
```

#### 2. 创建 PR
```bash
gh pr create \
  --base main \
  --head feature-branch \
  --title "添加登陆功能" \
  --body "实现了 OAuth2 登录流程"
```

#### 3. 切换与合并 PR
```bash
# 快速拉取并切换到该 PR 对应的分支进行本地测试
gh pr checkout 45

# 审查通过后合并 PR（可选 --merge、--squash、--rebase）
gh pr merge 45 --merge
# 或使用 squash 压缩提交合并
gh pr merge 45 --squash
```

---

### 五、Gist 与 Actions 管理

#### 1. Gist 代码片段管理
```bash
# 列出自己的所有 Gist
gh gist list

# 创建新的 Gist 片段
gh gist create file1.txt file2.txt \
  --public \
  --desc "一些常用代码片段"
```

#### 2. GitHub Actions 工作流监控
```bash
# 查看最近的工作流运行记录
gh run list

# 查看指定运行 ID 的详细构建日志
gh run view <run-id> --log

# 重新触发运行失败的 Workflow
gh run rerun <run-id>
```

---

### 六、进阶技巧：别名与插件

#### 1. 安装社区扩展（Extension）
例如安装非常实用的终端 TUI 仪表盘 `gh-dash`：
```bash
# 安装扩展
gh extension install dlvhdr/gh-dash

# 启动仪表盘
gh dash
```

#### 2. 自定义命令别名（Aliases）
编辑配置文件 `~/.config/gh/config.yml`，在其中添加：
```yaml
aliases:
  co: pr checkout
  pc: pr create
```
配置后可直接使用简写：
```bash
gh co 45  # 等同于 gh pr checkout 45
```

#### 3. 命令帮助查询
```bash
gh help                # 查看完整顶层命令列表
gh <category> --help   # 查看子命令详情（如 gh pr --help）
```

---

### 七、端到端工作流实战演示

从本地开发到 PR 合并的标准命令行全流程：

```bash
# 1. 克隆仓库并创建特性分支
gh repo clone myname/myrepo
cd myrepo
git checkout -b feature/login

# 2. 编码、本地提交并推送
git add .
git commit -m "feat: 实现登录模块"
git push --set-upstream origin feature/login

# 3. 命令行发起 Pull Request
gh pr create \
  --base main \
  --title "feat: 登录模块" \
  --body "实现了用户登录和会话管理功能"

# 4. Review 确认无误后直接在终端合并
gh pr merge --squash
```