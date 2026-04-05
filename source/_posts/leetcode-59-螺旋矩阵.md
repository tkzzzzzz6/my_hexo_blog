---
title: leetcode-59-螺旋矩阵
date: 2026-04-05 18:04:48
tags:
---

模拟

循环不变量


[题目链接](https://leetcode.cn/problems/spiral-matrix-ii/)

思路:模拟,按照顺时针的方向依次填充矩阵,每次填充完一圈之后,更新循环不变量,直到所有元素都被填充完

>注意:不同方向的遍历,对应的处理结构应该是一样的,这里我们采用的是左闭右开,也可以采用左开右闭

```cpp
class Solution {
public:
    vector<vector<int>> generateMatrix(int n) {
        vector<vector<int>> res(n,vector<int>(n,0));
        int start_x = 0,start_y = 0;
        int cnt = 1;
        int loop = n / 2; //循环次数,每次填充行和列少 2 个,所以循环次数是 n / 2
        int offset = 1;
        int i,j;
        int mid = n / 2;
        while(loop--){
            i = start_x;
            j = start_y;
            for(;j< n - offset;++j)
                res[i][j] = cnt++;
            for(;i<n - offset;++i)
                res[i][j] = cnt++;
            for(;j>start_y;--j)
                res[i][j] = cnt++;
            for(;i>start_x;--i)
                res[i][j] = cnt++;
            ++offset;
            ++start_x;
            ++start_y;
        }
        if((n & 1) == 1){ //矩阵的宽度是奇数的话,单独填充最中间的元素
            res[mid][mid] = cnt;
        }
        return res;
    }
};
```