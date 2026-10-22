---
author: Deven su
pubDatetime: 2019-10-21T09:30:00.000Z
modDatetime: 2019-10-28T16:00:00.000Z
title: 开源项目管理经验分享：用好 Issue、Label 和 Milestone
slug: open-source-issue-label-milestone
featured: false
draft: false
tags:
  - github
  - open-source
  - project-management
description: 分享用 GitHub Issue、Label、Milestone 管理开源项目的经验，让贡献者来了就知道能做什么、怎么做。
---

分享用 GitHub Issue、Label、Milestone 管理开源项目的经验，让贡献者来了就知道能做什么、怎么做。

## Table of contents

## Issue 是项目的前台

对开源项目来说，Issue 列表就是门面。新人点进来，看到的是一堆无人响应的求助，还是分类清晰、有人维护的 backlog，直接决定了他会不会留下第一个 PR。

## 用模板降低沟通成本

GitHub 支持 Issue 模板（`.github/ISSUE_TEMPLATE/`），至少准备两个：

**Bug 报告模板**核心字段：

```markdown
## 环境信息
- 版本：
- 操作系统：
- 浏览器（如适用）：

## 复现步骤
1.
2.
3.

## 期望行为 vs 实际行为

## 最小复现仓库 / 截图
```

**功能请求模板**核心字段：解决了什么问题、期望的方案、考虑过的替代方案。

> [!NOTE]
> 模板最大的作用是逼报告者提供**最小复现**。没有复现步骤的 bug 基本可以礼貌地先关掉，等项目大了你会感谢这个决定。

## Label 体系：少即是多

Label 别贪多，按维度分四组就够：

| 维度 | 示例 |
| ---- | ---- |
| 类型 | `bug`、`enhancement`、`docs` |
| 状态 | `needs-triage`、`blocked`、`wontfix` |
| 优先级 | `priority/high`、`priority/low` |
| 引导 | `good first issue`、`help wanted` |

其中 `good first issue` 和 `help wanted` 是开源引流的利器——GitHub 会把它们聚合到 [contribute 页面](https://docs.github.com/en/communities)，是很多新人的入口。给这类 issue 写清楚背景、涉及的文件、验收标准，新人才能真的上手。

## Milestone：给 roadmap 一个抓手

Milestone 对应一次发布。使用经验：

- **只放确定要做的**：塞 50 个 issue 的 milestone 等于没有 milestone
- **配截止时间**：没有日期的 milestone 只是愿望清单
- **发版后清理**：关闭 milestone，遗留 issue 显式决定是移到下一个还是放回 backlog

## 自动化减负

- 用 [stale bot](https://github.com/apps/stale) 标记长期无活动的 issue（比如 60 天），但**不要自动关闭** `pinned` 或有 label 保护的 issue
- 用 GitHub Projects 的自动流转，issue 关联的 PR 合并后自动移到 Done 列

## 小结

- Issue 模板逼出关键信息，减少来回追问
- Label 按「类型/状态/优先级/引导」四个维度设计，克制数量
- `good first issue` 是开源社区最好的拉新工具
- Milestone 要少而精，让贡献者看得懂发布节奏

下一篇进入 Git 操作进阶：rebase、squash 与干净的提交历史。
