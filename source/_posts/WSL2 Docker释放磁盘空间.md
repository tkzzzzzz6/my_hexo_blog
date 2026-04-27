---
title: WSL2 Docker释放磁盘空间
date: 2026-04-28
tags:
---


Docker使用久了，会残留很多中间生成的镜像，占用磁盘空间。

要清理Docker镜像，本来是挺简单的，一条命令就搞定了：

docker system prune

但是当在Windows中使用WSL2作为Docker后端引擎的时候，情况就会稍微复杂一些了。

## 原理因为WSL2本质上来说是虚拟机，对于每个虚拟机，Windows会创建`vhdx`后缀的磁盘镜像文件，用于存储其内容，类似于vmdk、vdi，用过虚拟机的同学应该都不陌生。

这种镜像文件的特点是支持自动扩容，但是一般不会自动缩容。因此一旦Docker镜像文件过多，引起镜像扩容，即使再使用`docker system prune`清理虚拟机中的镜像文件，也不会释放出已经占用的系统磁盘空间了。

## 解决方案镜像文件虽然一般不会自动压缩，但是支持手动压缩。

首先寻找到对应的镜像文件，在系统中搜索`ext4.vhdx`文件，可以搜索到多条记录，Docker对应的镜像文件一般是在`C:\Users\<你的用户名>\AppData\Local\Docker\wsl\data\ext4.vhdx`这个位置。

找到这个文件之后，进行压缩即可。

首先，删除Docker中的无用镜像：

docker system prune

然后退出Docker Desktop并关停WSL2实例。

wsl \--shutdown

最后打开 Windows 中提供的`diskpart`工具进行压缩

# 代码来自 https://github.com/microsoft/WSL/issues/4699#issuecomment-627133168

diskpart
# open window Diskpart
select vdisk file\="C:\\Users\\<你的用户名>\\AppData\\Local\\Docker\\wsl\\data\\ext4.vhdx"
attach vdisk readonly
compact vdisk
detach vdisk
exit

根据 [L53317](https://github.com/L53317) 的[评论](https://gist.github.com/banyudu/af131c7bb681e8a80b5cbe2047e62d4c?permalink_comment_id=4355255#gistcomment-4355255)，上述`diskpart`系列命令也可简化为：

Optimize-VHD \-Path "path\_to\_disk.vhdx" \-Mode Full

如此操作完成之后，就可以看到磁盘空间已经收回了。

貌似可以使用
Optimize-VHD -Path "path_to_disk.vhdx" -Mode Full
应该也是有效果的，这个工具只需要一个命令即可。猜测Optimize-VHD这个工具的内部实现是diskpart，因为用diskpart和用Optimize-VHD时都遇到了相同的“文件被加密，用户没有能力解密”的问题，并且实测这两个命令都可以用来解决类似问题。
参考链接：
https://tkacz.pro/reduce-wsl-and-docker-disks-size/
https://learn.microsoft.com/en-us/powershell/module/hyper-v/optimize-vhd?view=windowsserver2022-ps&viewFallbackFrom=win10-ps

[Łukasz Tkacz](https://tkacz.pro/author/admin/ "Posts by Łukasz Tkacz") [Software](https://tkacz.pro/kategoria/software/) January 6, 2022April 7, 2026

I really like WSL/WSL2 in Windows – it provides a lot of features with minimal performance impact (WSL2) and I can still use Windows app. In combination with Docker, it can handle a lot of things and it’s much better for me than for example MacOS. One problem I discovered last time is space consumed by WSL, and also Docker volumes. In both cases, Windows uses Virtual Hard Disk (VHD) format, vhdx files to store all data.

The problem is Windows can extend virtual disks on demand, without asking about that, but doesn’t reclaim free space if we make bigger changes inside WSL filesystem or Docker volumes. I had few IDE versions and different instances, each about 1,5 – 2 GB, and it consumed a lot of space. After deletion them from WSL filesystem, I didn’t get any real free space on my computer disk. We have to manually compact virtual hard disks to do that. How to do this? It’s quite simple. First, we have to enable Hyper-V if it’s not enabled. Just run terminal or PowerShell with admin privileges and execute this command:

```powershell
Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V -All
```

System restart may be required after that.

Second step is to compact disks. First, close Docker Desktop if it’s running and also shut down WSL by command:

```powershell
wsl --shutdown
```

Right now we can compact disks, command is also very simple:

```powershell
Optimize-VHD -Path "path_to_disk.vhdx" -Mode Full
```

The question is, where can we find these disks?

You can find disks created by Docker in:

```powershell
SYSTEM_DRIVE\Users\your_username\Local\Docker\wsl // and then directories inside
```

Second thing is related to your WSL distro – all should be in the same main directory, but with different subdirectory. I use Ubuntu, from Canonical and in that case, data is located on:

```
SYSTEM_DRIVE\Users\your_username\Local\Packages\CanonicalGroupLimited(...)\LocalState\ext4.vhdx
```

Of course you can use search or tools like Everything to locale any \*.vhdx file easily.

After execute command, file should become smaller and you will have more free space.

