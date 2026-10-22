---
author: Deven su
pubDatetime: 2020-07-20T09:30:00.000Z
modDatetime: 2020-07-27T14:10:00.000Z
title: Git 底层原理经验分享：对象模型、引用与 reflog
slug: git-internals-objects-refs-reflog
featured: false
draft: false
tags:
  - git
  - internals
description: 深入 .git 目录，讲清楚 blob、tree、commit 三类对象和引用机制，理解之后 reset、rebase、reflog 都不再神秘。
---

深入 .git 目录，讲清楚 blob、tree、commit 三类对象和引用机制，理解之后 reset、rebase、reflog 都不再神秘。

## Table of contents

## 为什么要懂底层

很多人用 Git 是「背命令」：背会了 add/commit/push 就干活，一遇到「reset --hard 错了」「detached HEAD」就慌了。其实 Git 底层模型非常简单，**总共只有三种对象加一堆指针**，理解了它，所有命令都只是对这套模型的操作。

## 三种对象

Git 是一个内容寻址的键值数据库，`.git/objects/` 里存着所有数据，key 是内容的 SHA-1。

```
commit ──→ tree ──→ blob（文件内容）
   │          └────→ blob
   └────→ parent commit（上一个提交）
```

- **blob**：文件内容，不含文件名。两个文件内容相同，只存一份
- **tree**：目录快照，记录「文件名 → blob/tree 」的映射
- **commit**：指向一个根 tree + 父 commit + 作者/时间/message

动手验证一下：

```bash
echo "hello" | git hash-object -w --stdin
# 输出 ce013625030ba8dba906f756967f9e9ca394464a

git cat-file -p ce01362
# 输出 hello

git cat-file -p HEAD
# tree 4b825dc...
# parent a1b2c3d...
# author Deven su <...> 1595... +0800
# committer ...
#
#     你的 commit message
```

关键推论：

- commit 是**不可变**的。任何「修改提交」（amend、rebase）都是创建新 commit，旧的还在 objects 里
- 分支合并快（fast-forward）是因为提交之间只有指针移动，没有数据复制

## 引用：refs 只是指针文件

分支和 tag 不是对象，只是 `.git/refs/` 下的文本文件，内容是一个 commit hash：

```bash
cat .git/refs/heads/main
# a1b2c3d4e5...  ← 就这 40 个字符

cat .git/HEAD
# ref: refs/heads/main  ← HEAD 是一个指向分支的指针
```

于是很多概念瞬间清晰：

- **创建分支** = 写一个含 hash 的文件，所以 `git branch` 快到无感
- **detached HEAD** = HEAD 直接指向 commit 而不是分支，此时提交的 commit 没有分支引用，切走就「丢」了（实际还能用 reflog 找回）
- **reset --soft / --mixed / --hard**：都是移动分支指针，区别只在是否动暂存区和工作区

## reflog：后悔药

HEAD 和分支的每一次移动都会记录在 `.git/logs/` 里，这就是 reflog：

```bash
git reflog
# a1b2c3d HEAD@{0}: reset: moving to HEAD~3   ← 误操作现场
# e4f5g6h HEAD@{1}: commit: 加导出功能        ← 想回到这里
```

恢复误删的提交或分支：

```bash
git reset --hard e4f5g6h          # 直接回到那个提交
# 或者
git branch recover-branch e4f5g6h # 给「丢失」的提交建个分支
```

> [!NOTE]
> reflog 默认保留 90 天（可达提交 30 天），且只存在本地。所以「reset --hard 错了」在本地几乎总是可恢复的，前提是别急着 `git gc`。

## 回到日常命令

理解了模型再看命令：

| 命令 | 本质 |
| ---- | ---- |
| `git commit` | 新建 tree + commit 对象，分支指针前移 |
| `git rebase` | 复制 commit 生成新对象，移动分支指针 |
| `git cherry-pick` | 把某个 commit 的 diff 应用到当前 HEAD，生成新 commit |
| `git checkout -- file` | 用暂存区/HEAD 的 blob 覆盖工作区文件 |

## 小结

- Git = 内容寻址的对象库（blob/tree/commit）+ 引用（refs/HEAD）
- commit 不可变，「修改」都是新建；分支只是 40 字节文本文件
- 指针移动都有 reflog 记录，误操作先 `git reflog` 冷静一下

下一篇从本地回到 GitHub：用 Actions 给开源项目搭 CI。
