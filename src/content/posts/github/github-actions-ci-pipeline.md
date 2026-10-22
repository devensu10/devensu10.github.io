---
author: Deven su
pubDatetime: 2020-11-09T09:00:00.000Z
modDatetime: 2020-11-16T16:20:00.000Z
title: GitHub Actions 经验分享：为开源项目搭建 CI 流水线
slug: github-actions-ci-pipeline
featured: false
draft: false
tags:
  - github
  - ci-cd
  - open-source
description: 从零搭建开源项目的 GitHub Actions CI：PR 检查、测试矩阵、缓存加速与发布自动化。
---

从零搭建开源项目的 GitHub Actions CI：PR 检查、测试矩阵、缓存加速与发布自动化。

## Table of contents

## CI 是开源项目的基础设施

没有 CI 的开源项目，维护者只能人肉 checkout 每个 PR 跑测试—— contributor 等反馈要等几天，维护者累到不想看 PR。GitHub Actions 对公开仓库免费，没有理由不用。

## 最小可用的 PR 检查

```yaml file=".github/workflows/ci.yml"
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm test
```

要点：`npm ci`（而非 `npm install`）严格按 lock 文件安装，保证 CI 可复现；`cache: npm` 一行开启依赖缓存。

## 测试矩阵：一次跑多环境

开源库要兼容多个 Node 版本和操作系统，用 matrix 而不是复制粘贴三个 job：

```yaml
strategy:
  fail-fast: false
  matrix:
    os: [ubuntu-latest, windows-latest, macos-latest]
    node: [18, 20, 22]
runs-on: ${{ matrix.os }}
steps:
  - uses: actions/setup-node@v4
    with:
      node-version: ${{ matrix.node }}
```

9 个组合并行跑。`fail-fast: false` 很重要——默认一个组合失败会取消其他组合，而开源项目恰恰想知道「是不是只在 Windows 上挂」。

## 缓存加速

依赖安装往往占 CI 一半时间：

```yaml
- uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-npm-${{ hashFiles('package-lock.json') }}
    restore-keys: ${{ runner.os }}-npm-
```

key 里带 lock 文件 hash：依赖变了缓存自动失效，不会用到过期缓存。

## 安全：处理 fork PR 的密钥

> [!CAUTION]
> fork 来的 PR 默认拿不到 secrets（`pull_request` 触发时 secrets 为空），这是 GitHub 的防投毒设计。千万不要图方便改用 `pull_request_target` 后直接 checkout PR 代码再执行——那等于把仓库密钥暴露给任意 PR 作者。

安全的做法：

- 普通 CI 用 `pull_request`，不依赖 secrets
- 需要写权限的（如自动评论）用 `pull_request_target`，但**不要 checkout PR 的代码**
- 敏感操作（发布）只信任 `push` 到受保护分支或打 tag 触发

## 发布自动化

打 tag 自动发包，避免「本地手滑发错版本」：

```yaml
on:
  push:
    tags: ["v*"]

jobs:
  release:
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run build
      - uses: softprops/action-gh-release@v2
        with:
          generate_release_notes: true
```

## 小结

- PR 检查是最小闭环：lint + test + 多版本矩阵
- 缓存能砍掉一半 CI 时间，key 记得带 lock hash
- fork PR 拿不到 secrets 是保护不是 bug，别用 `pull_request_target` 绕过
- 发布交给 tag 触发，杜绝本地发包

下一篇聊代码之外但必须懂的事：开源 License 与合规。
