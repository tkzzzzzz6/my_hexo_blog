---
title: leetcode刷题笔记-657-机器人能否返回原点
date: 2026-04-05 18:54:55
tags:
---

思路: 模拟,用两个变量记录机器人的位置,每次根据输入的指令更新位置,最后判断位置是否回到原点

```cpp
/*
 * @Author: tkzzzzzz6
 * @Date: 2026-04-05 18:50:48
 * @LastEditors: tkzzzzzz6
 * @LastEditTime: 2026-04-05 18:50:52
 */
class Solution {
public:
  bool judgeCircle(string moves) { 
    int x= 0,y=0;
    for(auto c:moves){
        switch(c){
            case 'R':
                ++x;break;
            case 'L':
                --x;break;
            case 'U':
                ++y;break;
            case 'D':
                --y;break;
        }
    }
    if(x == 0 && y == 0){
        return true;
    }
    return false;
}
};

```