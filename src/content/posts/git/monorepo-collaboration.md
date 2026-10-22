---
author: Deven su
pubDatetime: 2021-05-17T09:30:00.000Z
modDatetime: 2021-05-24T17:00:00.000Z
title: 大型 Monorepo 协作经验分享：工具链与分支策略
slug: monorepo-collaboration
featured: false
draft: false
tags:
  - git
  - monorepo
  - collaboration
description: 当仓库长到几十 GB、几百人同时提交，Git 原生工作流开始失效——分享 monorepo 协作中工具链与分支策略的落地经验。
---

当仓库长到几十 GB、几百人同时提交，Git 原生工作流开始失效——分享 monorepo 协作中工具链与分支策略的落地经验。

## Table of contents

## Monorepo 为什么会痛

把几十个服务、几百个包放进一个仓库，好处立竿见影：原子化跨项目改动、统一的工具链、代码共享无版本摩擦。但规模上来之后，痛点也很真实：

- `git clone` 要半小时，`git status` 卡十秒
- CI 跑一次全量测试要两小时，而你的 PR 只改了一行注释
- 每次 pull 都可能和别人的改动冲突

这些问题**不能靠 Git 命令本身解决**，需要工具链和流程组合拳。

## 让 Git 扛住大仓库

```bash
# 浅克隆：只要最近的历史
git clone --depth 1 <repo>

# 部分克隆：只下载当前 checkout 需要的 blob
git clone --filter=blob:none <repo>

# 稀疏检出：只拉自己负责的目录
git sparse-checkout set services/payment libs/proto
```

三者组合可以把「克隆一个巨型仓库」压缩到分钟级。Git 2.x 还内置了后台维护命令，大仓库建议开启：

```bash
git maintenance start   # 后台自动做 commit-graph、prefetch 等优化
```

## 构建系统的增量能力是关键

Monorepo 的核心工具不是 Git，而是**能算出「这次改动影响哪些目标」的构建系统**。主流选择：

| 工具 | 生态 | 特点 |
| ---- | ---- | ---- |
| Bazel | 多语言 | 最严谨的依赖声明，远程缓存/执行 |
| Nx | JS/TS | 上手快，任务编排友好 |
| Turborepo | JS/TS | 轻量，缓存设计优秀 |
| Pants | Python/多语言 | 自动推断依赖 |

它们共同的思路：

1. **依赖图**：从 `BUILD` 文件或 import 分析出 target 之间的依赖
2. **内容寻址缓存**：target 的输入 hash 没变就直接用缓存产物
3. **受影响检测**：`affected` 命令算出 PR 影响的 target，CI 只测这些

于是「改一行注释跑两小时测试」变成「改一行注释跑 30 秒」——只有受影响的包被重新构建测试。

## 分支策略：Trunk-Based Development

Monorepo 和 Git Flow 基本不兼容（release 分支会让跨项目的原子改动无法落地），主流是 **Trunk-Based Development**：

```
main ──●──●──●──●──●──●──●──●─── （所有人频繁合入）
        \     /
PR ──────●──●┘  （短生命周期，通常 < 2 天）
```

配套实践：

- **Feature flag 代替长分支**：未完成功能的代码可以合入 main，用 flag 关闭，发布和代码合入解耦
- **PR 小而快**：几百行以内，当天合并。monorepo 里一个挂三天的 PR，几乎必然和别人的改动打架
- **CODEOWNERS 自动分派 review**：按目录指定负责人

```text file=".github/CODEOWNERS"
services/payment/   @team-payment
libs/proto/         @team-platform
*.md                @team-docs
```

- **合并队列（merge queue）**：几百人同时向 main 合并时，「我合并时 CI 是绿的，合完就红了」会成为常态。GitHub 的 merge queue 把 PR 排队，每次以「main + 前面的 PR」为基础重新验证，保证 main 永远绿

## 版本与发布

Monorepo 里各包的版本管理两个流派：

- **统一版本**：全仓库一个版本号（如 Bazel 式内部仓库），简单但发布粒度粗
- **独立版本**：每个包独立发版，用 changesets 这类工具记录「这次 PR 该 bump 哪个包的哪个级别」，CI 自动生成 changelog 和发布 PR

## 小结

- 大仓库性能：`--filter=blob:none` + sparse-checkout + git maintenance
- 构建系统负责增量，CI 只跑 affected target
- Trunk-based + feature flag + CODEOWNERS + merge queue 是 monorepo 协作四件套
- Monorepo 的问题本质是「规模问题」，解决思路是增量和自动化，不是更多流程

最后一篇聊聊如何参与大型开源项目，从第一个 PR 走到核心贡献者。
