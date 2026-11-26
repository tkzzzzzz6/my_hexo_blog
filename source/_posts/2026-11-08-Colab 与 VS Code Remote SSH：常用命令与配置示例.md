---
title: Colab 与 VS Code Remote SSH：常用命令与配置示例
categories:
  - 环境配置
date: 2026-11-08
tags:
  - Colab
  - VS Code
  - SSH
  - 云端算力
  - Google Drive
description: 汇总 Windows、Linux 和 macOS 下 Colab CLI 的常用命令、不同 GPU 的 SSH 配置示例、VS Code 远程目录打开方式，以及 Google Drive 共享工作区的使用方法。
---

本文整理在 Windows、Linux 和 macOS 上使用 Colab CLI 和 VS Code Remote SSH 的常用命令：创建 GPU 会话、配置 SSH 主机入口、打开远程目录，以及挂载 Google Drive 保存代码、数据和模型。

Colab CLI 命令以 `google-colab-cli 0.7.5` 为例。Windows 使用 PowerShell 7，Linux 使用 Bash，macOS 可使用默认的 Zsh。没有系统专用路径或变量的 `colab`、`ssh`、`code` 命令在三个系统上写法相同；标注“远端”的命令在 Colab 的 Linux 终端中执行。

<!-- more -->

## 一、安装工具与登录

### Windows 安装

在已安装 `uv` 和 VS Code 的本机执行：

```powershell
# 安装 Google Cloud CLI
winget install --id Google.CloudSDK --exact --source winget

# 安装 Colab CLI
uv tool install google-colab-cli

# 安装 VS Code Remote SSH 扩展
code --install-extension ms-vscode-remote.remote-ssh
```

安装后重新打开 PowerShell，检查命令是否可用：

```powershell
gcloud --version
colab version
Get-Command colab, ssh, code
```

### Linux 安装

以下以 Ubuntu/Debian 为例。先安装 OpenSSH 客户端及安装工具，再按 Google 的 APT 仓库方式安装 Cloud CLI；已经配置过该仓库时跳过添加步骤：

```bash
# 本地 Linux 终端
sudo apt-get update
sudo apt-get install -y ca-certificates gnupg curl openssh-client unzip

# 导入 Google Cloud 仓库密钥
curl -fsSL https://packages.cloud.google.com/apt/doc/apt-key.gpg \
  | sudo gpg --dearmor -o /usr/share/keyrings/cloud.google.gpg

# 添加仓库
echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" \
  | sudo tee /etc/apt/sources.list.d/google-cloud-sdk.list

sudo apt-get update
sudo apt-get install -y google-cloud-cli
```

其他发行版可以选择官方提供的压缩包或相应包管理器安装方式。[Google Cloud CLI 安装说明](https://docs.cloud.google.com/sdk/docs/install-sdk)

安装 `uv` 和 Colab CLI：

```bash
# 本地 Linux 终端
curl -LsSf https://astral.sh/uv/install.sh | sh
export PATH="$HOME/.local/bin:$PATH"
uv tool install google-colab-cli
uv tool update-shell
```

`uv tool update-shell` 按需更新终端启动配置，使后续终端也能找到工具。VS Code 请先按其 Linux 安装说明安装，再执行下面的扩展安装命令。[uv 安装说明](https://docs.astral.sh/uv/getting-started/installation/)、[VS Code Linux 安装说明](https://code.visualstudio.com/docs/setup/linux)

```bash
code --install-extension ms-vscode-remote.remote-ssh
```

### macOS 安装

已安装 [Homebrew](https://brew.sh/) 时，在本地终端执行：

```bash
brew install uv
brew install --cask gcloud-cli

# 尚未安装 VS Code 时执行
brew install --cask visual-studio-code

uv tool install google-colab-cli
export PATH="$HOME/.local/bin:$PATH"
uv tool update-shell
```

当前 Google Cloud CLI 的 Homebrew cask 名称是 `gcloud-cli`。[Homebrew 软件包说明](https://formulae.brew.sh/cask/gcloud-cli)

打开 VS Code，按 `Cmd+Shift+P`，搜索 `Shell Command`，执行安装 `code` 命令到 PATH 的选项，然后重新打开终端。[VS Code macOS 命令行配置](https://code.visualstudio.com/docs/setup/mac#_launch-vs-code-from-the-command-line)

```bash
code --install-extension ms-vscode-remote.remote-ssh
```

### Linux/macOS 检查命令

```bash
gcloud --version
colab version
command -v colab
command -v ssh
command -v code
```

Colab CLI 官方目前列出的支持平台是 Linux 和 macOS；本文中的 Windows 用法来自本机已成功连接的配置。[Colab CLI 官方说明](https://github.com/googlecolab/google-colab-cli)

### Google 身份认证

三个系统都可以执行同一条 ADC 登录命令：

```powershell
gcloud auth application-default login --scopes=openid,https://www.googleapis.com/auth/cloud-platform,https://www.googleapis.com/auth/userinfo.email,https://www.googleapis.com/auth/colaboratory
```

按浏览器提示完成登录，再查看会话：

```powershell
colab sessions
```

这一步用于 Colab CLI 的身份认证；后面的 Drive 挂载还需要单独授权。[认证参数说明](https://github.com/googlecolab/google-colab-cli/blob/main/src/colab_cli/auth.py)

### 准备 SSH 密钥

已有可用的 Ed25519 密钥时直接使用。仅在密钥文件不存在时创建，按提示设置口令：

```powershell
New-Item -ItemType Directory -Path "$env:USERPROFILE\.ssh" -Force | Out-Null
ssh-keygen -t ed25519 -f "$env:USERPROFILE\.ssh\id_ed25519"
```

后面的配置统一使用 `~/.ssh/id_ed25519`。如果换用其他密钥路径，需要同时修改 `IdentityFile` 和 `ProxyCommand` 中的 `--identity`。

Linux/macOS 在本地终端使用下面的命令，已有密钥时跳过创建：

```bash
mkdir -p "$HOME/.ssh"
chmod 700 "$HOME/.ssh"

if [ ! -f "$HOME/.ssh/id_ed25519" ]; then
  ssh-keygen -t ed25519 -f "$HOME/.ssh/id_ed25519"
fi

chmod 600 "$HOME/.ssh/id_ed25519"
```

## 二、创建和管理 Colab 会话

本节命令适用于 Windows PowerShell、Linux Bash 和 macOS Zsh，选择需要的命令执行即可。

### 创建运行时

按需要选择其中一条执行；每条 `new` 命令都会申请新的运行时资源：

```powershell
# CPU 会话
colab new -s colab

# GPU 会话，选择需要的型号
colab new -s colab-g4 --gpu G4
colab new -s colab-h100 --gpu H100
colab new -s colab-a100 --gpu A100
colab new -s colab-l4 --gpu L4
colab new -s colab-t4 --gpu T4
```

`-s` 指定会话名，`--gpu` 指定新运行时的 GPU 类型。实际分配受账号权限、算力额度和资源供应影响。

### 查看会话和打开网页

下面以 `colab-g4` 为例；使用其他会话时替换名称即可：

```powershell
# 列出会话
colab sessions

# 查看指定会话状态
colab status -s colab-g4

# 显示连接到该会话的 Colab 网页地址
colab url -s colab-g4
```

### 停止会话

确认任务已结束、需要的文件已经保存后执行：

```powershell
colab stop -s colab-g4
```

关闭 SSH 终端或 VS Code 窗口不会自动停止运行时。`/content` 是运行时本地目录，需要长期保留的文件应存入云盘或下载到本地。

## 三、SSH config 完整示例

Windows 用户的 SSH 配置文件是：

```text
%USERPROFILE%\.ssh\config
```

可以通过 VS Code 打开编辑：

```powershell
code "$env:USERPROFILE\.ssh\config"
```

Linux/macOS 的配置文件是 `~/.ssh/config`，可以这样准备并打开：

```bash
mkdir -p "$HOME/.ssh"
chmod 700 "$HOME/.ssh"
touch "$HOME/.ssh/config"
chmod 600 "$HOME/.ssh/config"
code "$HOME/.ssh/config"
```

将需要的主机条目合并到配置文件中；已有同名 `Host` 时修改原条目，避免重复。下面先给出 **Windows 版**的一个基础入口和五个 GPU 入口：

```sshconfig
# 基础会话
Host colab
  HostName colab-runtime
  User root
  IdentityFile ~/.ssh/id_ed25519
  IdentitiesOnly yes
  ProxyCommand colab ssh --proxy-mode -s colab --identity ~/.ssh/id_ed25519
  StrictHostKeyChecking no
  UserKnownHostsFile NUL
  ServerAliveInterval 30
  ServerAliveCountMax 3
  ConnectTimeout 60

# G4
Host colab-g4
  HostName colab-runtime
  User root
  IdentityFile ~/.ssh/id_ed25519
  IdentitiesOnly yes
  ProxyCommand colab ssh --proxy-mode -s colab-g4 --gpu G4 --identity ~/.ssh/id_ed25519
  StrictHostKeyChecking no
  UserKnownHostsFile NUL
  ServerAliveInterval 30
  ServerAliveCountMax 3
  ConnectTimeout 120

# H100
Host colab-h100
  HostName colab-runtime
  User root
  IdentityFile ~/.ssh/id_ed25519
  IdentitiesOnly yes
  ProxyCommand colab ssh --proxy-mode -s colab-h100 --gpu H100 --identity ~/.ssh/id_ed25519
  StrictHostKeyChecking no
  UserKnownHostsFile NUL
  ServerAliveInterval 30
  ServerAliveCountMax 3
  ConnectTimeout 120

# A100
Host colab-a100
  HostName colab-runtime
  User root
  IdentityFile ~/.ssh/id_ed25519
  IdentitiesOnly yes
  ProxyCommand colab ssh --proxy-mode -s colab-a100 --gpu A100 --identity ~/.ssh/id_ed25519
  StrictHostKeyChecking no
  UserKnownHostsFile NUL
  ServerAliveInterval 30
  ServerAliveCountMax 3
  ConnectTimeout 120

# L4
Host colab-l4
  HostName colab-runtime
  User root
  IdentityFile ~/.ssh/id_ed25519
  IdentitiesOnly yes
  ProxyCommand colab ssh --proxy-mode -s colab-l4 --gpu L4 --identity ~/.ssh/id_ed25519
  StrictHostKeyChecking no
  UserKnownHostsFile NUL
  ServerAliveInterval 30
  ServerAliveCountMax 3
  ConnectTimeout 120

# T4
Host colab-t4
  HostName colab-runtime
  User root
  IdentityFile ~/.ssh/id_ed25519
  IdentitiesOnly yes
  ProxyCommand colab ssh --proxy-mode -s colab-t4 --gpu T4 --identity ~/.ssh/id_ed25519
  StrictHostKeyChecking no
  UserKnownHostsFile NUL
  ServerAliveInterval 30
  ServerAliveCountMax 3
  ConnectTimeout 120
```

### Linux/macOS 配置示例

Linux/macOS 使用上面相同的主机别名、会话名和 GPU 参数，将每个条目的 `UserKnownHostsFile NUL` 改为 `UserKnownHostsFile /dev/null`。以 G4 为例：

```sshconfig
Host colab-g4
  HostName colab-runtime
  User root
  IdentityFile ~/.ssh/id_ed25519
  IdentitiesOnly yes
  ProxyCommand colab ssh --proxy-mode -s colab-g4 --gpu G4 --identity ~/.ssh/id_ed25519
  StrictHostKeyChecking no
  UserKnownHostsFile /dev/null
  ServerAliveInterval 30
  ServerAliveCountMax 3
  ConnectTimeout 120
```

附件的 `ssh-config.unix.example` 提供了六个完整入口，`ssh-config.example` 为 Windows 版。三个系统对应的文件位置和写法如下：

| 项目 | Windows PowerShell | Linux / macOS |
| --- | --- | --- |
| 用户主目录变量 | `$env:USERPROFILE` | `$HOME` 或 `~` |
| SSH 配置文件 | `%USERPROFILE%\.ssh\config` | `~/.ssh/config` |
| 默认私钥 | `~/.ssh/id_ed25519` | `~/.ssh/id_ed25519` |
| 空设备 | `NUL` | `/dev/null` |
| 当前目录文件路径 | `.\job.py` | `./job.py` |
| 多行命令续行 | PowerShell 的反引号 | Bash/Zsh 的反斜杠 `\` |

VS Code 需要能从本地 PATH 找到 `colab`。需要写绝对路径时，先用 Windows 的 `Get-Command colab` 或 Linux/macOS 的 `command -v colab` 查询，再替换 `ProxyCommand` 开头的可执行文件路径；包含空格的路径加双引号。

### 参数含义

| 配置项 | 作用 |
| --- | --- |
| `Host` | 本机连接时使用的主机别名，例如 `ssh colab-g4` |
| `HostName` | SSH 使用的目标主机标识；本例实际连接由代理命令建立 |
| `User root` | 远端登录用户 |
| `IdentityFile` | 本机 OpenSSH 使用的私钥 |
| `IdentitiesOnly yes` | 限定 SSH 使用配置的身份，减少其他密钥的尝试 |
| `ProxyCommand` | 通过 Colab CLI 建立 SSH 数据通道 |
| `--proxy-mode` | 将 SSH 标准输入输出接到 Colab 通道 |
| `-s` | 选择 Colab 会话名 |
| `--gpu` | 会话不存在时，创建运行时所用的 GPU 类型 |
| `--identity` | Colab CLI 使用的密钥路径，与 `IdentityFile` 保持一致 |
| `StrictHostKeyChecking no` | 放宽服务器主机密钥检查 |
| `UserKnownHostsFile NUL` | 将用户级主机记录指向 Windows 空设备 |
| `ServerAliveInterval 30` | 每隔 30 秒发送一次保活请求 |
| `ServerAliveCountMax 3` | 连续 3 次保活未获回应后断开 |
| `ConnectTimeout` | SSH 连接超时，单位为秒 |

**`--gpu` 只在创建新会话时生效。** 已有会话会被复用；修改这一项不会将现有运行时原地更换为另一种 GPU。为不同显卡使用不同会话名即可。[SSH 选项与会话创建逻辑](https://github.com/googlecolab/google-colab-cli/blob/main/src/colab_cli/commands/ssh.py)

`NUL` 是 Windows 写法，Linux/macOS 通常使用 `/dev/null`。上面的主机密钥配置适用于本文临时运行时的使用方式，会降低服务器身份核验强度；保活参数也不会延长平台规定的运行时寿命。

### 使用配置连接

按需要选择一个入口：

```powershell
ssh colab
ssh colab-g4
ssh colab-h100
ssh colab-a100
ssh colab-l4
ssh colab-t4
```

GPU 入口在会话不存在时可以自动申请对应运行时。连接后，在远端确认实际显卡：

```bash
nvidia-smi
```

## 四、直接使用 SSH 命令

临时连接时，也可以不写入 config，直接传入参数。Windows PowerShell：

```powershell
ssh -i "$env:USERPROFILE\.ssh\id_ed25519" -o IdentitiesOnly=yes -o ProxyCommand="colab ssh --proxy-mode -s colab-g4 --gpu G4 --identity ~/.ssh/id_ed25519" -o StrictHostKeyChecking=no -o UserKnownHostsFile=NUL root@colab-runtime
```

Linux/macOS 本地终端：

```bash
ssh -i "$HOME/.ssh/id_ed25519" \
  -o IdentitiesOnly=yes \
  -o ProxyCommand="colab ssh --proxy-mode -s colab-g4 --gpu G4 --identity ~/.ssh/id_ed25519" \
  -o StrictHostKeyChecking=no \
  -o UserKnownHostsFile=/dev/null \
  root@colab-runtime
```

这些命令与前面的 `colab-g4` 配置作用相同，日常使用 `ssh colab-g4` 更方便。

## 五、VS Code 打开远程目录

通过命令面板执行 `Remote-SSH: Connect to Host...`，选择相应主机后，再执行“打开文件夹”。以下命令在 Windows、Linux、macOS 的本地终端中都可直接指定远程目录：

```powershell
# 基础会话，打开 /content
code --remote ssh-remote+colab /content

# G4 会话，打开 /content
code --remote ssh-remote+colab-g4 /content

# H100 会话，打开 /content
code --remote ssh-remote+colab-h100 /content
```

使用远程文件夹 URI，可以在新窗口中打开：

```powershell
code --new-window --folder-uri vscode-remote://ssh-remote+colab/content
```

远程目录由 VS Code 的参数指定；SSH config 保持前面的连接配置即可。[VS Code 官方命令行用法](https://code.visualstudio.com/docs/remote/troubleshooting#_connect-to-a-remote-host-from-the-terminal)

## 六、挂载同一个 Google Drive

### 挂载命令和路径

在任一系统的本地终端中，为需要使用的会话挂载云盘：

```powershell
colab drivemount -s colab /content/drive
```

换成其他会话时，相应替换 `-s` 后的名称：

```powershell
colab drivemount -s colab-g4 /content/drive
colab drivemount -s colab-h100 /content/drive
```

出现授权提示后，在浏览器中选择**存放项目的同一个 Google 账号**，完成授权并回到终端按 Enter。每个新运行时都需要分别挂载。

挂载后，“我的云端硬盘”的路径是：

```text
/content/drive/MyDrive
```

### 共享工作区

本文配套脚本使用以下目录：

```text
/content/drive/MyDrive/ColabWorkspace
├── code/          代码
├── data/          数据集
├── models/        模型权重与适配器
├── checkpoints/   训练检查点
├── outputs/       日志、图表与导出结果
└── env/           依赖清单与初始化脚本
```

每个运行时都用 `/content/workspace` 软链接指向这个根目录，代码里即可使用相同路径。

[下载共享工作区脚本与 SSH 配置示例](/downloads/colab-vscode-drive/colab-workspace-tools.zip)。Windows 用户将压缩包解压到：

```text
%USERPROFILE%\Documents\Colab
```

先将附件中的 SSH 配置合并到本机 config，再在本地运行启动脚本：

```powershell
# 使用已有的基础会话
& "$env:USERPROFILE\Documents\Colab\Open-ColabWorkspace.ps1" -Session colab

# 使用 G4 入口；会话不存在时会申请 GPU 资源
& "$env:USERPROFILE\Documents\Colab\Open-ColabWorkspace.ps1" -Session colab-g4

# 使用 H100 入口
& "$env:USERPROFILE\Documents\Colab\Open-ColabWorkspace.ps1" -Session colab-h100
```

脚本完成挂载检查、共享目录初始化和工作区标识核对，然后打开 VS Code。基础入口 `colab` 要求会话已经存在，五个 GPU 入口可在会话不存在时自动创建。

其他可选用法：

```powershell
# 只准备工作区，不打开 VS Code
& "$env:USERPROFILE\Documents\Colab\Open-ColabWorkspace.ps1" -Session colab-g4 -NoOpen

# 已挂载时检查并准备工作区；未挂载则报错
& "$env:USERPROFILE\Documents\Colab\Open-ColabWorkspace.ps1" -Session colab-g4 -NoOpen -NoMount
```

`-NoOpen` 和 `-NoMount` 都不会禁止缺失 GPU 会话的自动创建。

### Linux/macOS 准备共享工作区

将下载的压缩包解压到本地目录：

```bash
mkdir -p "$HOME/Documents/Colab"
unzip "$HOME/Downloads/colab-workspace-tools.zip" -d "$HOME/Documents/Colab"
```

先把 `ssh-config.unix.example` 中需要的条目合并到 `~/.ssh/config`。对应会话已创建后，在本地终端依次挂载云盘、执行远端初始化脚本，再打开 VS Code：

```bash
# 选择已有会话，也可以改成 colab-h100 等名称
session=colab-g4

# 完成浏览器授权后，回到此终端按 Enter
colab drivemount -s "$session" /content/drive

# 读取本地脚本，在 Colab 运行时中初始化共享目录
colab exec -s "$session" --timeout 180 \
  -f "$HOME/Documents/Colab/Initialize-Workspace.py"
```

确认初始化成功后打开远程目录：

```bash
code --remote "ssh-remote+$session" /content/workspace
```

初始化会输出 `COLAB_WORKSPACE_READY=1` 和工作区标识。不同运行时使用同一个 Google 账号，并比对工作区标识；此手动流程需要自行核对，Windows 启动脚本会自动比较本地保存的标识。

工作区准备完成后，也可直接打开：

```powershell
code --remote ssh-remote+colab-g4 /content/workspace
```

共享目录会保留代码、数据和检查点；新运行时的 Python 包需要重新安装，训练也需要从已保存的检查点显式恢复。多个任务使用各自的输出子目录，避免同时写入同一文件。

## 七、执行代码和安装依赖

### 从本地提交 Python 脚本

```powershell
# 读取本地 job.py，提交到指定会话的 Python 内核执行
# 此处将等待超时设为 300 秒
colab exec -s colab-g4 --timeout 300 -f .\job.py
```

Linux/macOS 将本地路径写为 `./job.py`：

```bash
colab exec -s colab-g4 --timeout 300 -f ./job.py
```

`exec` 的默认执行超时为 30 秒，可按任务时长调整；长时间训练可以在 VS Code 的远端终端中启动。

### 从本地安装依赖清单

```powershell
# requirements.txt 是本地文件
colab install -s colab-g4 -r .\requirements.txt
```

Linux/macOS 本地终端：

```bash
colab install -s colab-g4 -r ./requirements.txt
```

使用共享工作区中的依赖清单时，先填入项目实际使用的包和版本，再在远端执行：

```bash
python -m pip install -r /content/workspace/env/requirements.txt

# 或执行配套初始化脚本生成的安装入口
bash /content/workspace/env/bootstrap.sh
```

## 八、传输文件和导出执行历史

在本地执行，两个路径分别表示来源和目标：

```powershell
# 上传：本地文件 → 远端文件
colab upload -s colab-g4 .\job.py /content/job.py

# 下载：远端文件 → 本地文件
colab download -s colab-g4 /content/result.json .\result.json

# 查看最近 20 条 CLI 执行记录
colab log -s colab-g4 -n 20

# 将 CLI 执行历史导出为本地 Notebook
colab log -s colab-g4 -o .\session.ipynb
```

Linux/macOS 本地终端使用正斜杠路径：

```bash
colab upload -s colab-g4 ./job.py /content/job.py
colab download -s colab-g4 /content/result.json ./result.json
colab log -s colab-g4 -n 20
colab log -s colab-g4 -o ./session.ipynb
```

`upload` 和 `download` 的示例针对单个文件；共享云盘中的项目也可以直接在 VS Code 中编辑。`log` 导出的是 CLI 记录的会话历史。

## 九、日常使用顺序

SSH config 和配套脚本准备好后，Windows 日常操作可以简化为：

```powershell
# 1. 查看已有会话
colab sessions

# 2. 准备共享工作区并打开 VS Code
& "$env:USERPROFILE\Documents\Colab\Open-ColabWorkspace.ps1" -Session colab-g4
```

Linux/macOS 在本地终端使用：

```bash
colab sessions
colab drivemount -s colab-g4 /content/drive
colab exec -s colab-g4 --timeout 180 \
  -f "$HOME/Documents/Colab/Initialize-Workspace.py" \
  && code --remote ssh-remote+colab-g4 /content/workspace
```

在打开的远端终端中执行：

```bash
# 3. 确认显卡并进入项目目录
nvidia-smi
cd /content/workspace

# 4. 安装项目依赖
bash env/bootstrap.sh

# 5. 运行自己的脚本，路径按项目结构修改
python code/train.py
```

任务结束、文件保存完成后，回到本地停止对应运行时：

```powershell
colab stop -s colab-g4
```

平时主要使用三类入口：`colab` 命令管理运行时，`ssh` 或 VS Code 连接指定会话，共享工作区脚本准备云盘目录。更换显卡时替换会话名，继续打开同一个 `/content/workspace`，即可复用已保存的项目文件。
