---
title: {{title}}
categories:
  - 算法蒟蒻的成长记录
  - {{category-extra}}
date: {{date}}
tags:
{{#tags}}
  - {{.}}
{{/tags}}
---

## 题目信息
- 平台：{{platform}}
- 题目：{{problem-number}}. {{problem-name}}
- 难度：{{difficulty}}
- 题目链接：[{{problem-name}}]({{link}})

---

## 题目描述
{{description}}

---

## 初步思路
{{initial-idea}}

---

## 算法分析
- 核心思想：{{core-idea}}
- 技巧要点：{{tricks}}
- 时间复杂度：{{time-complexity}}
- 空间复杂度：{{space-complexity}}

---

## 代码实现

以下给出 {{language-list}} 五种语言的实现，逻辑完全一致。切换上方的标签即可对比。

```cpp
{{code-cpp}}
```

```python
{{code-python}}
```

```java
{{code-java}}
```

```go
{{code-go}}
```

```rust
{{code-rust}}
```

---

## 测试用例
| 输入 | 输出 | 说明 |
|------|------|------|
{{#test-cases}}
| {{input}} | {{output}} | {{description}} |
{{/test-cases}}

---

## 总结与反思
{{summary}}
