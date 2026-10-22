---
author: Deven su
pubDatetime: 2019-02-18T09:00:00.000Z
modDatetime: 2019-02-25T14:30:00.000Z
title: 分支管理经验分享：Git Flow vs GitHub Flow 怎么选
slug: git-flow-vs-github-flow
featured: false
draft: false
tags:
  - git
  - github
  - collaboration
description: 对比 Git Flow 与 GitHub Flow 两种主流分支模型，分析各自适用场景，帮团队选出合适的协作方式。
---

对比 Git Flow 与 GitHub Flow 两种主流分支模型，分析各自适用场景，帮团队选出合适的协作方式。

## Table of contents

## 为什么需要分支模型

多人协作时，如果所有人都往 `master` 上直接推代码，很快就会陷入「改坏了主干、不敢发版」的困境。分支模型本质是一套**约定**：什么分支做什么、代码从哪里合并到哪里、什么时候发版。选错模型的代价是流程越跑越重，或者约束太少导致线上事故。

## Git Flow

Git Flow 是 Vincent Driessen 在 2010 年提出的经典模型，包含两类常驻分支和三类临时分支：

```
master ─────●──────────●───────  （只放已发布版本，打 tag）
             \        /
release ──────●──●──●─┘          （发版准备，只修 bug 不加功能）
               \    \
develop ──●──●──●──●──●──●────── （集成分支）
           \        /
feature ────●──●──●┘             （功能分支，从 develop 切出）
```

另外还有 `hotfix` 分支：从 `master` 切出紧急修复，完成后同时合回 `master` 和 `develop`。

**优点**：版本边界清晰，适合需要同时维护多个线上版本的产品（如客户端软件）。

**缺点**：分支多、流程重，merge 链路长，对持续部署不友好。

## GitHub Flow

GitHub Flow 极简：只有一个常驻分支 `main`，所有工作都从它切 feature 分支，通过 Pull Request 评审后合回并立即部署。

```
main ──●──────────●──●──●─────── （永远可发布）
        \        /
topic ──●──●──●─┘                （PR 评审 + CI 通过后合入）
```

流程只有五步：切分支 → 提交 → 开 PR → 讨论评审 → 合并部署。

**优点**：简单、反馈快，天然契合持续交付。

**缺点**：要求有完善的 CI 和灰度发布能力，否则「main 永远可发布」只是口号。

## 怎么选

| 维度 | Git Flow | GitHub Flow |
| ---- | -------- | ----------- |
| 发布节奏 | 周期性发版 | 持续部署 |
| 需维护多版本 | 是 | 否 |
| 团队规模 | 大团队、强管控 | 小团队、高自动化 |
| 典型场景 | 桌面软件、嵌入式 | Web 服务、SaaS |

> [!NOTE]
> 实际中常见的是**混合模型**：用 GitHub Flow 做日常开发，发版时再切 release 分支做稳定化。开源项目普遍是 GitHub Flow 的变体——fork + PR。

## 小结

- 分支模型是约定，不是银弹，要和发布节奏匹配
- 需要多版本维护选 Git Flow，持续交付选 GitHub Flow
- 团队规模小时优先简单的模型，等痛了再加流程

下一篇聊聊合入前的关键环节：Code Review。
