---
title: 本地ssh反向代理服务器
date: 2026-04-06 11:29:55
tags:
---

## ssh反向代理

**适用场景**

- 内网服务器无法访问github，而本地电脑可以科学上网，故内网服务器发起的请求通过本地电脑代理访问。
- 跳板机，如只能访问内网某台机器，可以设置转发到其他内网机器的22端口进行登录。

**原理**

- 在内网服务器上起一个端口，设置内网服务器访问外网的请求走这个端口进行代理
- 内网服务器代理端口的请求，全部转发到本地电脑的科学上网工具上。

**实现**

通过ssh反向代理来完成上述需求，无需使用root权限。

如：

```
ssh -p 8222 -qngfNTR 8888:localhost:8765 rd@10.33.5.83
# 命令在client上执行，会在server上起一个8888端口，server上的服务代理到8888端口进行科学上网
# 使用rd用户连接server(10.33.5.83)的8222(因服务器22端口无法直接访问，iptables将8222转发至22)端口，将server(10.33.5.83)的8888端口转发到client的8765端口，这样10.33.5.83通过设置代理到127.0.0.1的8888即可通过client的8765端口进行代理。
-q: 静默模式，不显示任何警告或错误信息。
-n: 不执行远程命令。
-g: 允许远程主机连接到本地转发的端口。
-f: 在后台运行SSH会话。
-N: 不执行远程命令。
-T: 不分配伪终端。
-p: 指定ssh端口，不指定默认22
```

在设置git代理即可

```
#git操作
# 使用socks5代理git请求
git config --global http.proxy socks5://127.0.0.1:8888
# 此处注意，不管git clone是http还是https，都要设置http的代理，https的不起作用
# 取消全局代理
git config --global --unset https.proxy
```

http代理

```
export http_proxy="http://127.0.0.1:8888"
export https_proxy="http://127.0.0.1:8888"
或
export ALL_PROXY="http://proxy.example.com:8080"
curl -I https://www.google.com  # 检查是否走代理
export no_proxy="localhost,127.0.0.1,192.168.1.0/24 排除某些地址不走代理
# 取消代理
unset http_proxy https_proxy all_proxy
```

## 参考

- \[1\] [ssh反向代理](https://cloud.tencent.com/developer/article/1528395)
- \[2\] [ssh使用正向代理-反向代理](https://www.cnblogs.com/wudonghang/p/48f75dabdefb9500c842dfa456712653.html)
