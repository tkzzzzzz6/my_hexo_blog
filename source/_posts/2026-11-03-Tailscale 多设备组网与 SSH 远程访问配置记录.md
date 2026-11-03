---
title: Tailscale 多设备组网与 SSH 远程访问配置记录
date: 2026-11-03
categories:
  - 进击的码农
tags:
  - Tailscale
  - Linux
  - 终端工具
  - 问题解决
---

# Tailscale 多设备组网与 SSH 远程访问配置记录

平时在笔记本、Windows 台式机和 Linux 服务器之间切换，最麻烦的往往不是某一条连接命令，而是这些设备根本不在同一个网络里。今天能在局域网里连上，明天换个地方，就得重新找入口、核对映射端口。

之前整理过 {% post_link "2026-09-28-Frp 内网穿透配置记录" "frp 内网穿透配置记录" %}。这次换一个思路：先用 Tailscale 把设备接入同一个虚拟网络，再通过 SSH 访问终端；需要查看 Windows 桌面时，再使用 RDP 或会话影子功能 `/shadow`。

这篇把安装、登录、SSH 公钥认证和常见排障整理到一起，方便自己回头查，也给第一次配置的同学一个可以按顺序操作的参考。

> **参数提示**：本文的设备名、用户名、IP 和公钥内容均为示例，实际使用时需要替换。Linux 登录卡住的案例只记录已观察到的现象与后续诊断方法，不把尚未验证的处理方案写成成功经验。

<!-- more -->

---

## 📌 快速速查表

| 操作场景 | 核心命令 | 说明 |
| :--- | :--- | :--- |
| **Linux 首次登录** | `sudo tailscale up` | 返回浏览器认证链接 |
| **显示登录二维码** | `sudo tailscale up --qr` | 在支持该参数的版本中使用 |
| **查看设备状态** | `tailscale status` | 检查登录状态和可见设备 |
| **查看本机地址** | `tailscale ip -4` | 获取 Tailscale IPv4 地址 |
| **检查设备通路** | `tailscale ping 100.90.0.20` | 测试到目标 Tailscale 节点的连接 |
| **SSH 登录 Linux** | `ssh dev@100.90.0.30` | 使用目标机器的系统账号 |
| **生成 SSH 密钥** | `ssh-keygen -t ed25519 -C "laptop-to-linux"` | 在发起连接的电脑上执行 |
| **查看后台日志** | `sudo journalctl -u tailscaled -n 60 --no-pager` | 适用于使用 systemd 的 Linux |
| **普通远程桌面** | `mstsc /v:100.90.0.20 /prompt` | 在 Windows 客户端执行 |
| **查看已有桌面会话** | `mstsc /v:100.90.0.20 /shadow:1 /control /prompt` | 会话 ID、权限和目标策略需匹配 |

速查表中的命令属于不同阶段，下面按“先组网、再开服务、最后配认证”的顺序展开。

---

## 一、先分清 Tailscale、SSH 和远程桌面的分工

### 1. Tailscale 解决设备之间的网络连接

Tailscale 基于 WireGuard 建立加密连接，为设备分配 Tailscale IP。设备加入同一个 tailnet 后，在访问规则允许的前提下，可以通过这些地址相互访问。

它通常不需要自己准备公网服务器，也不需要逐项配置路由器端口转发。设备会尝试建立直连；直连条件不满足时，可以通过中继连接，速度和延迟取决于实际路径。不能把“组网成功”直接理解成“无论在哪里都和局域网一样快”。

### 2. SSH 和 RDP 提供具体的远程访问能力

| 工具或功能 | 负责什么 | 常见用途 |
| :--- | :--- | :--- |
| Tailscale | 设备组网与网络访问控制 | 让不同网络中的电脑互相可达 |
| OpenSSH | 终端登录、远程命令、文件传输 | 开发、服务器管理、VS Code Remote - SSH |
| 普通 RDP | 登录远程 Windows 桌面 | 远程使用桌面软件 |
| RDP Shadow | 查看或控制已有的用户会话 | 协助排障、演示正在操作的桌面 |

![Tailscale 连接 Windows 与 Linux，网络、服务和账号权限需要分别确认](https://tk-pichost-1325224430.cos.ap-chengdu.myqcloud.com/blog/tailscale-remote-access-20261103/01-tailscale-network-services-17233423a918d1b8.png)

*图 1：先确认网络通路，再检查服务与账号权限。图中 IP 为示例，连线不表示所有流量都必须经过中心服务器。自制教学示意图，AI 辅助绘制。*

比如从 Windows 笔记本登录 Linux 服务器，整个过程可以写成：

```text
Windows 笔记本
  → Tailscale 网络通路
  → Linux 的 OpenSSH 服务
  → Linux 账号认证
  → 进入远程终端
```

**装好 Tailscale，不会自动替目标电脑安装 OpenSSH，也不会自动赋予远程桌面权限。** 网络、服务、账号是三个需要分别确认的环节。[官方设备连接说明](https://tailscale.com/docs/how-to/connect-to-devices)

### 3. 普通 OpenSSH 与 Tailscale SSH 要区分

本文主要使用的是：**Tailscale 负责网络，系统的 OpenSSH 负责 SSH 认证。** 因此仍然需要配置 `sshd`、系统账号和公钥。

官方另外提供了一个名为 **Tailscale SSH** 的功能，由 Tailscale 管理 SSH 的身份认证和授权，配置方式与手动维护 `authorized_keys` 不同。不要把它与“通过 Tailscale IP 连接普通 SSH 服务”混为一谈。

如果只是想保留现有的 OpenSSH 配置和开发工具习惯，可以先按本文的普通 OpenSSH 路线配置。[Tailscale SSH 官方说明](https://tailscale.com/docs/features/tailscale-ssh)

---

## 二、安装 Tailscale，并把设备接入同一个网络

### 1. 先约定设备信息

下面用三台设备举例：

| 设备 | 系统 | Tailscale IP 示例 | 系统用户名示例 |
| :--- | :--- | :--- | :--- |
| laptop | Windows | `100.90.0.10` | `alice` |
| desktop | Windows | `100.90.0.20` | `alice` |
| linux-host | Ubuntu | `100.90.0.30` | `dev` |

这些地址要以实际分配结果为准。Tailscale 的 IPv4 地址使用 `100.64.0.0/10` 地址空间，并不是所有 `100.*` 地址都属于 Tailscale。

另外，**Tailscale 登录账号与目标电脑的系统用户名不是同一个概念**。浏览器中登录的身份负责加入 tailnet；`ssh dev@...` 中的 `dev` 是 Linux 上实际存在的用户。

### 2. Windows 安装与登录

1. 从 [Tailscale Windows 下载页](https://tailscale.com/download/windows)下载安装程序。
2. 安装后打开托盘里的 Tailscale 图标，选择登录。
3. 在浏览器中完成认证，让自己的设备加入同一个 tailnet。
4. 在 [设备管理页面](https://login.tailscale.com/admin/machines)检查设备是否在线；如果网络开启了设备审批，还需要完成审批。

为了方便初次配置，自己的几台设备可以使用同一个 Tailscale 账号登录。团队协作时则应使用成员邀请、设备共享和访问规则，不需要共享个人账号密码。

Windows 上可以运行：

```powershell
tailscale status
tailscale ip -4
```

如果希望 Windows 注销或重启后仍能连接 Tailscale，在托盘菜单中启用 **Preferences → Run unattended**。这只保持组网服务在线，不会自动登录 Windows，也不会自动产生可供 Shadow 查看的桌面。[Windows 安装说明](https://tailscale.com/docs/install/windows)、[无人值守运行说明](https://tailscale.com/docs/how-to/run-unattended)

### 3. Linux 终端安装与登录

Ubuntu、Debian 等主流发行版可以使用官方安装脚本：

```bash
curl -fsSL https://tailscale.com/install.sh | sh
```

如果更习惯逐项添加软件源，也可以使用 [官方软件包页面](https://pkgs.tailscale.com/stable/)中对应发行版的安装命令。

对于使用 systemd 的普通 Linux 主机，安装后检查服务并发起登录：

```bash
sudo systemctl enable --now tailscaled
sudo tailscale up
```

正常情况下，终端会返回一个认证链接。把链接复制到自己电脑或手机的浏览器中，登录正确的 Tailscale 账号并确认添加设备即可。**浏览器不需要运行在这台 Linux 上。**

支持二维码参数的版本也可以运行：

```bash
sudo tailscale up --qr
```

登录后检查：

```bash
tailscale status
tailscale ip -4
```

Linux 上的 `tailscaled` 作为后台服务运行。服务正常且登录状态有效时，关闭 SSH 终端不会让设备退出 Tailscale，不需要添加 Windows 专用的 `--unattended` 参数。[Linux 安装说明](https://tailscale.com/docs/install/linux)、[命令参数说明](https://tailscale.com/docs/reference/tailscale-cli/up)

### 4. 验证两台设备是否真正可达

在 laptop 上测试 linux-host：

```bash
tailscale ping 100.90.0.30
```

输出可以帮助判断当前走的是直连还是中继。然后再测试具体服务，例如 Windows 上检查 Linux 的 SSH 端口：

```powershell
Test-NetConnection 100.90.0.30 -Port 22
```

两种检查的含义不同：

- `tailscale status` 能看到设备，说明获得了相应的设备信息，不保证每个服务都能访问。
- `tailscale ping` 成功，说明节点通路可用，不代表 SSH 账号认证成功。
- TCP 22 可连接，说明该端口存在可用通路，后面仍可能因账号或密钥而被拒绝。

设备不可达时，需要同时看 Tailscale 访问规则和目标系统防火墙。已有自定义规则的 tailnet，不能仅因为设备属于同一个账号就假定所有流量都放行。

---

## 三、开启目标电脑上的 OpenSSH 服务

### 1. 目标是 Ubuntu / Debian

在被连接的 Linux 上执行：

```bash
sudo apt update
sudo apt install openssh-server
sudo systemctl enable --now ssh
sudo systemctl status ssh --no-pager
```

Ubuntu / Debian 常见服务名是 `ssh`；其他发行版可能使用 `sshd`，不要把服务名当作跨发行版固定写法。

如果只希望示例中的 laptop 访问 linux-host 的 SSH，应在 Tailscale 的访问规则中限定这个连接方向和 TCP 22 端口，并检查是否有其他更宽的规则已经允许访问。

系统防火墙也需要结合实际配置检查。尤其是 Linux 上的 UFW：Tailscale 默认会管理自己的 netfilter 规则，它们可能先于 UFW 规则处理隧道流量，不能假定给 UFW 添加一条来源规则，就能限制所有 tailnet 内的访问。这里不需要为了教程额外启用防火墙，也不要在现有远程连接中盲目修改全局策略。[Tailscale netfilter 模式说明](https://tailscale.com/docs/reference/netfilter-modes)

然后在 laptop 上先测试一次普通登录：

```bash
ssh dev@100.90.0.30
```

首次连接时，核对目标主机的 SSH 指纹，再确认信任。已经通过其他可信方式登录服务器时，可以在服务器上查看对应主机公钥的指纹，例如 Ed25519 主机密钥：

```bash
ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub
```

如果协商使用的是其他类型的主机密钥，应核对对应类型的指纹。不要用关闭主机身份检查来掩盖指纹变化。[Ubuntu OpenSSH 配置说明](https://documentation.ubuntu.com/server/how-to/security/openssh-server/)

### 2. 目标是 Windows

在目标 Windows 的管理员 PowerShell 中检查 OpenSSH Server：

```powershell
Get-WindowsCapability -Online -Name OpenSSH.Server*
```

只有尚未安装时，才执行：

```powershell
Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0
```

安装后启动并设置自动运行：

```powershell
Start-Service sshd
Set-Service -Name sshd -StartupType Automatic
Get-Service sshd
```

同时检查安装程序创建的 `OpenSSH-Server-In-TCP` 防火墙规则及其地址范围是否符合自己的访问需求：

```powershell
Get-NetFirewallRule -Name OpenSSH-Server-In-TCP
```

有 SSH 客户端，不代表已经安装并启动 SSH 服务端。只有被连接的 Windows 才需要这里的服务端配置；单纯拿 Windows 去登录 Linux，不需要为此开启 Windows 的 `sshd`。[微软 OpenSSH 安装说明](https://learn.microsoft.com/en-us/windows-server/administration/openssh/openssh_install_firstuse)

---

## 四、配置 SSH 公钥认证，减少重复输入密码

### 1. 密钥生成在哪一端？

先确定连接方向：A 想登录 B，就由 A 保存私钥，把 A 的公钥部署到 B 的目标账号。

![SSH 公钥部署与登录校验关系，私钥留在客户端，目标 Linux 账号保存客户端公钥](https://tk-pichost-1325224430.cos.ap-chengdu.myqcloud.com/blog/tailscale-remote-access-20261103/02-ssh-public-key-authentication-e80e659be80c7436.png)

*图 2：公钥部署与实际登录验证是两个步骤，私钥不在网络中发送。图中仅示例 Linux 授权路径，Windows 的路径差异见下文。自制教学示意图，AI 辅助绘制。*

如果还希望 B 反过来登录 A，再为反方向配置一套授权即可。单向访问不要求两边都生成密钥，更不需要把同一份私钥复制到所有设备上。

### 2. 在发起连接的电脑上生成密钥

先检查是否已有可用密钥，避免覆盖：

Linux / macOS：

```bash
ls -l ~/.ssh/id_ed25519*
```

Windows PowerShell：

```powershell
Get-ChildItem "$env:USERPROFILE\.ssh\id_ed25519*" -ErrorAction SilentlyContinue
```

没有密钥时，在客户端生成：

```bash
ssh-keygen -t ed25519 -C "laptop-to-linux"
```

交互过程中可以选择保存位置，并给私钥设置口令。**“不再输入服务器账号密码”不等于“私钥必须不设口令”。** 设置口令后，可以通过 `ssh-agent` 管理解锁状态。

对于已经运行 SSH agent 的 Linux / macOS 会话，可以加入密钥：

```bash
ssh-add ~/.ssh/id_ed25519
```

如果提示无法连接 agent，先检查当前桌面或终端是否已提供 agent；需要时可以在当前 Linux shell 中启动：

```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```

Windows 可以在管理员 PowerShell 中启动 agent 服务：

```powershell
Set-Service -Name ssh-agent -StartupType Automatic
Start-Service ssh-agent
```

再回到实际发起连接的 Windows 用户下添加自己的密钥：

```powershell
ssh-add "$env:USERPROFILE\.ssh\id_ed25519"
```

注意区分 `id_ed25519` 与 `id_ed25519.pub`：前者是私钥，后者是可以部署到目标电脑的公钥。[微软 SSH 密钥管理说明](https://learn.microsoft.com/en-us/windows-server/administration/openssh/openssh_keymanagement)

### 3. 把公钥部署到 Linux 目标账号

在安装了 `ssh-copy-id` 的 Linux / macOS 客户端上，可以执行：

```bash
ssh-copy-id -i ~/.ssh/id_ed25519.pub dev@100.90.0.30
```

这一步通常需要输入一次目标账号密码。macOS 上如果没有 `ssh-copy-id`，可以另行安装，或者采用手动复制方式，不必假定每套系统都预装了它。

Windows PowerShell 可以把公钥通过 SSH 写入 Linux：

```powershell
Get-Content "$env:USERPROFILE\.ssh\id_ed25519.pub" | ssh dev@100.90.0.30 "umask 077; mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
```

也可以手动复制 `.pub` 文件的整行内容，在 Linux 目标账号下追加到 `~/.ssh/authorized_keys`，每把公钥单独一行。不要覆盖已经存在的其他授权。

最后验证：

```bash
ssh -i ~/.ssh/id_ed25519 dev@100.90.0.30
```

如果已经解锁了私钥，可以进一步用非交互模式检查：

```bash
ssh -o BatchMode=yes dev@100.90.0.30 "hostname; whoami"
```

带口令的私钥尚未解锁时，`BatchMode=yes` 也可能失败，所以不能仅凭这个测试失败就断定服务器拒绝了公钥。

### 4. Windows 目标账号的公钥路径有区别

Windows OpenSSH 默认配置需要区分普通用户和管理员组用户：

| 目标账号类型 | 默认公钥授权文件 |
| :--- | :--- |
| 标准用户 | `C:\Users\目标用户名\.ssh\authorized_keys` |
| 本地 Administrators 组成员 | `C:\ProgramData\ssh\administrators_authorized_keys` |

最终以目标机器的 `C:\ProgramData\ssh\sshd_config` 为准，尤其要检查 `Match Group administrators` 与 `AuthorizedKeysFile` 配置。

对于标准用户，在该目标用户自己的会话中创建 `.ssh` 目录并编辑 `authorized_keys`，追加客户端的公钥即可。

对于默认规则下的管理员组用户，在目标 Windows 的管理员 PowerShell 中操作：

```powershell
$keyFile = "$env:ProgramData\ssh\administrators_authorized_keys"
New-Item -ItemType Directory -Path "$env:ProgramData\ssh" -Force | Out-Null
if (-not (Test-Path -LiteralPath $keyFile)) {
    New-Item -ItemType File -Path $keyFile | Out-Null
}
notepad $keyFile
```

在记事本里追加客户端公钥，保持一行一把公钥并保存。这个管理员授权文件需要限制为 Administrators 与 SYSTEM 可访问。中文 Windows 可以使用 SID，避免组名本地化带来的差异：

```powershell
icacls $keyFile /inheritance:r
icacls $keyFile /grant:r '*S-1-5-32-544:F' '*S-1-5-18:F'
icacls $keyFile
```

上述命令移除继承，并设置这两个主体的权限；如果文件原本有额外的显式授权，它们不会被自动全部删除，需要结合最后的输出检查并按实际情况处理。

**不要假定 `ssh-copy-id` 会自动处理 Windows 管理员的特殊路径和权限。** 这一步可以直接参考 [微软 Windows 公钥部署说明](https://learn.microsoft.com/en-us/windows-server/administration/openssh/openssh_keymanagement)。

### 5. 配置 SSH 别名

Linux / macOS 的客户端配置文件是 `~/.ssh/config`，Windows 通常是 `%USERPROFILE%\.ssh\config`。例如：

```ssh-config
Host linux-work
    HostName 100.90.0.30
    User dev
    IdentityFile ~/.ssh/id_ed25519
    IdentitiesOnly yes
    ServerAliveInterval 60
    ServerAliveCountMax 3
```

以后可以直接使用：

```bash
ssh linux-work
scp ./notes.txt linux-work:~/
```

VS Code 安装 Remote - SSH 扩展后，也可以使用这个别名连接远程开发环境。使用实际的 Tailscale IP 或已配置好的 MagicDNS 名称，不要把示例别名误认为已经存在的 DNS 记录。

---

## 五、Linux 执行 tailscale up 后一直没有登录链接，怎么排查？

遇到没有登录链接、命令一直等待的情况，可以先按下面的顺序检查，再根据输出决定是否修改配置。

![Linux Tailscale 登录无链接时，从后台服务、注册日志、HTTPS 测试到控制协议对照的排查流程](https://tk-pichost-1325224430.cos.ap-chengdu.myqcloud.com/blog/tailscale-remote-access-20261103/03-linux-login-troubleshooting-845fa401de444f19.png)

*图 3：普通 HTTPS 请求返回 302，不能证明控制连接正常或设备已经注册。这里展示的是排查路径，本文案例的最终原因仍待定位。自制教学示意图，AI 辅助绘制。*

### 1. 先区分“没有输出”和“正在等待密码”

Linux 输入 `sudo` 密码时通常不会显示字符或星号，这是正常现象。但如果密码已经输入完成，命令长时间没有登录链接，就需要检查后台服务。

这次遇到的现象是：执行 `tailscale login`、`tailscale up` 和 `tailscale up --qr`，都停在空行；按下 `Ctrl+C` 后显示：

```text
^Ccontext canceled
```

这里的 `context canceled` 是取消命令后的结果。单靠它看不出登录为什么卡住，反复切换这几个登录命令也不会补充多少诊断信息。

### 2. 检查服务状态和后台日志

```bash
sudo systemctl status tailscaled --no-pager -l
sudo journalctl -u tailscaled -n 60 --no-pager
```

这次实际观察到的是：

```text
Active: active (running)
Status: "Needs login: "

register request: Post "https://controlplane.tailscale.com/machine/register":
connection attempts aborted by context: context deadline exceeded
```

这说明服务进程正在运行，但注册请求没有及时完成。此时修改 SSH 公钥、重启 `sshd`，或者继续配置 RDP 权限，都不会处理注册连接本身的问题。[官方日志查看说明](https://tailscale.com/docs/features/logging?tab=linux)

### 3. 分别检查代理访问与显式直连

查看当前终端的代理变量：

```bash
printenv https_proxy HTTPS_PROXY http_proxy HTTP_PROXY ALL_PROXY all_proxy
```

如果输出包含代理账号密码，分享排障信息时遮住凭据。本文案例中，终端使用的 HTTP 代理地址是 `http://127.0.0.1:7890`。

先测试当前环境下的 HTTPS 访问：

```bash
curl -I --connect-timeout 5 --max-time 15 https://controlplane.tailscale.com
```

如果出现：

```text
HTTP/1.1 200 Connection established
HTTP/2 302
```

前一行说明 HTTP 代理建立了 CONNECT 隧道，后一行是目标网站返回的重定向响应。

然后绕过 curl 的显式代理设置再测试：

```bash
curl --noproxy '*' -I --connect-timeout 5 --max-time 15 https://controlplane.tailscale.com
```

这里的“绕过代理”针对 curl 的显式代理设置，不会自动绕过系统中的透明代理、TUN 路由或上游网关。

本次排查中，两种方式都获得了 `HTTP/2 302`。因此，不能把“后台没有继承终端代理”直接写成已经确认的故障原因。

### 4. curl 能访问，不等于控制协议能连接

普通网页请求与 Tailscale 注册使用的控制连接并不等价。curl 与 Tailscale 还可能在代理环境、地址选择、TLS 实现和连接升级等方面存在差异。

接下来可以使用官方代码中提供的 `ts2021` 诊断命令。先检查版本和本机帮助：

```bash
tailscale version
tailscale debug ts2021 --help
```

`debug` 子命令属于诊断接口，官方源码明确说明它不是稳定接口。不同版本可能没有该子命令或某个参数；不支持时保留版本和原报错，不要继续照搬后面的选项。[官方诊断命令源码](https://github.com/tailscale/tailscale/blob/main/cmd/tailscale/cli/debug.go)

如果本机支持，可以做两次对照。下面使用 Linux 的 `timeout` 限制等待时间，不修改永久环境配置。

**第一次：清除本次诊断进程的代理变量。**

```bash
env -u HTTP_PROXY -u HTTPS_PROXY -u ALL_PROXY \
    -u http_proxy -u https_proxy -u all_proxy \
    timeout 40s tailscale debug ts2021 --verbose
```

**第二次：明确使用已经确认可用的本机 HTTP 代理。**

```bash
env -u ALL_PROXY -u all_proxy \
    HTTP_PROXY=http://127.0.0.1:7890 \
    HTTPS_PROXY=http://127.0.0.1:7890 \
    http_proxy=http://127.0.0.1:7890 \
    https_proxy=http://127.0.0.1:7890 \
    NO_PROXY=localhost,127.0.0.1 \
    no_proxy=localhost,127.0.0.1 \
    timeout 40s tailscale debug ts2021 --verbose
```

代理地址按实际情况替换。`127.0.0.1` 指运行这些命令的 Linux 自己；如果代理在另一台电脑上，不能直接套用这个地址。

这两次诊断在当前用户的终端中执行，测试的是诊断进程自身的连接，不会替后台完成登录，也不完整复现后台注册时的全部状态。

| 对照结果 | 可以继续检查什么 |
| :--- | :--- |
| 直连失败、代理成功 | 让后台服务使用相同代理，再验证注册 |
| 两种都失败 | 根据输出判断失败在获取公钥、TLS 握手还是控制连接 |
| 直连成功、后台失败 | 核对后台环境、版本与完整注册日志 |
| 两种都成功 | 回到后台登录流程检查，不能仅凭诊断成功宣布注册成功 |

### 5. 只有证据支持时，才修改后台代理

`tailscaled` 由 systemd 启动，不会自动继承当前 shell 的代理变量。官方 Linux 服务文件会读取 `/etc/default/tailscaled`，因此可以在确实需要代理时，通过这个文件配置。[服务文件源码](https://github.com/tailscale/tailscale/blob/main/cmd/tailscaled/tailscaled.service)、[官方仓库相关讨论](https://github.com/tailscale/tailscale/issues/10235)

先用 `systemctl cat tailscaled` 检查本机实际的 `EnvironmentFile` 设置。确认使用这个文件后，保留原有 `PORT`、`FLAGS` 等内容，在其中添加或修改：

```ini
HTTP_PROXY="http://127.0.0.1:7890"
HTTPS_PROXY="http://127.0.0.1:7890"
```

不要使用只提供 SOCKS 服务的端口去冒充 HTTP 代理。已有 `NO_PROXY` / `no_proxy` 等配置时，也应检查它们是否让控制服务器绕过代理。

修改环境文件后，重启服务并重新登录：

```bash
sudo systemctl restart tailscaled
sudo tailscale up --timeout=30s
```

**截至本文整理时，上述案例尚未取得控制协议对照测试和后续登录成功的结果。** 已确认的只有后台注册超时、普通 HTTPS 的代理与显式直连测试均可返回响应；后台代理配置是按测试结果选择的处理分支，不是已经验证的修复结论。

---

## 六、组网以后，如何使用 Windows RDP Shadow？

### 1. 普通 RDP 与 Shadow 的区别

普通 RDP 用于登录远程 Windows 桌面，可能创建或重新连接自己的会话。Shadow 则连接指定的已有用户会话，适合查看对方正在操作的内容。

在支持远程桌面主机的 Windows 版本中开启远程桌面，并确认账号具备所需权限。Windows 家庭版可以作为客户端，但不提供内置远程桌面主机功能。[微软远程桌面配置说明](https://learn.microsoft.com/en-us/windows-server/remote/remote-desktop-services/remotepc/remote-desktop-allow-access)

在目标 Windows 上运行：

```powershell
quser
```

例如输出：

```text
用户名    会话名      ID    状态
alice     console      1    运行中
```

这是示例会话，实际使用时重新查询 ID。随后在另一台 Windows 上执行：

```powershell
mstsc /v:100.90.0.20 /shadow:1 /control /prompt
```

`/shadow:1` 指定会话，`/control` 请求鼠标键盘控制，`/prompt` 提示输入连接凭据。去掉 `/control` 后仅查看。组网不会取消目标电脑的认证、Shadow 权限或用户确认策略。

### 2. 目标电脑上的控制规则

在目标电脑中打开 `gpedit.msc`，找到：

```text
计算机配置 → 管理模板 → Windows 组件 → 远程桌面服务
→ 远程桌面会话主机 → 连接
→ 设置远程桌面服务用户会话的远程控制规则
```

可以根据协助需求选择“经用户允许完全控制”或“经用户允许查看会话”。组织管理的电脑以实际生效策略为准。

`/noConsentPrompt` 只有在目标策略允许无需确认时才适用，不能绕过账号认证或强行覆盖目标策略。[微软策略说明](https://learn.microsoft.com/en-us/windows/client-management/mdm/policy-csp-admx-terminalserver#ts_remotecontrol_2)

### 3. 为什么普通 RDP 端口映射不能直接套给 Shadow？

普通 RDP 可以使用 `mstsc /v:入口地址:映射端口`。但 Shadow 建立连接时还涉及远程管理接口和桌面共享连接，不能假定把 `3389` 映射出去就能覆盖它需要的全部通信。[微软 Shadow 接口定义](https://learn.microsoft.com/en-us/openspecs/windows_protocols/ms-tsts/48650711-3fe3-43ec-856e-930fd638ea21)

这次实际使用中，局域网 Shadow 可以连接，而带映射端口的入口报“此计算机名无效”。这只能作为症状记录，不能仅凭这一条报错就断言所有系统版本都不支持某种语法。

通过 Tailscale 时，直接使用目标设备的 Tailscale IP，并按需检查目标防火墙中的 SMB 管理通路及 Shadow 相关规则。单独测试 TCP 3389 成功，也不能证明这些通路都正常。

另外，小米路由器中要求填写“服务器、用户名、密码”的 PPTP/L2TP“添加服务”页面，是连接已有 VPN 服务器的入口；这个页面本身不会替你创建一个供外部设备接入的 VPN 服务器。两端直接安装 Tailscale 时，不需要填写它。

### 4. mstsc 常用参数与 Windows 快捷键

| 参数 | 含义 |
| :--- | :--- |
| `/v:主机` | 指定目标；普通 RDP 可附加端口 |
| `/prompt` | 连接时提示输入凭据 |
| `/f` | 普通远程桌面全屏启动 |
| `/w:1600 /h:900` | 设置普通远程桌面窗口尺寸 |
| `/multimon` | 普通远程桌面使用多个本地显示器 |
| `/l` | 列出本地显示器 ID |
| `/admin` | 服务器管理会话，不会额外赋予管理员权限 |
| `/edit "连接.rdp"` | 编辑已保存的连接配置 |
| `/shadow:ID` | 查看指定的已有会话 |
| `/control` | Shadow 时请求控制鼠标键盘 |
| `/noConsentPrompt` | 目标策略允许时不请求用户确认 |
| `/?` | 查看本机 mstsc 支持的参数 |

显示、多屏等普通 RDP 选项不能保证在 Shadow 中同样生效。[mstsc 官方参数说明](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/mstsc)

Windows 快捷键也由客户端单独处理。普通 RDP 可以进入“显示选项 → 本地资源 → 键盘”，把“应用 Windows 组合键”设置为“在远程计算机上”。对应 `.rdp` 配置是：

```ini
keyboardhook:i:1
```

默认值 `2` 表示仅全屏时把组合键发送给远端，`0` 表示在本机处理。`/control` 本身不会强制接管全部系统快捷键；Shadow 是否遵循同样的设置，要在实际版本中验证。[微软快捷键说明](https://learn.microsoft.com/en-us/windows/win32/termserv/terminal-services-shortcut-keys)、[RDP 属性说明](https://learn.microsoft.com/en-us/azure/virtual-desktop/rdp-properties)

---

## 七、常见问题与验证顺序

| 现象 | 优先检查 | 不能直接推出什么 |
| :--- | :--- | :--- |
| `tailscale up` 不返回链接 | `tailscaled` 状态、注册日志、控制连接 | 不能直接认定是 SSH 密钥问题 |
| curl 首页返回 `302` | 再检查实际控制协议连接 | 不能认定设备注册成功 |
| 状态列表能看到设备 | `tailscale ping`、访问规则、系统防火墙 | 不能认定所有服务已放行 |
| SSH `Connection refused` | `sshd` 是否监听、端口与拒绝规则 | 不能仅归因于“设备没组网” |
| SSH `Permission denied` | 系统用户名、密钥、授权路径及权限 | 不代表 Tailscale 网络一定有问题 |
| SSH 主机指纹变化 | 目标身份、系统重装或地址复用情况 | 不应直接关闭主机身份检查 |
| 普通 RDP 能用，Shadow 失败 | 活动会话、控制权限、策略及相关网络通路 | 不能只看 3389 是否能连通 |

排查 SSH 认证时，可以使用详细输出：

```bash
ssh -vvv dev@100.90.0.30
```

排查登录状态时，则回到：

```bash
tailscale status
sudo journalctl -u tailscaled -n 60 --no-pager
```

这两个方向不要混在一起。先确认卡在哪一层，再修改对应配置，通常比同时改 DNS、代理、SSH 和防火墙更容易找到原因。

---

## 总结

Tailscale 把不同网络里的设备接起来，OpenSSH 决定能否进入终端，RDP 和 Shadow 则负责不同的桌面访问场景。配置时先验证组网，再检查目标服务，最后处理系统账号和密钥，会更容易判断每一步是否完成。

这次排查也提醒我，命令输出要按它实际证明的内容来理解：服务在运行不等于已经登录，curl 能打开网页不等于控制连接正常，局域网里可用的 Shadow 也不等于单端口转发后一定可用。把这些边界记清楚，后面再遇到同类问题，至少知道下一条命令应该查哪里。

---

## 参考资料

- [Tailscale 官方 Linux 安装说明](https://tailscale.com/docs/install/linux)
- [Tailscale 设备连接与故障检查](https://tailscale.com/docs/how-to/connect-to-devices)
- [Tailscale 官方 SSH 功能说明](https://tailscale.com/docs/features/tailscale-ssh)
- [Tailscale Linux 服务与诊断命令源码](https://github.com/tailscale/tailscale)
- [OpenSSH 客户端配置手册](https://man.openbsd.org/ssh_config)
- [微软 Windows OpenSSH 公钥管理说明](https://learn.microsoft.com/en-us/windows-server/administration/openssh/openssh_keymanagement)
- [微软 mstsc 参数文档](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/mstsc)
- [QiYongchuan：Tailscale + SSH 多设备并网完整教程](https://github.com/QiYongchuan/MyGitBlog/issues/148)：作为选题参考，本文另行核对官方文档，并补充本次实际排障中的证据边界。
