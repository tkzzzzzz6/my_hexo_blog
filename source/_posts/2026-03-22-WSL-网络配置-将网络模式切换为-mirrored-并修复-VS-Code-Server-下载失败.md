---
title: 2026-03-22-WSL-网络配置-将网络模式切换为-mirrored-并修复-VS-Code-Server-下载失败
date: 2026-03-22
tags:
  - WSL
  - Linux
  - Windows
  - 网络
  - VS Code
  - 代理
---

# 背景与问题

最近在 WSL 中执行 `code .` 打开项目时，VS Code Server 安装失败，日志如下：

```text
Updating VS Code Server to version ce099c1ed25d9eb3076c11e4a280f3eb52b4fbeb
Removing previous installation...
Installing VS Code Server for Linux x64 (ce099c1ed25d9eb3076c11e4a280f3eb52b4fbeb)
Downloading: 100%
Failed
--2026-03-22 10:15:29--  https://update.code.visualstudio.com/commit:ce099c1ed25d9eb3076c11e4a280f3eb52b4fbeb/server-linux-x64/stable
Connecting to 127.0.0.1:7890... failed: Connection refused.
ERROR: Failed to download https://update.code.visualstudio.com/commit:ce099c1ed25d9eb3076c11e4a280f3eb52b4fbeb/server-linux-x64/stable to /root/.vscode-server/bin/ce099c1ed25d9eb3076c11e4a280f3eb52b4fbeb-1774145729.tar.gz
```

这篇文章主要回答两个问题：

1. 为什么 WSL 中的 `code .` 会因为 `127.0.0.1:7890` 报错？
2. 如何把 WSL 网络改成 `mirrored` 模式，让 WSL 可以直接访问 Windows 本机代理？

---

## 核心概念

### 1. `127.0.0.1` 到底指向谁？

很多人第一次遇到这个问题时，直觉上会认为：

- Windows 上代理软件监听了 `127.0.0.1:7890`
- 那么 WSL 里访问 `127.0.0.1:7890` 应该也能通

但实际上并不总是这样。

`127.0.0.1` 永远表示“当前系统自身的回环地址”。
也就是说：

- 在 Windows 里，`127.0.0.1` 指的是 Windows 自己
- 在 WSL 里，`127.0.0.1` 指的是 WSL 这个 Linux 环境自己

如果 WSL 还是默认的 NAT 网络模式，那么 Linux 里的 `127.0.0.1` 并不等价于 Windows 的 `127.0.0.1`。

### 2. 报错的真实原因

从日志可以看到关键一句：

```text
Connecting to 127.0.0.1:7890... failed: Connection refused.
```

这说明 VS Code Server 在下载时走了代理，而且代理地址被设置成了：

```text
http://127.0.0.1:7890
```

但当时 WSL 无法访问这个地址，所以连接被拒绝，最终导致 VS Code Server 下载失败。

换句话说，问题不在 `code .`，也不在下载地址本身，而在于：

- WSL 内继承了代理变量
- 代理地址写成了 `127.0.0.1:7890`
- 但 WSL 当前网络模式下无法正确访问 Windows 上的本地代理

---

## 为什么 `mirrored` 模式能解决问题？

WSL 近几个版本引入了 `mirrored` 网络模式。
它的一个重要意义就是：**让 WSL 和 Windows 主机在本地网络访问上更接近“同机视角”**。

对于代理场景来说，这意味着：

- Windows 上监听的本地代理端口
- WSL 中也可以通过 `127.0.0.1` 直接访问

这正好解决了本文里的问题。

简单理解：

- 默认 NAT 模式：WSL 和 Windows 的本地回环并不完全一致
- `mirrored` 模式：两边的本地访问关系更自然，兼容本机代理、端口监听、局域网联调等场景

---

## 我的环境检查

在正式修改之前，我先确认了系统是否满足前提条件。

### 1. WSL 版本

执行：

```powershell
wsl --version
```

确认当前 WSL 是较新的 Store 版，版本为：

- WSL: `2.6.3.0`
- Windows: `10.0.22631.6199`

这说明已经具备使用 `mirrored` 模式的基础条件。

### 2. 代理端口是否真的在 Windows 上监听

执行检查后，确认 Windows 侧 `7890` 端口确实在监听。
这一步很重要，因为如果 Windows 代理根本没启动，那么即使改成 `mirrored` 也没有意义。

### 3. WSL 内是否继承了代理变量

在 WSL 中可以看到这些环境变量：

```bash
http_proxy=http://127.0.0.1:7890
https_proxy=http://127.0.0.1:7890
HTTP_PROXY=http://127.0.0.1:7890
HTTPS_PROXY=http://127.0.0.1:7890
```

这说明 WSL 的下载请求确实被引导到了本地代理端口。

---

## 配置方法

WSL 的全局配置文件位于 Windows 用户目录下：

```text
C:\Users\你的用户名\.wslconfig
```

注意这里是：

- Windows 侧的 `.wslconfig`
- 不是 Linux 里的 `/etc/wsl.conf`

我最终采用的配置如下：

```ini
[wsl2]
networkingMode=mirrored
dnsTunneling=true
firewall=true
autoProxy=true

[experimental]
autoMemoryReclaim=gradual
```

### 配置项说明

#### `networkingMode=mirrored`

这是本文最核心的配置。
作用是启用 WSL 镜像网络模式，让 WSL 和 Windows 在网络访问上更接近同一主机。

#### `dnsTunneling=true`

启用 DNS 隧道模式。
在 VPN、代理、复杂 DNS 环境下，通常会比默认方式更稳定。

#### `firewall=true`

让 Windows/Hyper-V 的防火墙规则继续生效。
一般建议保留开启。

#### `autoProxy=true`

让 WSL 自动感知和继承 Windows 代理设置。
对需要走系统代理的环境比较方便。

#### `autoMemoryReclaim=gradual`

这个和网络无关，只是保留原来的内存回收配置。

---

## 实际操作步骤

### 1. 备份旧配置

如果原来已经有 `.wslconfig`，建议先备份。

例如：

```powershell
Copy-Item $env:USERPROFILE\.wslconfig $env:USERPROFILE\.wslconfig.bak
```

### 2. 修改 `C:\Users\用户名\.wslconfig`

写入：

```ini
[wsl2]
networkingMode=mirrored
dnsTunneling=true
firewall=true
autoProxy=true

[experimental]
autoMemoryReclaim=gradual
```

### 3. 重启 WSL

修改 `.wslconfig` 后，必须彻底关闭并重新启动 WSL：

```powershell
wsl --shutdown
```

然后重新进入 WSL 即可。

---

## 验证过程

改完配置后，我做了三类验证。

### 1. 验证 WSL 是否能访问本地代理端口

在 WSL 中执行：

```bash
curl -I --max-time 5 http://127.0.0.1:7890
```

返回结果类似：

```text
HTTP/1.1 400 Bad Request
```

这里的 `400` 不是错误，反而说明一件关键事情：

- 连接已经打到了代理程序本身
- 只是因为直接用 HTTP 请求代理端口，不符合代理协议预期，所以返回了 `400`

也就是说，**WSL 到 Windows 代理端口的网络链路已经通了**。

### 2. 验证是否能访问 VS Code 更新服务器

在 WSL 中执行：

```bash
curl -I --max-time 15 https://update.code.visualstudio.com
```

结果成功返回 `200 Connection established` 和后续 HTTP 响应头。
这说明 WSL 已经能够通过代理正常访问外网。

### 3. 验证具体的 VS Code Server 下载地址

继续验证最初报错中的具体地址：

```bash
curl -I --max-time 20 "https://update.code.visualstudio.com/commit:ce099c1ed25d9eb3076c11e4a280f3eb52b4fbeb/server-linux-x64/stable"
```

返回了 `302` 跳转，说明：

- 该下载地址本身没有问题
- 代理链路也已经打通
- 原来的故障已经被修复

---

## 常见误区

### 误区 1：`127.0.0.1` 在 Windows 和 WSL 中天然互通

这是最容易踩的坑。
默认情况下，WSL 和 Windows 虽然在一台机器上，但它们的回环地址并不总是可以直接等价使用。

### 误区 2：只要设置了代理环境变量，网络就一定可用

不是的。
代理变量只是在告诉程序“你应该走哪个代理”，并不能保证这个代理地址一定可达。

如果程序看到：

```bash
http_proxy=http://127.0.0.1:7890
```

但这个地址在当前网络模型下无法访问，那么结果就是连接失败。

### 误区 3：`curl` 返回 `400` 就说明代理坏了

对于代理端口来说，这种结论不一定对。
如果你直接请求代理监听端口，很多代理程序都会返回 `400 Bad Request`。
这通常意味着：

- 端口已经打通
- 进程存在并响应了请求
- 问题不是“连不上”，而是“请求格式不符合代理协议场景”

---

## 一套更稳妥的排查思路

如果你以后再遇到类似问题，可以按下面的顺序排查：

### 1. 看环境变量

```bash
env | grep -i proxy
```

确认程序到底有没有走代理，以及走的是哪个代理。

### 2. 看 Windows 端口有没有监听

在 Windows PowerShell 中执行：

```powershell
Get-NetTCPConnection -LocalPort 7890 -State Listen
```

确认代理软件是否真的启动。

### 3. 看 WSL 能不能打到代理端口

```bash
curl -I http://127.0.0.1:7890
```

如果连不上，优先怀疑网络模式或代理监听范围。

### 4. 看 WSL 能不能访问目标网站

```bash
curl -I https://update.code.visualstudio.com
```

如果这里也不通，那问题就不在 VS Code，而是整体网络链路没有打通。

---

## 总结

这次问题的本质不是 VS Code Server 安装脚本异常，而是 WSL 中的代理访问路径出了问题。

可以把结论归纳成下面几点：

- `code .` 失败的根因是 WSL 试图通过 `127.0.0.1:7890` 下载 VS Code Server，但当时无法访问这个本地代理
- 默认 WSL 网络模式下，Linux 中的 `127.0.0.1` 并不一定能直接访问 Windows 的本地代理
- 将 WSL 改为 `mirrored` 模式后，WSL 可以正常访问 Windows 上的 `127.0.0.1:7890`
- 配合 `dnsTunneling=true` 和 `autoProxy=true`，代理与 DNS 行为会更稳定
- 实际测试已经验证：代理端口可连通，VS Code 更新地址可访问，具体 Server 下载地址也已恢复正常

最终配置如下：

```ini
[wsl2]
networkingMode=mirrored
dnsTunneling=true
firewall=true
autoProxy=true

[experimental]
autoMemoryReclaim=gradual
```

---

## 参考资料

- [Microsoft Learn: WSL networking](https://learn.microsoft.com/windows/wsl/networking)
- [Microsoft Learn: Advanced settings configuration in WSL](https://learn.microsoft.com/windows/wsl/wsl-config)
- [VS Code Docs: Remote Development using WSL](https://code.visualstudio.com/docs/remote/wsl)
- [VS Code Docs: Remote Development with Linux](https://code.visualstudio.com/docs/remote/linux)
