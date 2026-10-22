---
author: Deven su
pubDatetime: 2020-01-13T09:00:00.000Z
modDatetime: 2020-01-20T11:40:00.000Z
title: Git rebase 与 squash 经验分享：保持干净的提交历史
slug: git-rebase-squash-clean-history
featured: false
draft: false
tags:
  - git
  - github
  - collaboration
description: 讲清楚 rebase 和 merge 的区别、interactive rebase 整理提交的实战操作，以及团队何时该禁止 rebase。
---

讲清楚 rebase 和 merge 的区别、interactive rebase 整理提交的实战操作，以及团队何时该禁止 rebase。

## Table of contents

## 为什么历史要干净

`git log` 是给半年后排查问题的人看的（很可能就是你自己）。一条满是 `fix typo`、`wip`、`really fix this time` 的历史，等于没有历史。干净的提交历史应该满足：**每个 commit 是一个完整、可编译、有独立语义的改动**。

## rebase vs merge

两者都是把别人的改动合进自己的分支，但结果不同：

```
merge 后：                rebase 后：
    A---B---C main            A---B---C main
     \       \                        \
      D---E---M feature                D'--E' feature
```

- **merge**：保留真实历史，产生合并提交，图是网状的
- **rebase**：把你的提交「搬运」到目标分支最新提交之后，历史是线性的，但 commit hash 变了（D 变成 D'）

> [!CAUTION]
> **黄金法则：永远不要 rebase 已经 push 并被他人基于其开发的公共分支。** rebase 会重写历史，协作者 pull 时会陷入冲突地狱。只 rebase 自己的、未共享的分支。

## 常用姿势

### 同步主干改动

```bash
git checkout feature-x
git fetch origin
git rebase origin/main
# 解决冲突后
git rebase --continue
# 推回自己的分支（历史变了，需要 force-with-lease）
git push --force-with-lease
```

用 `--force-with-lease` 而不是 `--force`：如果远端分支被别人更新过，它会拒绝推送，避免覆盖别人的工作。

### interactive rebase 整理提交

```bash
git rebase -i HEAD~4
```

```
pick a1b2c3d 加分页接口
fixup e4f5g6h 修 typo          ← 合并进上一条，丢弃 message
reword i7j8k9l 补测试           ← 保留提交但改 message
drop m0n1o2p 调试代码           ← 删除这条提交
```

四个最常用指令：`pick`（保留）、`reword`（改描述）、`fixup`/`squash`（合并）、`drop`（删除）。

### 合入时的选择

GitHub PR 提供三种合并方式：

| 方式 | 效果 | 适用 |
| ---- | ---- | ---- |
| Merge commit | 保留全部提交 + 合并节点 | 大 feature，历史有价值 |
| Squash and merge | 压成一条提交 | 小修复，过程提交是噪音 |
| Rebase and merge | 线性追加，无合并节点 | 提交本身就很干净时 |

## 团队约定建议

- feature 分支合并前，先 rebase 到最新 main，把 PR diff 收敛到最小
- 过程性的 wip 提交用 squash 合并清掉
- main 分支禁止 force push（在分支保护规则里强制）
- 要不要保留合并节点全团队统一即可，没有绝对的对错

## 小结

- rebase 让历史线性可读，merge 保留真实协作过程
- 黄金法则：只 rebase 未共享的分支，force 用 `--force-with-lease`
- `rebase -i` 是整理提交历史的瑞士军刀

下一篇聊一个每个协作者都会遇到的时刻：merge conflict 怎么处理。
