---
author: Deven su
pubDatetime: 2021-09-13T10:00:00.000Z
modDatetime: 2021-09-20T16:30:00.000Z
title: 大型开源项目参与经验分享：从 Good First Issue 到核心贡献者
slug: contributing-to-large-open-source
featured: false
draft: false
tags:
  - open-source
  - github
  - community
description: 参与 Kubernetes、React 这类大型开源项目的完整路径：如何找到切入点、读懂贡献流程、让 PR 被合并，最终成为核心贡献者。
---

参与 Kubernetes、React 这类大型开源项目的完整路径：如何找到切入点、读懂贡献流程、让 PR 被合并，最终成为核心贡献者。

## Table of contents

## 大项目为什么难进

给小项目提 PR，maintainer 可能就一两个人，响应快、流程轻。而 Kubernetes 有上万个 open issue，PR 需要两个 reviewer 加 OWNERS 审批；React 的 PR 可能几周才有人看。**大项目的门槛不在技术，在于你要在「没人有义务理你」的环境里推进事情。**

## 第一步：先成为用户，再成为贡献者

靠谱的第一个贡献几乎都来自真实使用：踩到 bug、发现文档和实际行为不符、缺一个小功能。用都没用过就冲进来想「做贡献」，提的 issue 和 PR 往往不得要领。

在写代码之前，先做三件低成本的事建立存在感：

1. **读文档报错**：文档 typo、过期示例是最好的敲门砖，也让维护者记住你的名字
2. **回答 issue/discussion**：帮别人解决问题，社区声望比代码涨得更快
3. **复现 bug**：给「unreproduced」的 bug 提供最小复现，这是极有价值的工作

## 找到你的切入点

```text
优先级从高到低：
自己踩到的坑 > good first issue > help wanted > 自己拍脑袋想的功能
```

找 issue 的技巧：

- 按 `label:good-first-issue sort:comments-asc` 排序，评论少的竞争小
- 想做的 issue 先留言「I'd like to work on this」，等项目分配，避免和别人撞车白干
- 有些项目（如 Kubernetes）按 SIG（Special Interest Group）划分领域，先选定一个 SIG 深耕，比全仓库乱逛有效得多

## 读懂项目的「潜规则」

每个大项目都有自己的玩法，提 PR 前必读：

- `CONTRIBUTING.md`：流程、CLA/DCO 要求、commit 规范
- 近一个月已合并的 PR：看别人怎么写描述、怎么回应 review、CI 有哪些检查
- 治理文档：谁是 reviewer/approver，决策怎么走（lazy consensus？投票？）

> [!NOTE]
> 大项目的 PR 模板通常很长（动机、方案、测试、release note）。认真填模板不是形式主义——模板本身就是 reviewer 的检查清单，填好了等于替 reviewer 省了一遍问。

## 让 PR 被合并的推进术

**大功能先讨论再写代码。** 直接甩一个 2000 行的 PR，大概率被要求「先开 issue 讨论设计」。正确姿势：issue/proposal → 达成方向共识 → 小步提交。

**PR 发了没人看怎么办：**

1. 等一个合理周期（大项目通常 1-2 周）
2. 礼貌 ping：「friendly ping, anything I can do to move this forward?」
3. 去项目对应的 Slack/邮件列表/例会上提
4. 还不行就考虑拆小——小 PR 的响应率远高于大 PR

**面对 review 意见：** 大项目的 reviewer 对代码质量的要求远超一般公司项目，被提几十条意见很正常。逐条回应，同意就改并回复「done」，不同意就摆出理由技术性地讨论。reviewer 不怕争论，怕的是没有回应。

## 从贡献者到核心成员

大多数大项目有明确的成员阶梯，以 CNCF 项目为例：

```text
Contributor → Member → Reviewer → Approver/Maintainer
```

每级晋升的依据是**持续贡献记录 + 现有成员提名**，考察的不只是代码量：

- **Review 别人**：maintainer 最稀缺的是 review 带宽，能帮别人看 PR 的人晋升最快
- **参与发布/triage**：轮值处理新 issue、参与发版，证明你能承担「不性感但重要」的工作
- **长期在线**：三个月活跃比一波爆发式提交更有说服力

一般路径：持续贡献 3-6 个月成为 Member，在子领域深耕成为 Reviewer，直到对该领域的设计决策有发言权成为 Maintainer。

## 小结

- 先当用户再当贡献者，文档修复和帮别人答疑是最好的敲门砖
- 提大功能前先讨论，PR 认真填模板，没人看就礼貌推进
- 晋升阶梯看的是持续性和社区工作（review、triage），不只是代码
- 参与开源是长跑，把它当成职业投资而非一次性任务

## 系列回顾

这个系列从分支模型开始，经过 Code Review、Issue 管理、Git 进阶与底层原理、CI 搭建、开源合规、Monorepo 协作，到这里收尾。工具和流程会过时，但「降低协作成本」这个核心目标不会变。祝你在开源世界里玩得开心。
