---
title: 牛客每日一题-k - 路径（easy version）
date: 2026-10-12
categories:
  - 算法蒟蒻的成长记录
  - 牛客
tags:
  - 树形 DP
  - 换根 DP
  - 树
  - 牛客
description: 使用树形 DP 和换根 DP，求每种类型节点参与的最大路径权值。
---

## 题目描述

给定一棵包含 $n$ 个节点的无根树，每个节点有一个类型 $c_i$ 和权值 $w_i$。

一条简单路径的权值是路径上所有节点权值之和。如果一条路径至少经过一个类型为 $k$ 的节点，那么它就是一条 $k$-路径。

对于每个 $k=1,2,\dots,n$，求所有 $k$-路径中的最大权值。如果不存在类型为 $k$ 的节点，输出 $-1$。

### 输入描述

第一行输入测试用例数量 $T$。

每组数据包含：

- 第一行：节点数 $n$；
- 第二行：$n$ 个整数 $c_i$，表示节点类型；
- 第三行：$n$ 个整数 $w_i$，表示节点权值；
- 接下来 $n-1$ 行：每行两个整数 $u,v$，表示树上的一条无向边。

约束：

$$
1\le n\le 10^6,\qquad \sum n\le 10^6
$$

### 输出描述

输出一行 $n$ 个整数，第 $k$ 个数表示所有 $k$-路径的最大权值；如果不存在类型为 $k$ 的节点，输出 $-1$。

---

## 初步思路

如果只求整棵树的最大路径，可以使用树形 DP：枚举每个节点作为路径的最高点，取来自不同子树的两条最大贡献，再加上当前节点权值。

本题的难点在于：需要同时求出每一种类型的答案，而且一条路径中的类型节点可能不是路径的转折点。因此需要在**每一个节点 $u$** 都计算经过它的最大路径，并用当前节点类型更新答案：

$$
ans[c_u]=\max(ans[c_u],\text{经过 }u\text{ 的最大路径权值})
$$

这样，任意一条包含类型 $k$ 节点的路径，都可以在该类型节点处被统计到。

---

## 树形 DP：计算子树方向贡献

以节点 $1$ 为根。定义从节点 $u$ 向其子树方向延伸的贡献：

$$
\text{contribution}(u\to v)=w_v+down_v
$$

其中 $down_v$ 表示从 $v$ 出发、只向 $v$ 的子树方向延伸时能够取得的最大正贡献。如果继续向下不能带来正收益，就选择不延伸，因此初始值为 $0$。

对节点 $u$ 来说，只需要保留所有子节点贡献中的前两大值：

- `mx1[u]`：最大贡献；
- `mx2[u]`：次大贡献。

第一次 DFS 自底向上计算这两个值：

```cpp
mx2[u] = max(mx2[u], w[v] + mx1[v]);
if (mx2[u] > mx1[u]) {
    swap(mx1[u], mx2[u]);
}
```

因为路径经过 $u$ 时，最多只会从 $u$ 向两个不同方向延伸，所以只保留前两大贡献即可。

注意：由于 `mx1`、`mx2` 初始化为 $0$，负贡献会被自动舍弃。这等价于允许路径在当前节点处停止，能够正确处理负权节点。

---

## 换根 DP：补充父节点方向

第一次 DFS 只计算了子树方向，节点 $u$ 还可能通过父节点方向连接到树的其他部分。

第二次 DFS 从根向下传递 `fw`：

- `fw` 表示从节点 $u$ 的父节点方向进入 $u$ 时，除去 $u$ 本身能够获得的最大贡献；
- 将 `fw` 加入当前节点的候选贡献后，重新维护最大的两条贡献；
- 当前节点的最大路径值就是：

$$
path_u=w_u+mx1[u]+mx2[u]
$$

然后更新：

$$
ans[c_u]=\max(ans[c_u],path_u)
$$

### 如何传给子节点

假设当前从 $u$ 走向子节点 $v$，需要把「不经过 $v$ 子树」的最大贡献传给 $v$。

如果 $v$ 对应的贡献是 `mx1[u]`，就不能再次使用它，应改用 `mx2[u]`；否则可以继续使用 `mx1[u]`：

```cpp
w[u] + (w[v] + mx1[v] == mx1[u] ? mx2[u] : mx1[u])
```

加上 `w[u]` 后，就得到了从父节点方向进入 $v$ 的贡献。

---

## 正确性说明

1. 第一次 DFS 对每个节点保留子树方向的最大、次大贡献，因此能够得到从该节点向下延伸的最优两条路径。
2. 第二次 DFS 将父节点方向的贡献加入候选集合，并在向子节点转移时排除该子节点自身的贡献，因此每个节点都能得到来自整棵树各个方向的最优两条路径。
3. 经过节点 $u$ 的最大路径一定由 $u$ 的权值和两个不同方向的最大正贡献组成，即 `w[u] + mx1[u] + mx2[u]`。
4. 每个类型为 $k$ 的节点都会用经过它的最大路径更新 `ans[k]`，因此最终得到的就是所有 $k$-路径的最大权值。

---

## 算法分析

- 时间复杂度：$O(n)$，每条边在两次 DFS 中各访问一次；
- 空间复杂度：$O(n)$，用于邻接表和各个 DP 数组；
- 使用 `long long`：节点权值可能为负数，路径和也需要使用 64 位整数保存。

---

## 代码实现

以下给出 C++、Python、Java、Go、Rust 五种语言的实现，逻辑完全一致。切换上方的标签即可对比。

```cpp
#include <bits/stdc++.h>

using namespace std;
using ll = long long;

const int N = 1e6 + 6;
const ll INF = 1e18;

int n;
int color[N];
ll weight[N], best1[N], best2[N], answer[N];
vector<int> graph[N];

void dfs1(int u, int parent) {
    best1[u] = best2[u] = 0;
    for (int v : graph[u]) {
        if (v == parent) continue;
        dfs1(v, u);
        ll contribution = weight[v] + best1[v];
        best2[u] = max(best2[u], contribution);
        if (best2[u] > best1[u]) swap(best1[u], best2[u]);
    }
}

void dfs2(int u, int parent, ll from_parent) {
    best2[u] = max(best2[u], from_parent);
    if (best2[u] > best1[u]) swap(best1[u], best2[u]);
    answer[color[u]] = max(answer[color[u]],
                           weight[u] + best1[u] + best2[u]);
    for (int v : graph[u]) {
        if (v == parent) continue;
        ll next_from_parent = weight[u] +
            (weight[v] + best1[v] == best1[u] ? best2[u] : best1[u]);
        dfs2(v, u, next_from_parent);
    }
}

void solve() {
    cin >> n;
    for (int i = 1; i <= n; ++i) cin >> color[i];
    for (int i = 1; i <= n; ++i) cin >> weight[i];
    for (int i = 1; i < n; ++i) {
        int u, v;
        cin >> u >> v;
        graph[u].push_back(v);
        graph[v].push_back(u);
    }
    fill(answer + 1, answer + n + 1, -INF);
    dfs1(1, 0);
    dfs2(1, 0, 0);
    for (int i = 1; i <= n; ++i) {
        cout << (answer[i] == -INF ? -1 : answer[i]);
        cout << (i == n ? '\n' : ' ');
    }
    for (int i = 1; i <= n; ++i) graph[i].clear();
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int test_cases;
    cin >> test_cases;
    while (test_cases--) solve();
    return 0;
}
```

```python
import sys
from collections import defaultdict

sys.setrecursionlimit(2_000_000)

INF = 10 ** 18


def solve():
    data = sys.stdin.buffer.read().split()
    it = iter(data)
    t = int(next(it))
    out_lines = []

    for _ in range(t):
        n = int(next(it))
        color = [0] + [int(next(it)) for _ in range(n)]
        weight = [0] + [int(next(it)) for _ in range(n)]
        graph = [[] for _ in range(n + 1)]
        for _ in range(n - 1):
            u = int(next(it))
            v = int(next(it))
            graph[u].append(v)
            graph[v].append(u)

        best1 = [0] * (n + 1)
        best2 = [0] * (n + 1)
        answer = [-INF] * (n + 1)

        def dfs1(u: int, parent: int) -> None:
            best1[u] = best2[u] = 0
            for v in graph[u]:
                if v == parent:
                    continue
                dfs1(v, u)
                contribution = weight[v] + best1[v]
                if contribution > best1[u]:
                    best1[u], best2[u] = contribution, best1[u]
                elif contribution > best2[u]:
                    best2[u] = contribution

        def dfs2(u: int, parent: int, from_parent: int) -> None:
            nonlocal best1, best2, answer
            if from_parent > best1[u]:
                best1[u], best2[u] = from_parent, best1[u]
            elif from_parent > best2[u]:
                best2[u] = from_parent

            ans_val = weight[u] + best1[u] + best2[u]
            if ans_val > answer[color[u]]:
                answer[color[u]] = ans_val

            for v in graph[u]:
                if v == parent:
                    continue
                nxt = weight[u] + (best2[u] if weight[v] + best1[v] == best1[u] else best1[u])
                dfs2(v, u, nxt)

        dfs1(1, 0)
        dfs2(1, 0, 0)

        out_lines.append(' '.join(str(-1 if answer[i] == -INF else answer[i]) for i in range(1, n + 1)))

    sys.stdout.write('\n'.join(out_lines))


if __name__ == '__main__':
    solve()
```

```java
import java.io.*;
import java.util.*;

public class Main {
    static final long INF = (long) 1e18;
    static int n;
    static int[] color;
    static long[] weight, best1, best2, answer;
    static List<Integer>[] graph;

    static void dfs1(int u, int parent) {
        best1[u] = best2[u] = 0;
        for (int v : graph[u]) {
            if (v == parent) continue;
            dfs1(v, u);
            long contribution = weight[v] + best1[v];
            if (contribution > best1[u]) {
                best2[u] = best1[u];
                best1[u] = contribution;
            } else if (contribution > best2[u]) {
                best2[u] = contribution;
            }
        }
    }

    static void dfs2(int u, int parent, long fromParent) {
        if (fromParent > best1[u]) {
            best2[u] = best1[u];
            best1[u] = fromParent;
        } else if (fromParent > best2[u]) {
            best2[u] = fromParent;
        }

        answer[color[u]] = Math.max(answer[color[u]], weight[u] + best1[u] + best2[u]);

        for (int v : graph[u]) {
            if (v == parent) continue;
            long nxt = weight[u] + (weight[v] + best1[v] == best1[u] ? best2[u] : best1[u]);
            dfs2(v, u, nxt);
        }
    }

    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StreamTokenizer st = new StreamTokenizer(br);
        st.nextToken();
        int t = (int) st.nval;
        StringBuilder sb = new StringBuilder();

        while (t-- > 0) {
            st.nextToken();
            n = (int) st.nval;
            color = new int[n + 1];
            weight = new long[n + 1];
            best1 = new long[n + 1];
            best2 = new long[n + 1];
            answer = new long[n + 1];
            graph = new ArrayList[n + 1];
            for (int i = 1; i <= n; i++) graph[i] = new ArrayList<>();

            for (int i = 1; i <= n; i++) {
                st.nextToken();
                color[i] = (int) st.nval;
            }
            for (int i = 1; i <= n; i++) {
                st.nextToken();
                weight[i] = (long) st.nval;
            }
            for (int i = 1; i < n; i++) {
                st.nextToken();
                int u = (int) st.nval;
                st.nextToken();
                int v = (int) st.nval;
                graph[u].add(v);
                graph[v].add(u);
            }
            Arrays.fill(answer, 1, n + 1, -INF);

            dfs1(1, 0);
            dfs2(1, 0, 0);

            for (int i = 1; i <= n; i++) {
                sb.append(answer[i] == -INF ? -1 : answer[i]);
                sb.append(i == n ? '\n' : ' ');
            }
        }
        System.out.print(sb);
    }
}
```

```go
package main

import (
    "bufio"
    "fmt"
    "os"
)

const INF int64 = 1e18

var (
    n      int
    color  []int
    weight []int64
    best1  []int64
    best2  []int64
    answer []int64
    graph  [][]int
)

func dfs1(u, parent int) {
    best1[u], best2[u] = 0, 0
    for _, v := range graph[u] {
        if v == parent {
            continue
        }
        dfs1(v, u)
        contribution := weight[v] + best1[v]
        if contribution > best1[u] {
            best2[u] = best1[u]
            best1[u] = contribution
        } else if contribution > best2[u] {
            best2[u] = contribution
        }
    }
}

func dfs2(u, parent int, fromParent int64) {
    if fromParent > best1[u] {
        best2[u] = best1[u]
        best1[u] = fromParent
    } else if fromParent > best2[u] {
        best2[u] = fromParent
    }

    if val := weight[u] + best1[u] + best2[u]; val > answer[color[u]] {
        answer[color[u]] = val
    }

    for _, v := range graph[u] {
        if v == parent {
            continue
        }
        nxt := weight[u]
        if weight[v]+best1[v] == best1[u] {
            nxt += best2[u]
        } else {
            nxt += best1[u]
        }
        dfs2(v, u, nxt)
    }
}

func main() {
    in := bufio.NewReader(os.Stdin)
    out := bufio.NewWriter(os.Stdout)
    defer out.Flush()

    var t int
    fmt.Fscan(in, &t)
    for tc := 0; tc < t; tc++ {
        fmt.Fscan(in, &n)
        color = make([]int, n+1)
        weight = make([]int64, n+1)
        best1 = make([]int64, n+1)
        best2 = make([]int64, n+1)
        answer = make([]int64, n+1)
        graph = make([][]int, n+1)

        for i := 1; i <= n; i++ {
            fmt.Fscan(in, &color[i])
        }
        for i := 1; i <= n; i++ {
            fmt.Fscan(in, &weight[i])
        }
        for i := 1; i < n; i++ {
            var u, v int
            fmt.Fscan(in, &u, &v)
            graph[u] = append(graph[u], v)
            graph[v] = append(graph[v], u)
        }
        for i := 1; i <= n; i++ {
            answer[i] = -INF
        }

        dfs1(1, 0)
        dfs2(1, 0, 0)

        for i := 1; i <= n; i++ {
            if answer[i] == -INF {
                fmt.Fprint(out, -1)
            } else {
                fmt.Fprint(out, answer[i])
            }
            if i == n {
                fmt.Fprintln(out)
            } else {
                fmt.Fprint(out, " ")
            }
        }
    }
}
```

```rust
use std::io::{self, Read, Write};

const INF: i64 = 1e18 as i64;

fn main() {
    let mut input = String::new();
    io::stdin().read_to_string(&mut input).unwrap();
    let mut it = input.split_whitespace();
    let mut next = || -> i64 { it.next().unwrap().parse().unwrap() };

    let t = next() as usize;
    let mut out = Vec::new();

    for _ in 0..t {
        let n = next() as usize;
        let mut color = vec![0usize; n + 1];
        let mut weight = vec![0i64; n + 1];
        let mut graph: Vec<Vec<usize>> = vec![vec![]; n + 1];

        for i in 1..=n {
            color[i] = next() as usize;
        }
        for i in 1..=n {
            weight[i] = next();
        }
        for _ in 1..n {
            let u = next() as usize;
            let v = next() as usize;
            graph[u].push(v);
            graph[v].push(u);
        }

        let mut best1 = vec![0i64; n + 1];
        let mut best2 = vec![0i64; n + 1];
        let mut answer = vec![-INF; n + 1];

        fn dfs1(
            u: usize,
            parent: usize,
            graph: &Vec<Vec<usize>>,
            weight: &Vec<i64>,
            best1: &mut Vec<i64>,
            best2: &mut Vec<i64>,
        ) {
            best1[u] = 0;
            best2[u] = 0;
            for &v in &graph[u] {
                if v == parent {
                    continue;
                }
                dfs1(v, u, graph, weight, best1, best2);
                let contribution = weight[v] + best1[v];
                if contribution > best1[u] {
                    best2[u] = best1[u];
                    best1[u] = contribution;
                } else if contribution > best2[u] {
                    best2[u] = contribution;
                }
            }
        }

        fn dfs2(
            u: usize,
            parent: usize,
            from_parent: i64,
            graph: &Vec<Vec<usize>>,
            weight: &Vec<i64>,
            color: &Vec<usize>,
            best1: &mut Vec<i64>,
            best2: &mut Vec<i64>,
            answer: &mut Vec<i64>,
        ) {
            if from_parent > best1[u] {
                best2[u] = best1[u];
                best1[u] = from_parent;
            } else if from_parent > best2[u] {
                best2[u] = from_parent;
            }

            let val = weight[u] + best1[u] + best2[u];
            if val > answer[color[u]] {
                answer[color[u]] = val;
            }

            for &v in &graph[u] {
                if v == parent {
                    continue;
                }
                let nxt = weight[u]
                    + if weight[v] + best1[v] == best1[u] {
                        best2[u]
                    } else {
                        best1[u]
                    };
                dfs2(v, u, nxt, graph, weight, color, best1, best2, answer);
            }
        }

        dfs1(1, 0, &graph, &weight, &mut best1, &mut best2);
        dfs2(1, 0, 0, &graph, &weight, &color, &mut best1, &mut best2, &mut answer);

        for i in 1..=n {
            if answer[i] == -INF {
                write!(out, "-1").unwrap();
            } else {
                write!(out, "{}", answer[i]).unwrap();
            }
            if i == n {
                writeln!(out).unwrap();
            } else {
                write!(out, " ").unwrap();
            }
        }
    }

    io::stdout().write_all(&out).unwrap();
}
```

---

## 易错点

1. **不能只在路径转折点更新答案**：类型节点可能是路径端点，所以必须在每个节点处用 `color[u]` 更新答案。
2. **负贡献不能强行加入**：`best1` 和 `best2` 从 $0$ 开始，表示可以选择不继续向某个方向延伸。
3. **换根转移要排除当前子树**：如果子节点贡献等于当前节点的最大贡献，就必须使用次大贡献。
4. **答案数组需要按测试用例重新初始化**：否则上一个测试用例的结果会污染当前答案。
5. **深度风险**：题目允许 $n$ 达到 $10^6$，如果树退化成链，递归 DFS 可能触发栈溢出。提交时应确认评测环境的栈空间；若不稳定，可以把两次 DFS 改写为显式栈的迭代遍历。

---

## 可改进点

- 本实现为了代码清晰采用递归 DFS。若评测机栈空间较小，可改成迭代版，避免链状树爆栈。
- Python 与 Java 版本在 $n=10^6$ 时递归深度较大，建议配合迭代或提高递归限制。
- 答案数组只需开到「出现的最大类型编号」，可用离散化进一步压缩空间。

---

## 总结

本题的核心是「树形 DP + 换根 DP」：

- 第一次 DFS 统计子树方向的最大两条贡献；
- 第二次 DFS 补充父节点方向的信息；
- 每个节点利用两个方向的最大贡献计算经过它的最大路径；
- 用节点类型将结果分组更新。

最终在 $O(n)$ 时间内求出所有类型的答案。
