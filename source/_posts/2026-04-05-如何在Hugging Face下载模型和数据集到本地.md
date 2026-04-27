---
title: 如何在Hugging Face下载模型和数据集到本地
categories:
  - 我要炼丹,丹没有问题
date: 2026-04-05
tags:
  - Hugging Face
  - 模型下载
  - 数据集
  - 命令行
---

平时在配置深度学习环境时，我们经常需要把 Hugging Face 上的模型或者数据集下载到本地服务器。浏览器直接点下载当然也能用，但只要文件一大、网络一抖、环境一换，整个人就会进入“怎么又断了”的经典状态。

所以更稳妥的做法，通常还是走命令行。

这篇文章把我自己常用的几种方法整理一下，包括：

- 使用 `huggingface-cli` 下载模型
- 使用 `huggingface-cli` 下载数据集
- 配置国内镜像以提高可用性
- 使用 `Git LFS` 作为备选方案

如果你只是想快速上手，直接看命令也可以；如果你想少踩坑，建议把后面的注意事项一并看完。

---

## 一、安装 `huggingface_hub`

最常见的下载方式，依赖的是 Hugging Face 官方的 `huggingface_hub`。

```bash
pip install huggingface_hub
```

如果你使用的是 Conda 环境，也建议先切到目标环境再安装：

```bash
conda activate your_env_name
pip install -U huggingface_hub
```

安装完成后，可以检查 CLI 是否可用：

```bash
huggingface-cli --help
```

---

## 二、国内网络环境下配置镜像

如果本地或者服务器没有稳定的外网访问能力，可以考虑先配置 Hugging Face 镜像地址。

Linux / macOS 下：

```bash
export HF_ENDPOINT=https://hf-mirror.com
```

Windows PowerShell 下：

```powershell
$env:HF_ENDPOINT="https://hf-mirror.com"
```

如果你希望长期生效，可以把这条环境变量写进对应的 Shell 配置文件。

这里有一个很关键的点：**镜像只能解决“下载入口”问题，前提仍然是资源本身允许你访问。** 某些受限模型依然需要先登录账号并通过审核。

---

## 三、登录 Hugging Face 账号

如果下载的是私有仓库、受限模型或者需要鉴权的数据集，先登录账号。

先打开 [Hugging Face 官网](https://huggingface.co/)，点击右上角头像，进入 `Access Tokens` 页面创建 Token。

然后执行：

```bash
huggingface-cli login --token "YOUR_TOKEN"
```

登录成功后，CLI 就能直接带着你的权限去访问对应资源。

如果你不想把 Token 明文写在历史命令里，也可以直接运行：

```bash
huggingface-cli login
```

按提示粘贴 Token 即可。

---

## 四、下载模型

最常见的方式如下。这里以 `Meta-Llama-3-8B-Instruct` 为例：

```bash
huggingface-cli download --resume-download meta-llama/Meta-Llama-3-8B-Instruct --local-dir ~/model/Meta-Llama-3-8B-Instruct
```

这个命令的几个关键参数：

- `--resume-download`：支持断点续传，网络不稳时非常有用
- `meta-llama/Meta-Llama-3-8B-Instruct`：目标模型仓库名
- `--local-dir`：指定下载到本地哪个目录

如果你只想下载仓库中的某个文件，也可以追加文件名：

```bash
huggingface-cli download bert-base-uncased config.json --local-dir ./bert-base-uncased
```

如果你想把文件下载到当前目录，也可以不写 `--local-dir`，但我个人并不推荐，因为模型一多，当前目录会很快变乱。

---

## 五、下载数据集

下载数据集时，需要显式指定 `--repo-type dataset`。

这里以 COCO 示例数据为例：

```bash
huggingface-cli download --repo-type dataset --resume-download sayakpaul/coco-30-val-2014  --local-dir /home/dataset/val2014 --local-dir-use-symlinks False
```

常用参数说明：

- `--repo-type dataset`：告诉 CLI 这是数据集仓库，不是模型仓库
- `--resume-download`：支持断点续传
- `--local-dir /home/dataset/val2014`：本地保存路径
- `--local-dir-use-symlinks False`：直接保存实体文件，而不是符号链接

如果你下载的是大型数据集，建议提前确认磁盘空间和路径权限，不然下到一半爆盘，心态会瞬间归零。

---

## 六、一个更稳的常用写法

如果你想把命令写得更明确一点，我比较常用下面这种形式：

```bash
# 下载模型
huggingface-cli download \
  meta-llama/Meta-Llama-3-8B-Instruct \
  --resume-download \
  --local-dir /data/models/Meta-Llama-3-8B-Instruct

# 下载数据集
huggingface-cli download \
  --repo-type dataset \
  sayakpaul/coco-30-val-2014 \
  --resume-download \
  --local-dir /data/datasets/coco-30-val-2014 \
  --local-dir-use-symlinks False
```

这种写法更适合后面复制到脚本里，也更方便排查路径问题。

---

## 七、`Git LFS` 作为备选方案

除了 `huggingface-cli`，还有一种方法是使用 `Git LFS` 拉取 Hugging Face 仓库。

有时候使用 `huggingface-cli` 可能会出现类似下面这种报错：

```text
RuntimeError: Data processing error: CAS service error : Error : single flight error: Real call failed: CasObjectError(InternalIOError(Custom { kind: Other, error: reqwest::Error 
{ kind: Decode, source: hyper::Error(Body, Os { code: 104, kind: ConnectionReset, message: "Connection reset by peer" }) } }))
```

这时候可以试试 `Git LFS`。

### 1. 安装与初始化

```bash
# 切换conda环境
conda activate xxx

# 使用 Conda 安装 git-lfs 
conda install -c conda-forge git-lfs

# 初始化 git-lfs
git lfs install

# 下载huggingface目标库的所有内容到本地
git lfs clone https://huggingface.co/distilbert-base-uncased

# 增量更新（万一后续目标库作者更新了仓库，运行此命令可以更新本地之前下载的内容）
git lfs pull
```

### 2. `Git LFS` 的原理简单理解

`Git LFS` 不会把大文件本体直接塞进 Git 历史里，而是在仓库中保存一个指针文件，真正的大文件内容放在专门的 LFS 存储服务中。你在执行 clone 或 pull 时，LFS 再把大文件拉到本地。

这样做的好处是：

- 适合管理大文件仓库
- 某些场景下比 CLI 更稳定
- 对于熟悉 Git 工作流的人比较顺手

但它也有明显缺点，尤其在下载大模型时更要小心。

---

## 八、为什么我通常不推荐用 `git lfs clone` 下载大模型

虽然 `Git LFS` 能解决一部分下载问题，但对于很多模型仓库，它并不是最省心的方案。

原因主要有这几个：

- `clone` 会带来额外的 `.git` 元信息目录
- 某些仓库存在历史版本，会增加下载时间和磁盘占用
- 模型文件本体和 Git 元数据叠加后，整体空间开销会更大
- 对于只想“拿到文件就走”的用户来说，Git 工作流本身有点重

所以如果只是为了把模型或数据集下载到本地直接使用，**优先推荐 `huggingface-cli download`**。只有在 CLI 多次失败，或者你确实需要 Git 方式维护仓库内容时，再考虑 `Git LFS`。

---

## 九、常见问题

### 1. 下载时一直连不上

先检查是否配置了镜像：

```bash
echo $HF_ENDPOINT
```

如果你在 Windows PowerShell：

```powershell
echo $env:HF_ENDPOINT
```

### 2. 明明有仓库名，还是提示没有权限

这种情况通常不是命令写错，而是：

- 你没登录账号
- 目标模型需要申请访问权限
- Token 权限不够

先执行：

```bash
huggingface-cli whoami
```

确认当前登录状态。

### 3. 下载中断后要不要重头再来

一般不需要。只要用了 `--resume-download`，重新执行原命令即可继续。

### 4. 下载数据集时路径不对或者没有文件

先确认是否写了：

```bash
--repo-type dataset
```

很多人第一次下数据集时，漏掉的就是这个参数。

---

## 十、总结

如果你只是想把 Hugging Face 上的模型或数据集稳定下载到本地，最推荐的路线其实很简单：

1. 安装 `huggingface_hub`
2. 视网络情况配置 `HF_ENDPOINT`
3. 需要权限时先 `huggingface-cli login`
4. 用 `huggingface-cli download` 配合 `--resume-download` 进行下载

`Git LFS` 可以作为备选，但不建议默认拿它当第一方案。尤其是大模型仓库，能用 CLI 解决就尽量先用 CLI，省空间，也省时间。

如果你后面还要在服务器上反复拉模型、切环境、做自动化脚本，这套流程基本够用了。踩坑少一点，训练就能早一点开始，大家都开心。

---

## 参考资料

- [Hugging Face Hub 官方文档](https://huggingface.co/docs/huggingface_hub/index)
- [如何在 huggingface 下载模型 / 数据集到本地](https://www.cnblogs.com/ggyt/p/18719220)
