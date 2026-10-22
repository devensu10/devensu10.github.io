---
author: Deven su
pubDatetime: 2020-04-15T10:00:00.000Z
modDatetime: 2020-04-22T15:30:00.000Z
title: 协作冲突处理经验分享：Merge Conflict 的预防与解决
slug: git-merge-conflict-resolution
featured: false
draft: false
tags:
  - git
  - github
  - collaboration
description: 系统梳理 merge conflict 的产生原因、解决流程与预防手段，包括 rerere 和锁文件等容易踩坑的场景。
---

系统梳理 merge conflict 的产生原因、解决流程与预防手段，包括 rerere 和锁文件等容易踩坑的场景。

## Table of contents

## 冲突是怎么产生的

冲突的本质：**两个分支改了同一处，Git 无法替你决定谁对**。最常见的是改了同一文件的相邻行；改不同行、不同文件时 Git 都能自动合并。还有一种结构性冲突：一个分支改了文件，另一个分支删了它（modify/delete）。

```text
<<<<<<< HEAD
const timeout = 3000;
=======
const timeout = 5000;
>>>>>>> feature-x
```

三段含义：`<<<<<<< HEAD` 到 `=======` 是**当前分支**的内容，`=======` 到 `>>>>>>>` 是**合入分支**的内容。

## 标准解决流程

```bash
git merge feature-x        # 或 git rebase main，冲突就出现了
git status                 # 看哪些文件冲突：both modified
# 编辑文件，删掉冲突标记，保留正确的内容
git add src/config.ts      # 标记为已解决
git merge --continue       # 或 git rebase --continue
```

解决中想反悔：

- `git merge --abort` / `git rebase --abort`：回到合并前的状态
- `git checkout --theirs <file>`：整个文件采用对方版本（merge 时 theirs 是合入分支，**rebase 时 theirs 是对方 main，方向相反，小心！**）

> [!CAUTION]
> rebase 和 merge 中 ours/theirs 的含义是**反直觉的**：rebase 时 HEAD 指向的是目标分支（main），所以 `--ours` 是 main，`--theirs` 才是你的 feature。用错方向会把刚解决好的冲突搞反。

## 解决完之后

最容易被忽略的一步：**跑测试**。冲突解决是手工编辑，即使两边各自能跑通，合起来的语义也可能错。语义冲突（一边改了函数签名，另一边新增了调用）Git 完全检测不到。

## 预防比解决更重要

1. **小步快走**：PR 存活时间越长，冲突概率指数上升。大改动拆 PR 或用 feature flag
2. **勤同步**：feature 分支每天 rebase 一次 main，把冲突消化在小规模
3. **热区文件加约定**：`package.json`、路由注册表、迁移文件这类「人人都要改」的文件，团队约定追加在末尾而不是中间插入，能减少一半冲突
4. **锁文件单独处理**：`package-lock.json`、`go.sum` 冲突不要手工编辑，直接 `git checkout --theirs package-lock.json && npm install` 重新生成

## 进阶：rerere

`rerere`（reuse recorded resolution）让 Git 记住你解决过的冲突，下次遇到同样的冲突自动应用：

```bash
git config --global rerere.enabled true
```

长寿命分支反复 rebase、或者 release 分支多次合并主干时特别有用，同一个冲突不用解两遍。

## 小结

- 冲突是「同一处被两边改」，解决后一定要跑测试，防语义冲突
- merge/rebase 的 ours/theirs 方向相反，用 `--theirs/--ours` 前先想清楚
- 预防三板斧：小 PR、勤 rebase、热区文件约定写法
- 锁文件冲突重新生成，重复性冲突交给 rerere

下一篇往底层走一步：理解 Git 的对象模型，很多「灵异现象」就有答案了。
