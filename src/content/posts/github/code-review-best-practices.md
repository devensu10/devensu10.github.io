---
author: Deven su
pubDatetime: 2019-06-10T10:30:00.000Z
modDatetime: 2019-06-17T09:20:00.000Z
title: Code Review 经验分享：如何做一个好的 Reviewer 和 Author
slug: code-review-best-practices
featured: false
draft: false
tags:
  - github
  - collaboration
  - best-practices
description: 从 Author 和 Reviewer 双视角总结 Code Review 的实用经验：小步提交、描述先行、对事不对人。
---

从 Author 和 Reviewer 双视角总结 Code Review 的实用经验：小步提交、描述先行、对事不对人。

## Table of contents

## Review 的目的不只是找 bug

很多团队把 Code Review 当成「质检关卡」，Reviewer 压力巨大，Author 战战兢兢。实际上 Review 有三层价值：

1. **质量**：发现缺陷和设计问题
2. **知识共享**：让至少两个人理解这段代码
3. **统一风格**：团队约定在 review 中自然沉淀

想明白这三点，很多争议就有答案了——比如「这个 PR 只是改样式要不要认真看」：要，因为知识共享的价值还在。

## Author 侧：让 PR 好读

### 小步提交

研究表明，PR 超过 400 行后缺陷检出率急剧下降。大改动拆成多个有依赖关系的 PR，或者用 feature flag 分批合入。

### 描述先行

```markdown
## What
给订单列表页加分页查询。

## Why
订单量超过 10 万后全量查询超时（#235）。

## How
- 后端加 limit/offset 参数
- 前端用现有的 Pagination 组件

## Test
本地用 20 万条数据验证，P95 从 4.2s 降到 180ms。
```

Reviewer 最怕的是「1000 行 diff + 一句话标题」。写清楚动机，评审效率至少翻倍。

### 自己先过一遍

提交前自己 diff 一遍，把临时调试代码、格式化噪音清掉。可以用 GitHub 的「request changes」之前的自评功能，在自己 PR 上先留几条「这里为什么这样改」的说明，主动引导 Reviewer 的注意力。

## Reviewer 侧：对事不对人

### 用提问代替命令

| ❌ 不推荐 | ✅ 推荐 |
| ---------- | -------- |
| 这个写法不对 | 这里用 X 会不会有并发问题？ |
| 改成单例 | 这个类有状态吗？如果没有，单例是不是更合适？ |
| 看不懂 | 这段逻辑能加个注释吗，我理解的是……对吗？ |

### 区分意见的优先级

用前缀标记严重程度，避免为 nits（细枝末节）阻塞合并：

- `block:` 必须改，不改不批
- `suggest:` 建议改，但作者可以坚持
- `nit:` 风格细节，可改可不改
- `question:` 纯粹求教

### 及时响应

Review 是阻塞他人的工作，优先级应该高于自己手头「还能再等等」的活。团队可以约定：工作日内 24 小时内给出第一轮反馈。

## 小结

- Author：PR 小一点、描述清楚、先自评
- Reviewer：提问代替命令，分级表达意见，及时响应
- Review 文化是团队最贵的资产之一，值得定期 retro

下一篇换个视角：如何用 Issue 和 Milestone 管理开源项目的协作。
