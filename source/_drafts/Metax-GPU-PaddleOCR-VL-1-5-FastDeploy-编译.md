---
title: Metax GPU + PaddleOCR-VL-1.5 + FastDeploy 编译
categories:
	- 进击的码农
date: 2026-04-08
tags:
	- FastDeploy
	- PaddleOCR
	- 环境配置
	- 百度黑客松打卡
---

# Metax GPU + PaddleOCR-VL-1.5 + FastDeploy 编译打卡记录

百度黑客松打卡任务:

在 MetaX GPU 环境下完成 FastDeploy 编译打卡的完整流程，目标是一次性跑通：依赖安装、源码编译、wheel 安装、结果截图和邮件提交。

---

## 环境信息

- 算力平台：[Gitee AI 算力广场](https://ai.gitee.com/compute)
- 机型：曦云 C500 单卡 64G instance
- 推荐镜像：`Pytorch/2.6.0/Python 3.10/maca 3.2.1.3`
- 算力券活动页：[https://developer.metax-tech.com/activities/4](https://developer.metax-tech.com/activities/4)

---

## 执行步骤

### 1. 安装 Paddle 与 MetaX 相关依赖

```bash
    pip install paddlepaddle==3.4.0.dev20251223 -i https://www.paddlepaddle.org.cn/packages/nightly/cpu/
    pip install paddle-metax-gpu==3.3.0.dev20251224 -i https://www.paddlepaddle.org.cn/packages/nightly/maca/
    python -m pip install -U "paddleocr[doc-parser]"
    pip install opencv-contrib-python-headless==4.10.0.84
```

**依赖速览**

- `paddlepaddle`：飞桨框架本体，负责模型计算与执行。
- `paddle-metax-gpu`：MetaX GPU 后端适配，让模型真正跑在 MetaX 显卡上。
- `paddleocr[doc-parser]`：OCR 与文档解析能力包，用于文档理解任务。
- `opencv-contrib-python-headless`：服务器端图像处理库（无 GUI），用于预处理和后处理。

### 2. 获取 FastDeploy 源码并切换分支

```bash
git clone https://gitee.com/paddlepaddle/FastDeploy.git
cd FastDeploy
git checkout release/2.5
```

### 3. 配置编译环境变量

建议把下面内容保存为 `env_metax.sh`，然后执行 `source env_metax.sh`。

```bash
#!/bin/sh
export MACA_PATH=/opt/maca

if [ ! -d ${HOME}/cu-bridge ]; then
	${MACA_PATH}/tools/cu-bridge/tools/pre_make
fi

export CUCC_PATH=/opt/maca/tools/cu-bridge
export CUCC_CMAKE_ENTRY=2
export CUDA_PATH=${HOME}/cu-bridge/CUDA_DIR
export PATH=${CUDA_PATH}/bin:${MACA_PATH}/mxgpu_llvm/bin:${MACA_PATH}/bin:${CUCC_PATH}/tools:${CUCC_PATH}/bin:${PATH}
export LD_LIBRARY_PATH=${CUDA_PATH}/lib64:${MACA_PATH}/lib:${MACA_PATH}/mxgpu_llvm/lib:$LD_LIBRARY_PATH
export MACA_VISIBLE_DEVICES="0"
export PADDLE_XCCL_BACKEND=metax_gpu
export FLAGS_weight_only_linear_arch=80
export FD_MOE_BACKEND=cutlass
export ENABLE_V1_KVCACHE_SCHEDULER=1
export FD_ENC_DEC_BLOCK_NUM=2
export FD_SAMPLING_CLASS=rejection
```

### 4. 执行编译

```bash
source env_metax.sh
bash build.sh
```

预期产物在 `~/fastdeploy/dist`（或你的 build 脚本指定目录）。

### 5. 安装编译出的 wheel 包

```bash
cd ~/fastdeploy/dist
pip install *.whl
```

---

## 命令总览

下面这个代码块汇总了本次打卡会用到的主要命令，可以直接复制执行。

```md
# 1) 安装依赖
pip install paddlepaddle==3.4.0.dev20251223 -i https://www.paddlepaddle.org.cn/packages/nightly/cpu/
pip install paddle-metax-gpu==3.3.0.dev20251224 -i https://www.paddlepaddle.org.cn/packages/nightly/maca/
python -m pip install -U "paddleocr[doc-parser]"
pip install opencv-contrib-python-headless==4.10.0.84

# 2) 下载源码并切换分支
git clone https://gitee.com/paddlepaddle/FastDeploy.git
cd FastDeploy
git checkout release/2.5

# 3) 创建环境脚本（示例名：env_metax.sh）
cat > env_metax.sh << 'EOF'
#!/bin/sh
export MACA_PATH=/opt/maca

if [ ! -d ${HOME}/cu-bridge ]; then
	${MACA_PATH}/tools/cu-bridge/tools/pre_make
fi

export CUCC_PATH=/opt/maca/tools/cu-bridge
export CUCC_CMAKE_ENTRY=2
export CUDA_PATH=${HOME}/cu-bridge/CUDA_DIR
export PATH=${CUDA_PATH}/bin:${MACA_PATH}/mxgpu_llvm/bin:${MACA_PATH}/bin:${CUCC_PATH}/tools:${CUCC_PATH}/bin:${PATH}
export LD_LIBRARY_PATH=${CUDA_PATH}/lib64:${MACA_PATH}/lib:${MACA_PATH}/mxgpu_llvm/lib:$LD_LIBRARY_PATH
export MACA_VISIBLE_DEVICES="0"
export PADDLE_XCCL_BACKEND=metax_gpu
export FLAGS_weight_only_linear_arch=80
export FD_MOE_BACKEND=cutlass
export ENABLE_V1_KVCACHE_SCHEDULER=1
export FD_ENC_DEC_BLOCK_NUM=2
export FD_SAMPLING_CLASS=rejection
EOF

# 4) 执行编译
source env_metax.sh
bash build.sh

# 5) 安装编译产物
cd ~/fastdeploy/dist
pip install *.whl
```
