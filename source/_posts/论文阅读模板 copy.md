---
title: 2026-01-19-论文阅读-MoKA: Multimodal Low-Rank Adaptation for MLLMs
date: 2026-01-19 11:33:49
categories: 
    - Papers pile or pie?
tags:
    - 多模态
    - MLLM
---

一、论文基本信息
- 标题:《MokA: Multimodal Low-Rank Adaptation for MLLMs》
- 原文链接:[https://arxiv.org/abs/2610.12345](https://arxiv.org/abs/2610.12345)
- 项目主页:[https://gewu-lab.github.io/MokA](https://link.zhihu.com/?target=https%3A//gewu-lab.github.io/MokA)
- 作者:Team AgiBot-World∗
关键词:具身智能,ViLLA,人机协作,通用机器人
二、研究背景与问题定义


三、核心方法 / 模型 / 系统设计

四、实验

Baseline

核心实验结果与发现
实验结果主要回答X个问题:
A. ?
- 回答: 
- 数据: 
- 分析: 
B. ?
- 回答: 
- 数据: 
- 分析: 
C. 
- 
- 
五、创新点与改进空间
创新点
- 
- 
改进空间

- 
六、我的思考
- 
- 
可以跟进的内容




## 简介

人类天生拥有处理多种感官信息的能力，尤其在复杂的多模态场景中，能够灵活地结合听觉、视觉与语言线索进行理解和推理。近年来，伴随[多模态大模型](https://zhida.zhihu.com/search?content_id=265657807&content_type=Article&match_order=1&q=%E5%A4%9A%E6%A8%A1%E6%80%81%E5%A4%A7%E6%A8%A1%E5%9E%8B&zhida_source=entity)（MLLMs）的兴起，已经在视觉语言、音频语言等任务上取得了巨大进展。然而，当在多模态下游任务进行微调时，当前主流的多模态微调方法大多直接沿用了在纯文本大语言模型（LLMs）上发展出的微调策略，比如 [LoRA](https://zhida.zhihu.com/search?content_id=265657807&content_type=Article&match_order=1&q=LoRA&zhida_source=entity)。但这种“照搬”策略，真的适用于多模态模型吗？

本实验室联合上海 ai lab给出了一种全新的思考方式。我们发现：当下MLLMs微调方案大多简单的将单模态策略迁移至多模态场景，未结合多模态学习特性进行深入思考。事实上，在多模态场景中，单模态信息的独立建模（[Unimodal Adaptation](https://zhida.zhihu.com/search?content_id=265657807&content_type=Article&match_order=1&q=Unimodal+Adaptation&zhida_source=entity)）和模态之间的交互建模（[Cross-modal Adaptation](https://zhida.zhihu.com/search?content_id=265657807&content_type=Article&match_order=1&q=Cross-modal+Adaptation&zhida_source=entity)）是同等重要的，但当前的微调范式往往没有并重地显式考量前者，导致对单模态，尤其是非文本模态的利用存在潜在局限性。

为此，我们提出了 MokA（Multimodal low-rank Adaptation）方法。这一方法在保留 LoRA 核心思想的基础上，重新设计了低秩矩阵 A 和 B 的作用：通过为每个模态定制独立的 A 矩阵，模型能够有效压缩和提取各自模态的关键信息；同时，引入跨模态注意力机制，使得非文本模态能够主动融合与任务相关的文本语义；最后，通过共享的 B 矩阵完成模态间的对齐，既保留了模态特征，又强化了模态融合。实验覆盖音频-视觉-文本、视觉-文本、语音-文本三大代表性场景，并在 [LLaMA](https://zhida.zhihu.com/search?content_id=265657807&content_type=Article&match_order=1&q=LLaMA&zhida_source=entity)、[Qwen](https://zhida.zhihu.com/search?content_id=265657807&content_type=Article&match_order=1&q=Qwen&zhida_source=entity) 等主流 LLM 基座上进行了系统评估。结果如图1所示，MokA 在多个 benchmark上显著提升了任务表现。目前该论文已被NeurIPS 2025 接收，并入选为**Oral Presentation**.

![](https://pic1.zhimg.com/v2-921ad040035a7de3b18124b22f36b4cc_1440w.jpg)

图1: 本文提出的MokA在多基座、多场景下均实现了明显的性能提升.

## 当下被忽略的模态特性

我们指出：当前多数高效多模态微调方法存在一个关键性限制：它们直接借鉴自单模态的大语言模型的设计。以LoRA为例，如下公式所示，在多模态场景中，直接应用LoRA将会使得同样的可学习参数W被用于同时处理和适配来自不同模态的输入x。其中，代表第i个模态的输入。

![](https://pic2.zhimg.com/v2-3ccbff187d5e95c2c6e03e2b69b7a6e3_1440w.jpg)

而在真实场景中，不同模态的信息存在异质性。因此，这种直接“照搬”单模态微调方法的实践忽视多模态场景中模态之间的本质差异，可能导致模型难以充分利用所有模态的信息。基于此，我们提出，要高效地微调多模态大模型，单模态信息的独立建模（Unimodal Adaptation）和模态之间的交互建模（Cross-modal Adaptation）缺一不可：

**![](https://pic2.zhimg.com/v2-592e38a4e230826a10b20f1576cc8221_1440w.jpg)

**

如上公式所示意，既需要单模态独有参数保证单模态信息适配不受其他模态干扰，同时也需要跨模态参数对模态间交互对齐进行适配建模。

## **MokA：关注模态特性的多模态微调方法**

基于以上思想，我们提出了MokA方法，兼顾单模态信息的独立建模和模态之间的交互建模。MokA在结构上继承了LoRA的核心思想，以保持高效的优点。但基于多模态场景对于A、B投影矩阵的角色进行了重新定义。如图2所示，MokA包括三个关键模块：模态特异的A矩阵，跨模态注意力机制和模态共享的B矩阵。

![](https://pica.zhimg.com/v2-961a5998c15401db06889210b0fae472_1440w.jpg)

图2: 我们提出的MokA的结构

***模态特异的A矩阵**：* MokA考虑多模态场景，使用模态特异的 A 矩阵，从而可以在参数空间中保留模态独立性，确保每种模态的信息压缩过程不会互相干扰，是实现单模态信息独立建模的关键一步。

***跨模态注意力机制**：*这一模块的主要目的是显式增强跨模态之间的交互。在进行instruction tuning时，通常文本信息包含了具体的问题或任务描述，而其他模态信息提供了回答问题的场景。因此，为了显式加强跨模态交互，MokA在独立压缩后的低秩空间内对文本和非文本模态之间进行了跨模态建模，加强任务和场景间的关联关系。

***模态共享的B矩阵**：*最后，在独立子空间中的各个模态被统一投影到一个共享空间中，利用一个共享的低秩矩阵 B 进行融合，以共享参数的方式进一步隐式实现跨模态对齐。

![](https://pic1.zhimg.com/v2-388de1ad87466e2dd71af584564c99e4_1440w.jpg)

最终，MokA的形式化表达如上所示。在多模态场景下，MokA有效保证了对单模态信息的独立建模和模态之间的交互建模。

## **实验结果**

实验在三个具有代表性的多模态任务场景上进行了评估，分别包括音频-视觉-文本、视觉-文本以及语音-文本。同时，在多个主流语言模型基座（如 LLaMA 系列与 Qwen 系列）上系统地验证了方法的适用性。结果表明，MokA 在多个标准评测数据集上均取得了显著的性能提升，展现出良好的通用性与有效性。*更多的实验结果请参考原论文。*

![](https://pic1.zhimg.com/v2-992a7ad8a9d8c0d352d379081fa8c5aa_1440w.jpg)

表1: 在音频-视觉-文本的实验结果。

  

![](https://pica.zhimg.com/v2-b63f027b31db82f62ed2c2e803ea1800_1440w.jpg)

表2: 在视觉-文本场景的实验结果。

  

![](https://pic2.zhimg.com/v2-4baafdc420355e9803d9a50fa0046411_1440w.jpg)

表3：在语音-文本场景的实验结果。

## 总结

综上所述，MokA作为一种面向多模态大模型的高效微调方法，兼顾了单模态特性建模与模态间交互建模的双重需求，克服了对模态差异性的忽视问题。在保留LoRA参数高效优势的基础上，MokA通过模态特异A矩阵、跨模态注意力机制与共享B矩阵协同工作，实现了有效的多模态微调。实验验证表明，MokA在多个任务和模型基座上均取得显著性能提升，展现适应性和推广潜力，为多模态大模型的微调范式提供了新的方向。
