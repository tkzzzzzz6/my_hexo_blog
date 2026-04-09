---
title: LeetCode：206.反转链表 | 双指针法 | 递归法
tags:
---

方法1:双指针写法(递归法的基础,必须掌握)
```cpp
// 双指针法,递归法的基础,更方便递归的理解,必须掌握
/*
 * @Author: tkzzzzzz6
 * @Date: 2026-04-08 23:27:39
 * @LastEditors: tkzzzzzz6
 * @LastEditTime: 2026-04-08 23:27:59
 */
/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode() : val(0), next(nullptr) {}
 *     ListNode(int x) : val(x), next(nullptr) {}
 *     ListNode(int x, ListNode *next) : val(x), next(next) {}
 * };
 */
class Solution {
public:
  ListNode *reverseList(ListNode *head) {
    ListNode *cur = head;
    ListNode *pre = NULL;
    while (cur != NULL) {
      ListNode *temp = cur->next;
      cur->next = pre;
      pre = cur;
      cur = temp;
    }
    return pre;
  }
};

```

递归写法
```cpp
// 递归法求解
/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode() : val(0), next(nullptr) {}
 *     ListNode(int x) : val(x), next(nullptr) {}
 *     ListNode(int x, ListNode *next) : val(x), next(next) {}
 * };
 */
class Solution {
public:
  ListNode *reverseList(ListNode *head) { return reverse(head, NULL); }
  ListNode *reverse(ListNode *cur, ListNode *pre) {
    if (cur == NULL)
      return pre;
    ListNode *temp = cur->next;
    cur->next = pre;
    return reverse(temp, cur);
  }
};


```
