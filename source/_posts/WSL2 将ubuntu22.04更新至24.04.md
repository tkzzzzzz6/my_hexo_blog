---
title: WSL2 Docker释放磁盘空间
date: 2026-04-28
tags:
---

> [notice] 在ubuntu系统执行

先执行
```
sudo apt update && sudo apt full-upgrade
```

更新 Linux 发行版中的软件包确保系统处于最新状态

> [notice] 在windows系统执行


```
# 1. 查看你当前 WSL 分发版的准确名称（通常是 Ubuntu 或 Ubuntu-22.04）
wsl -l -v

# 2. 彻底关闭所有正在运行的 WSL 实例
wsl --shutdown

# 3. 将系统完整导出备份到一个空间充足的磁盘（例如你的 E 盘）
wsl --export Ubuntu-22.04 E:\wsl\Ubuntu_2204_Backup.tar[换成你的备份路径]
```

![1777692659958.png](https://tk-pichost-1325224430.cos.ap-chengdu.myqcloud.com/blog/1777692659958.png)

确保后面出现问题及时恢复

> [notice] 在ubuntu系统执行

这是 WSL 里 Ubuntu 镜像的一个经典“保护机制”。为了防止用户在不知情的情况下被静默升级，默认在配置文件里把大版本升级的提示通道给彻底关闭了（`Prompt=never`）。

我们只需要把这个开关拨到 `lts`（长期支持版）即可。既然你已经很习惯用命令行了，最快的方法是用 `sed` 命令直接一键替换，免去打开编辑器手动修改的麻烦。

请直接在终端执行这条命令：

### 1. 解除升级锁定
```bash
sudo sed -i 's/Prompt=never/Prompt=lts/g' /etc/update-manager/release-upgrades
```
*(这条命令会悄悄把配置文件里的 `never` 替换成 `lts`)*

### 2. 验证是否修改成功（可选）
你可以瞄一眼文件内容，确认最后一行是不是变成了 `Prompt=lts`：
```bash
cat /etc/update-manager/release-upgrades
```

锁已经解开了，再次运行升级命令：
```bash
sudo do-release-upgrade
```
如果运行后提示 `No new release found.`，这是因为 Ubuntu 官方对旧版本推送 24.04 的节奏比较保守（通常要等到 24.04.1 甚至更晚才会全面放开）。
这时候你需要加上强制拉取开发分支的参数（不用担心，现在拉取到的 24.04 已经是极其稳定的正式发行版了）：
```bash
sudo do-release-upgrade -d
```

准备迎接满屏的代码滚动和全新的 24.04 环境吧！升级过程中记得留意之前我提到的那几个交互选项（遇到修改配置冲突一律选 `N`）。

![1777692857641.png](https://tk-pichost-1325224430.cos.ap-chengdu.myqcloud.com/blog/1777692857641.png)

验证版本

```bash
lsb_release -a
```

![1777694446833.png](https://tk-pichost-1325224430.cos.ap-chengdu.myqcloud.com/blog/1777694446833.png)

需要注意的是wsl2中显示的还是ubuntu22.04

### 为什么会出现这种情况？

你可以把 WSL 想象成一个“集装箱”：
1. **外包装（Windows 视角）**：`wsl -l -v` 显示的 `Ubuntu-22.04` 只是 Windows 给这个虚拟磁盘文件（`.vhdx`）和注册表项起的一个**别名（标签）**。这个名字是在你最初从微软商店下载或手动导入时定死的。
2. **内部货物（Linux 视角）**：`lsb_release -a` 显示的是集装箱里面的**真实系统状态**。当你运行 `do-release-upgrade` 时，你是在集装箱内部把里面的货物全部翻新了。

Windows 这个宿主机是个“甩手掌柜”，它根本不在乎、也不知道集装箱里面跑的到底是 22.04 还是 24.04，它只认最初贴上的那张叫 `Ubuntu-22.04` 的标签。

---

### 这会有任何负面影响吗？
**完全没有。**
除了对有“强迫症”的极客来说看着有点别扭之外，它不会对你的任何开发工作（Docker、Conda、ROS2、CUDA）产生哪怕一丝一毫的影响。你的系统现在就是货真价实的 24.04。

---

### 如果我非要改名字怎么办？（强迫症专区）

微软的 WSL 命令行至今**没有提供原生改名的命令**（比如 `wsl --rename` 是不存在的）。如果你实在觉得这个名字碍眼，唯一的官方正规途径是“导出再以新名字导入”。

鉴于你现在的系统配置很棒（连 Oh My Posh 和 Conda 环境都完美保留了），如果你想改名，可以按照以下步骤操作：

**1. 关闭当前 WSL**
在 Windows 的 PowerShell 中执行：
```powershell
wsl --shutdown
```

**2. 导出当前的 24.04 系统**
（随便找个空间大的盘，比如 E 盘）
```powershell
wsl --export Ubuntu-22.04 E:\wsl\Ubuntu_2404_New.tar
```

**3. 以新名字重新导入**
（注意：导入时你需要指定一个新的安装目录来存放它的虚拟磁盘文件）
```powershell
wsl --import Ubuntu-24.04 E:\wsl\Ubuntu2404_Instance E:\wsl\Ubuntu_2404_New.tar
```

**4. 验证并设置为默认系统**
```powershell
wsl -l -v
wsl -s Ubuntu-24.04
```

**5. 删掉旧标签（彻底告别 22.04）**
确认新的 `Ubuntu-24.04` 进去后一切正常，没有任何数据丢失，你就可以把旧的那个卸载掉了：
```powershell
wsl --unregister Ubuntu-22.04
```
