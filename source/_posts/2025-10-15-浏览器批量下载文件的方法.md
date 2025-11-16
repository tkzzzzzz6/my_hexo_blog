---
title: 2025-10-15-python列表推导式与map函数
date: 2025-10-15
tags: 
    课程学习
---

# 2025-10-15-python列表推导式与map函数

## map函数 vs 列表推导式

## 1. map函数

### 基本语法
```python
map(function, iterable, ...)
```

### 使用方法
```python
# 将字符串列表转换为整数列表
str_list = ["1", "2", "3", "4"]
int_list = list(map(int, str_list))
print(int_list)  # [1, 2, 3, 4]

# 多个可迭代对象
nums1 = [1, 2, 3]
nums2 = [4, 5, 6]
result = list(map(lambda x, y: x + y, nums1, nums2))
print(result)  # [5, 7, 9]

# 在输入处理中的应用
a, b = map(int, input().split())  # 输入 "10 20"
print(a, b)  # 10 20
```

### map函数的特点
- **惰性求值**：返回的是迭代器，不是列表
- **需要显式转换**：通常需要用 `list()` 转换为列表
- **函数式编程风格**：更函数式，更简洁

## 2. 列表推导式

### 基本语法
```python
[expression for item in iterable if condition]
```

### 使用方法
```python
# 将字符串列表转换为整数列表
str_list = ["1", "2", "3", "4"]
int_list = [int(x) for x in str_list]
print(int_list)  # [1, 2, 3, 4]

# 带条件的转换
numbers = ["1", "2", "a", "3", "b"]
int_list = [int(x) for x in numbers if x.isdigit()]
print(int_list)  # [1, 2, 3]

# 多个变量的情况
a, b = [int(x) for x in input().split()]  # 输入 "10 20"
print(a, b)  # 10 20
```

### 列表推导式的特点
- **立即求值**：直接返回列表
- **更Pythonic**：被认为是更符合Python风格的写法
- **功能更强大**：可以包含条件判断

## 3. 对比示例

### 相同的功能，不同的写法
```python
# 将字符串列表转换为整数
strings = ["1", "2", "3", "4"]

# 使用map
result1 = list(map(int, strings))

# 使用列表推导式
result2 = [int(x) for x in strings]

print(result1)  # [1, 2, 3, 4]
print(result2)  # [1, 2, 3, 4]
```

### 性能对比
```python
import time

data = [str(i) for i in range(1000000)]

# map函数
start = time.time()
result1 = list(map(int, data))
time1 = time.time() - start

# 列表推导式
start = time.time()
result2 = [int(x) for x in data]
time2 = time.time() - start

print(f"map 用时: {time1:.4f}秒")
print(f"列表推导式 用时: {time2:.4f}秒")
```

## 4. 实际应用场景

### 适合使用map的情况
```python
# 简单的类型转换
numbers = list(map(float, ["1.1", "2.2", "3.3"]))

# 使用内置函数
words = ["hello", "world"]
lengths = list(map(len, words))

# 函数式编程场景
def square(x):
    return x ** 2

squares = list(map(square, [1, 2, 3, 4]))
```

### 适合使用列表推导式的情况
```python
# 需要条件过滤
numbers = [int(x) for x in input().split() if x.isdigit()]

# 复杂的表达式
result = [x**2 for x in range(10) if x % 2 == 0]

# 嵌套循环
pairs = [(x, y) for x in range(3) for y in range(3)]
```

## 5. 在输入处理中的具体应用

```python
# 读取多个数字
# 输入: "1 2 3 4 5"
data = list(map(int, input().split()))
# 或者
data = [int(x) for x in input().split()]

# 读取多行数据
n = int(input())
numbers = []
for _ in range(n):
    # 两种写法都可以
    # a, b = map(int, input().split())
    a, b = [int(x) for x in input().split()]
    numbers.append((a, b))
```

## 6. 选择建议

- **简单转换**：两者都可以，看个人喜好
- **需要条件过滤**：优先选择列表推导式
- **函数式编程**：优先选择map
- **可读性**：列表推导式通常更易读
- **性能**：在大多数情况下差异不大，map稍快一些
