---
title: 2026-03-22-WSL-网络配置-将网络模式切换为-mirrored-并修复-VS-Code-Server-下载失败
date: 2026-03-22
categories:
  - 我要炼丹,丹没有问题
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

这篇文章主要解决一个问题：WSL 在默认网络模式下无法直接访问 Windows 本机代理，导致 `code .` 下载 VS Code Server 失败。对应的修复方法，就是把 WSL 网络切到 `mirrored` 模式。

---

## 问题本质

关键点只有一个：`127.0.0.1` 指向的是“当前系统自己”。

- 在 Windows 里，`127.0.0.1` 指向 Windows
- 在 WSL 里，`127.0.0.1` 指向 WSL 自己

因此，在默认 NAT 模式下，WSL 里的 `127.0.0.1:7890` 并不等价于 Windows 上代理软件监听的 `127.0.0.1:7890`。

从日志里的这句就能看出来：

```text
Connecting to 127.0.0.1:7890... failed: Connection refused.
```

这说明 VS Code Server 下载时确实走了代理，但 WSL 当时访问不到这个本地代理地址，所以安装失败。问题不在 `code .` 本身，而在代理路径。

---

## 为什么 `mirrored` 模式能解决问题？

`mirrored` 模式的核心价值是让 WSL 和 Windows 在本地网络访问上更接近“同机视角”。对本文场景来说，最直接的效果就是：

- Windows 上监听的本地代理端口
- WSL 中也能通过 `127.0.0.1` 直接访问

所以，把 WSL 改成 `mirrored` 后，这个问题就能直接消掉。

---

## 我的环境检查

在正式修改之前，我先确认了环境没有别的问题。

### 1. WSL 版本

执行：

```powershell
wsl --version
```

确认当前 WSL 是较新的 Store 版，版本为：

- WSL: `2.6.3.0`
- Windows: `10.0.22631.6199`

说明已经具备使用 `mirrored` 模式的前提。

### 2. 代理端口是否真的在 Windows 上监听

确认 Windows 侧 `7890` 端口确实在监听。否则即使切成 `mirrored`，也一样不能用。

### 3. WSL 内是否继承了代理变量

在 WSL 中可以看到这些环境变量：

```bash
http_proxy=http://127.0.0.1:7890
https_proxy=http://127.0.0.1:7890
HTTP_PROXY=http://127.0.0.1:7890
HTTPS_PROXY=http://127.0.0.1:7890
```

说明 WSL 的请求确实被引导到了本地代理端口。

---

## 配置方法

WSL 的全局配置文件位于 Windows 用户目录下：

```text
C:\Users\你的用户名\.wslconfig
```

注意这里改的是 Windows 侧的 `.wslconfig`，不是 Linux 里的 `/etc/wsl.conf`。

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

- `networkingMode=mirrored`：核心配置，让 WSL 可以更自然地访问 Windows 本地网络资源
- `dnsTunneling=true`：在 VPN、代理、复杂 DNS 环境下通常更稳定
- `firewall=true`：保留 Windows/Hyper-V 防火墙规则
- `autoProxy=true`：让 WSL 自动继承 Windows 代理设置
- `autoMemoryReclaim=gradual`：与网络无关，只是保留原来的内存回收策略

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

改完配置后，我主要做了三类验证。

### 1. 验证 WSL 是否能访问本地代理端口

在 WSL 中执行：

```bash
curl -I --max-time 5 http://127.0.0.1:7890
```

返回结果类似：

```text
HTTP/1.1 400 Bad Request
```

这里的 `400` 反而说明请求已经打到了代理程序本身，只是请求格式不符合代理协议预期。也就是说，**WSL 到 Windows 代理端口的链路已经通了**。

### 2. 验证是否能访问 VS Code 更新服务器

在 WSL 中执行：

```bash
curl -I --max-time 15 https://update.code.visualstudio.com
```

成功返回 `200 Connection established` 和后续 HTTP 响应头，说明 WSL 已经能通过代理访问外网。

### 3. 验证具体的 VS Code Server 下载地址

继续验证最初报错中的具体地址：

```bash
curl -I --max-time 20 "https://update.code.visualstudio.com/commit:ce099c1ed25d9eb3076c11e4a280f3eb52b4fbeb/server-linux-x64/stable"
```

返回 `302` 跳转，说明下载地址本身没有问题，代理链路也已经恢复正常。

---

## 常见误区

### 1. `127.0.0.1` 在 Windows 和 WSL 中天然互通

默认情况下并不是。两边虽然在同一台机器上，但回环地址不一定能直接等价使用。

### 2. 配了代理环境变量就一定能用

也不是。环境变量只是在告诉程序“走哪个代理”，不保证这个代理地址一定可达。

### 3. `curl http://127.0.0.1:7890` 返回 `400` 就说明代理坏了

未必。对代理端口来说，`400 Bad Request` 往往表示端口已经打通，只是请求格式不对。

---

## 排查顺序

以后再遇到类似问题，可以按这个顺序排查：

### 1. 看环境变量

```bash
env | grep -i proxy
```

先确认程序到底有没有走代理，以及走的是哪个代理。

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

这次问题的本质不是 VS Code Server 安装脚本异常，而是 WSL 在默认网络模式下访问不到 Windows 本机代理。把 WSL 改成 `mirrored`，再配合 `dnsTunneling=true` 和 `autoProxy=true` 后，代理链路就恢复正常了。实际验证结果也表明：代理端口可访问、VS Code 更新地址可访问、具体 Server 下载链接也能正常返回。

---

## 参考资料

- [Microsoft Learn: WSL networking](https://learn.microsoft.com/windows/wsl/networking)
- [Microsoft Learn: Advanced settings configuration in WSL](https://learn.microsoft.com/windows/wsl/wsl-config)
- [VS Code Docs: Remote Development using WSL](https://code.visualstudio.com/docs/remote/wsl)
- [VS Code Docs: Remote Development with Linux](https://code.visualstudio.com/docs/remote/linux)
