---
title: 2025-10-24-Google Drive 命令行下载文件完整指南
date: 2025-10-24
categories: 
  - 进击的码农  
tags: 问题解决
---

# Google Drive 命令行下载文件完整指南

# 参考资料

> - [用命令行下载Google Drive文件的方法 - CSDN](https://blog.csdn.net/lzq6261/article/details/130032780)
> - [Download from Google Drive - lccurious](https://lccurious.github.io/2021/05/15/Download-from-Google-Drive/)
> - [gdown - GitHub Repository](https://github.com/wkentaro/gdown)
> - [Google Drive命令行下载文件 - 知乎](https://zhuanlan.zhihu.com/p/668161595)
> - [Google Drive API Documentation](https://developers.google.com/drive/api/v3/about-sdk)

## 前言

在进行深度学习或数据分析时，我们经常需要从 Google Drive 下载大型数据集和预训练模型。然而，直接通过浏览器下载存在以下问题：

- 下载速度慢，容易中断
- 大文件下载不稳定
- 无法在服务器端直接下载
- 断点续传支持差

本文介绍两种在 Linux 命令行环境下高效下载 Google Drive 文件的方法，经过实践验证，均可稳定使用。

## 前置要求

⚠️ **重要提示**：由于网络限制，访问 Google Drive 需要科学上网工具。确保你的服务器或本地环境已配置好代理。

### 配置代理（如果需要）
```bash
# 设置代理环境变量
export http_proxy=http://127.0.0.1:20171
export https_proxy=http://127.0.0.1:20171
export all_proxy=socks5://127.0.0.1:20170
```

## 方法一：使用 wget 下载文件

### 适用场景

- ✅ 下载单个文件
- ❌ 不支持下载文件夹
- ✅ 适合脚本自动化

### 获取文件 ID

首先需要从 Google Drive 分享链接中获取 `fileid`。

分享链接格式：
```
https://drive.google.com/file/d/FILE_ID/view?usp=sharing
```

其中 `FILE_ID` 就是我们需要的 `fileid`。

### 下载脚本
```bash
#!/bin/bash

# 切换到目标目录
cd data/

# 设置文件信息
filename='OfficeHomeDataset_10072016.zip'
fileid='0B81rNlvomiwed0V1YUxQdC1uOTg'

# 下载文件
wget --load-cookies /tmp/cookies.txt \
  "https://drive.google.com/uc?export=download&confirm=$(wget --quiet --save-cookies /tmp/cookies.txt --keep-session-cookies --no-check-certificate 'https://drive.google.com/uc?export=download&id=${fileid}' -O- | sed -rn 's/.*confirm=([0-9A-Za-z_]+).*/\1\n/p')&id=${fileid}" \
  -O ${filename} && rm -rf /tmp/cookies.txt

# 解压文件
unzip -q ${filename}

# 删除压缩包
rm ${filename}

echo "下载完成！"
```

### 命令解析
```bash
# 1. 保存 cookies 到临时文件
--save-cookies /tmp/cookies.txt

# 2. 保持 session cookies
--keep-session-cookies

# 3. 不检查证书（避免 SSL 错误）
--no-check-certificate

# 4. 提取确认码
sed -rn 's/.*confirm=([0-9A-Za-z_]+).*/\1\n/p'

# 5. 输出到指定文件
-O ${filename}

# 6. 清理临时 cookies
rm -rf /tmp/cookies.txt
```

### 示例：下载单个文件
```bash
# 替换为你的文件信息
filename='my_dataset.zip'
fileid='YOUR_FILE_ID_HERE'

wget --load-cookies /tmp/cookies.txt \
  "https://drive.google.com/uc?export=download&confirm=$(wget --quiet --save-cookies /tmp/cookies.txt --keep-session-cookies --no-check-certificate 'https://drive.google.com/uc?export=download&id=${fileid}' -O- | sed -rn 's/.*confirm=([0-9A-Za-z_]+).*/\1\n/p')&id=${fileid}" \
  -O ${filename} && rm -rf /tmp/cookies.txt
```

## 方法二：使用 gdown 下载（推荐）

### 适用场景

- ✅ 下载单个文件
- ✅ 下载整个文件夹
- ✅ 使用简单，命令清晰
- ✅ 支持断点续传

### 安装 gdown
```bash
# 使用 pip 安装
pip install gdown

# 或指定版本
pip install gdown==4.7.1

# 升级到最新版本
pip install --upgrade gdown
```

### 版本说明

**重要**：不同版本的 gdown 使用方式略有不同。

#### gdown 4.3.1 之前的版本
```bash
# 下载文件（使用 --id 参数）
gdown --no-check-certificate --id FILE_ID

# 下载文件夹
gdown --no-check-certificate --folder https://drive.google.com/drive/folders/FOLDER_ID
```

#### gdown 4.3.1 及之后的版本

从 4.3.1 版本开始，`--id` 参数被废弃，改用直接链接方式。
```bash
# 下载文件（推荐方式）
gdown 'https://drive.google.com/uc?id=FILE_ID'

# 或者使用完整链接
gdown 'https://drive.google.com/file/d/FILE_ID/view?usp=sharing'

# 下载文件夹
gdown --folder 'https://drive.google.com/drive/folders/FOLDER_ID'

# 下载文件夹（不检查证书）
gdown --folder --no-check-certificate 'https://drive.google.com/drive/folders/FOLDER_ID'
```

### 实际使用示例

#### 示例 1：下载单个文件
```bash
# 方式 1：使用 uc 链接
gdown 'https://drive.google.com/uc?id=1A2B3C4D5E6F7G8H9I0J'

# 方式 2：使用分享链接（自动转换）
gdown 'https://drive.google.com/file/d/1A2B3C4D5E6F7G8H9I0J/view?usp=sharing'

# 指定输出文件名
gdown 'https://drive.google.com/uc?id=1A2B3C4D5E6F7G8H9I0J' -O my_model.pth
```

#### 示例 2：下载整个文件夹
```bash
# 下载文件夹（保持目录结构）
gdown --folder 'https://drive.google.com/drive/folders/1A2B3C4D5E6F7G8H9I0J'

# 安静模式（不显示进度条）
gdown --folder --quiet 'https://drive.google.com/drive/folders/1A2B3C4D5E6F7G8H9I0J'

# 指定输出目录
gdown --folder 'https://drive.google.com/drive/folders/1A2B3C4D5E6F7G8H9I0J' -O ./datasets/
```

#### 示例 3：下载大文件（处理病毒扫描警告）

对于大文件（>25MB），Google Drive 会提示病毒扫描警告，gdown 会自动处理：
```bash
# gdown 会自动绕过病毒扫描警告
gdown --fuzzy 'https://drive.google.com/file/d/LARGE_FILE_ID/view?usp=sharing'
```

### 常用参数说明
```bash
# 基本下载
gdown URL

# 常用参数
--no-check-certificate    # 不检查 SSL 证书
--folder                  # 下载文件夹
-O, --output FILE        # 指定输出文件名
--quiet                  # 安静模式，不显示进度
--fuzzy                  # 模糊匹配（处理大文件扫描警告）
--remaining-ok           # 允许部分下载失败
--proxy PROXY            # 指定代理服务器
```

## 实用脚本

### 批量下载脚本
```bash
#!/bin/bash

# 批量下载 Google Drive 文件

# 文件列表（格式：FILE_ID|文件名）
files=(
    "1A2B3C4D5E6F7G8H9I0J|dataset_part1.zip"
    "2B3C4D5E6F7G8H9I0J1K|dataset_part2.zip"
    "3C4D5E6F7G8H9I0J1K2L|pretrained_model.pth"
)

# 创建下载目录
mkdir -p downloads
cd downloads

# 遍历下载
for file in "${files[@]}"; do
    IFS='|' read -r file_id filename <<< "$file"
    echo "正在下载: $filename"
    gdown "https://drive.google.com/uc?id=$file_id" -O "$filename"
    
    if [ $? -eq 0 ]; then
        echo "✓ $filename 下载成功"
    else
        echo "✗ $filename 下载失败"
    fi
    echo "---"
done

echo "所有文件下载完成！"
```

### 带进度显示的下载脚本
```bash
#!/bin/bash

download_from_gdrive() {
    local url=$1
    local output=$2
    
    echo "=========================================="
    echo "开始下载: $output"
    echo "=========================================="
    
    gdown "$url" -O "$output"
    
    if [ $? -eq 0 ]; then
        echo "✓ 下载成功: $output"
        ls -lh "$output"
    else
        echo "✗ 下载失败: $output"
        return 1
    fi
}

# 使用示例
download_from_gdrive \
    'https://drive.google.com/uc?id=YOUR_FILE_ID' \
    'output_filename.zip'
```

## 常见问题及解决方案

### 问题 1：SSL 证书验证失败

**错误信息**：
```
SSL certificate problem: unable to get local issuer certificate
```

**解决方案**：
```bash
# wget 方式
wget --no-check-certificate URL

# gdown 方式
gdown --no-check-certificate URL
```

### 问题 2：文件过大，提示病毒扫描

**错误信息**：
```
Cannot retrieve the public link of the file. You may need to change the permission to 'Anyone with the link'
```

**解决方案**：
```bash
# 使用 --fuzzy 参数
gdown --fuzzy 'https://drive.google.com/file/d/FILE_ID/view'
```

### 问题 3：下载文件夹时权限不足

**错误信息**：
```
Permission denied
```

**解决方案**：
1. 确保 Google Drive 分享设置为"任何拥有链接的人都可以查看"
2. 使用 `--no-check-certificate` 参数
```bash
gdown --folder --no-check-certificate 'FOLDER_URL'
```

### 问题 4：网络连接超时

**解决方案**：
```bash
# 使用代理
export http_proxy=http://proxy_server:port
export https_proxy=http://proxy_server:port

# 或在命令中指定
gdown --proxy http://proxy_server:port URL
```

### 问题 5：gdown 版本不兼容

**解决方案**：
```bash
# 卸载当前版本
pip uninstall gdown

# 安装指定版本
pip install gdown==4.7.1

# 查看版本
gdown --version
```

## 方法对比

| 特性 | wget 方式 | gdown 方式 |
|------|----------|-----------|
| 下载文件 | ✅ 支持 | ✅ 支持 |
| 下载文件夹 | ❌ 不支持 | ✅ 支持 |
| 命令复杂度 | 复杂 | 简单 |
| 断点续传 | ❌ | ✅ |
| 大文件处理 | 一般 | 优秀 |
| 安装要求 | 系统自带 | 需要 pip |
| 推荐指数 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

## 总结

本文介绍了两种从 Google Drive 命令行下载文件的方法：

1. **wget 方式**：适合下载单个文件，命令较复杂，但无需额外安装
2. **gdown 方式**：功能更强大，支持文件和文件夹下载，使用简单，强烈推荐

### 推荐使用场景

- **简单下载**：使用 gdown 的最新版本
- **批量下载**：编写脚本使用 gdown
- **无法安装 pip**：使用 wget 方式

### 最佳实践
```bash
# 1. 安装最新版 gdown
pip install --upgrade gdown

# 2. 配置代理（如需要）
export https_proxy=http://127.0.0.1:20171

# 3. 下载文件
gdown 'https://drive.google.com/uc?id=FILE_ID' -O output.zip

# 4. 下载文件夹
gdown --folder 'https://drive.google.com/drive/folders/FOLDER_ID'
```

希望本文能帮助你高效地从 Google Drive 下载所需资源！

