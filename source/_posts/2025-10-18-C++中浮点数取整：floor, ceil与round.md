好的，明白了 Hexo 博客文章的格式要求。这篇博客文章将专注于 C++ 中的向上和向下取整，并澄清与四舍五入的区别。

```markdown
---
title: 2025-10-18-C++中浮点数取整：floor, ceil与round
date: 2025-10-18
tags:
    - 算法学习
---

# 参考资料

> - [std::floor - cppreference](https://en.cppreference.com/w/cpp/numeric/math/floor)
> - [std::ceil - cppreference](https://en.cppreference.com/w/cpp/numeric/math/ceil)
> - [std::round - cppreference](https://en.cppreference.com/w/cpp/numeric/math/round)
> - [C++ 四舍五入、向下取整、向上取整、截断取整 - 知乎](https://zhuanlan.zhihu.com/p/63353457)

---

## C++ 中浮点数取整：`floor`, `ceil` 与 `round`

在 C++ 编程中，我们经常需要对浮点数进行取整操作。但取整并非简单地抹去小数部分，它根据不同的规则分为向下取整、向上取整和四舍五入等。理解这些操作的含义、C++ 中的实现方式以及潜在的“坑”，对于编写健壮的数值计算代码至关重要。

本文将详细探讨 C++ 标准库 `<cmath>` (在 C 语言中是 `<math.h>`) 中提供的 `floor()`、`ceil()` 和 `round()` 函数。

### 1. 理解取整的种类

在开始之前，我们先统一一下对不同取整方式的理解。想象一条数轴，这会帮助我们直观地理解这些概念：

#### 1.1 向下取整 (Floor)

向下取整意味着将一个数“掰”到它**左边最近的那个整数**。无论正负，结果都朝**负无穷大**的方向靠近。

*   `floor(3.7)` 结果是 `3.0`
*   `floor(3.0)` 结果是 `3.0`
*   `floor(-3.7)` 结果是 `-4.0` (因为 -4 在 -3.7 的左边)
*   `floor(-3.0)` 结果是 `-3.0`

#### 1.2 向上取整 (Ceiling)

向上取整意味着将一个数“掰”到它**右边最近的那个整数**。无论正负，结果都朝**正无穷大**的方向靠近。

*   `ceil(3.2)` 结果是 `4.0`
*   `ceil(3.0)` 结果是 `3.0`
*   `ceil(-3.2)` 结果是 `-3.0` (因为 -3 在 -3.2 的右边)
*   `ceil(-3.0)` 结果是 `-3.0`

#### 1.3 四舍五入 (Rounding)

四舍五入是最常见的取整方式，它将一个数取整到**最近的整数**。当小数部分恰好是 `.5` 时，通常会遵循“远离零”的规则 (或者在某些语境下是“向偶数靠拢”的规则，但 `std::round` 遵循的是远离零)。

*   `round(3.7)` 结果是 `4.0`
*   `round(3.2)` 结果是 `3.0`
*   `round(3.5)` 结果是 `4.0` (远离零)
*   `round(-3.7)` 结果是 `-4.0`
*   `round(-3.2)` 结果是 `-3.0`
*   `round(-3.5)` 结果是 `-4.0` (远离零)

### 2. C++ 中的实现方法

C++ 标准库在 `<cmath>` (对于 C 语言是 `<math.h>`) 中提供了这些函数。

#### 2.1 `std::floor()` - 向下取整

```cpp
#include <iostream>
#include <cmath> // 包含 floor 函数

int main() {
    double x1 = 3.7;
    double x2 = -3.7;
    double x3 = 3.0;

    std::cout << "std::floor(" << x1 << ") = " << std::floor(x1) << std::endl; // 输出 3.0
    std::cout << "std::floor(" << x2 << ") = " << std::floor(x2) << std::endl; // 输出 -4.0
    std::cout << "std::floor(" << x3 << ") = " << std::floor(x3) << std::endl; // 输出 3.0

    // 如果需要整数类型的结果，需要强制类型转换
    int result_int = static_cast<int>(std::floor(x1));
    std::cout << "static_cast<int>(std::floor(" << x1 << ")) = " << result_int << std::endl; // 输出 3

    return 0;
}
```

#### 2.2 `std::ceil()` - 向上取整

```cpp
#include <iostream>
#include <cmath> // 包含 ceil 函数

int main() {
    double x1 = 3.2;
    double x2 = -3.2;
    double x3 = 3.0;

    std::cout << "std::ceil(" << x1 << ") = " << std::ceil(x1) << std::endl; // 输出 4.0
    std::cout << "std::ceil(" << x2 << ") = " << std::ceil(x2) << std::endl; // 输出 -3.0
    std::cout << "std::ceil(" << x3 << ") = " << std::ceil(x3) << std::endl; // 输出 3.0

    // 如果需要整数类型的结果，需要强制类型转换
    int result_int = static_cast<int>(std::ceil(x1));
    std::cout << "static_cast<int>(std::ceil(" << x1 << ")) = " << result_int << std::endl; // 输出 4

    return 0;
}
```

#### 2.3 `std::round()` - 四舍五入

从 C++11 (以及 C99) 开始，标准库提供了 `std::round()` 函数来实现标准的四舍五入。它通常遵循“远离零”的规则。

```cpp
#include <iostream>
#include <cmath> // 包含 round 函数

int main() {
    double x1 = 3.7;
    double x2 = 3.2;
    double x3 = 3.5;
    double x4 = -3.7;
    double x5 = -3.2;
    double x6 = -3.5;

    std::cout << "std::round(" << x1 << ") = " << std::round(x1) << std::endl; // 输出 4.0
    std::cout << "std::round(" << x2 << ") = " << std::round(x2) << std::endl; // 输出 3.0
    std::cout << "std::round(" << x3 << ") = " << std::round(x3) << std::endl; // 输出 4.0 (远离零)
    std::cout << "std::round(" << x4 << ") = " << std::round(x4) << std::endl; // 输出 -4.0
    std::cout << "std::round(" << x5 << ") = " << std::round(x5) << std::endl; // 输出 -3.0
    std::cout << "std::round(" << x6 << ") = " << std::round(x6) << std::endl; // 输出 -4.0 (远离零)

    return 0;
}
```

**【历史遗留与混淆点】**
你可能听说过“C 语言中用 `x + 0.5` 再 `floor` 来四舍五入”这种说法。这确实是一种常见的**实现四舍五入**的技巧，尤其是针对正数。但请注意，它实现的不是向上取整，而是四舍五入。且对于负数 `.5` 的处理（例如 `floor(-3.5 + 0.5) = floor(-3.0) = -3`），可能与 `std::round` 的“远离零”规则（`round(-3.5) = -4.0`）有所不同。因此，推荐使用 `std::round()` 进行四舍五入，以避免混淆和不一致的行为。

### 3. 注意事项与潜在问题

#### 3.1 返回类型是浮点数

`std::floor()`, `std::ceil()`, `std::round()` 都接受浮点数（`double`、`float`、`long double`）作为输入，并**返回一个浮点数类型的结果**。即使结果是一个整数（例如 `ceil(3.0)` 返回 `3.0`），它仍然是 `double` 类型。

如果你需要一个 `int` 或 `long long` 类型的整数结果，务必进行**强制类型转换**：
`int result_int = static_cast<int>(std::ceil(value));`

#### 3.2 负数的表现

这是最容易出错的地方。请再次回顾数轴的概念：
*   `floor` 总是向左（负无穷大）取整。
*   `ceil` 总是向右（正无穷大）取整。
*   `round` 总是取到最近的整数， `.5` 边界则远离零。

确保你完全理解它们在处理负数时的行为，这与我们日常生活中对“向上/向下”的直觉可能不同。

#### 3.3 浮点数精度问题

浮点数计算的精度问题是所有数值处理的“老大难”。由于浮点数在计算机中的表示方式，某些小数可能无法精确表示，从而导致一些意想不到的结果。

例如，`10.0 / 3.0` 可能不是精确的 `3.333...`，而可能是 `3.3333333333333335`。
*   如果一个数理论上是 `3.0`，但由于精度问题变成了 `2.9999999999999999`：
    *   `ceil(2.9999999999999999)` 可能会得到 `3.0` (通常是期望的)。
    *   `floor(2.9999999999999999)` 可能会得到 `2.0` (这可能不是你想要的)。
*   如果一个数理论上是 `3.0`，但由于精度问题变成了 `3.0000000000000001`：
    *   `ceil(3.0000000000000001)` 可能会得到 `4.0` (这可能不是你想要的)。
    *   `floor(3.0000000000000001)` 可能会得到 `3.0` (通常是期望的)。

**应对策略：**

1.  **尽量使用整数运算：** 如果你的计算涉及到整数之间的除法，并且需要向上取整，**强烈建议使用整数运算的技巧来避免浮点数精度问题**。
    *   对于 `a / b` (其中 `a`, `b` 均为整数，且 `b > 0`) 的向上取整，可以写成：
        `int result_ceil_int = (a + b - 1) / b;`
    *   这个技巧只适用于 `a >= 0`。如果 `a` 可能是负数，情况会更复杂，需要单独处理。
2.  **避免对非常接近整数的浮点数进行 `ceil/floor` 操作**，除非你对精度有充分的把握或可以接受潜在误差。
3.  **使用一个极小的偏移量 (epsilon) 辅助判断**：在某些场景下，可以通过 `x + epsilon` 或 `x - epsilon` 来微调浮点数，以避免临界值附近的精度误差，但这种方法需要谨慎使用，并且 `epsilon` 的选择非常关键。例如，`ceil(x - 1e-9)` 试图将略大于整数的数拉回，但可能会影响正常的小数。

### 4. 总结

`std::floor()`, `std::ceil()`, `std::round()` 是 C++ 中处理浮点数取整的强大工具。掌握它们的含义、用法和潜在的精度问题，是编写正确、高效数值计算代码的基础。在实际编程中，根据具体需求选择合适的取整方式，并时刻警惕浮点数精度带来的挑战，尤其在算法竞赛和科学计算中，这些细节往往决定了程序的正确性。

---
```