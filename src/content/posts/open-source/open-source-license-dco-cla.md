---
author: Deven su
pubDatetime: 2021-02-08T10:00:00.000Z
modDatetime: 2021-02-15T15:40:00.000Z
title: 开源合规经验分享：License 选择、DCO 与 CLA 签署
slug: open-source-license-dco-cla
featured: false
draft: false
tags:
  - open-source
  - license
  - compliance
description: 梳理主流开源 License 的区别与选择建议，解释 DCO 和 CLA 的作用，以及贡献开源前必须知道的合规常识。
---

梳理主流开源 License 的区别与选择建议，解释 DCO 和 CLA 的作用，以及贡献开源前必须知道的合规常识。

## Table of contents

## 没有 License 的代码不是开源

GitHub 上公开 ≠ 开源。**没有附带 License 的代码，默认保留所有权利**——别人能看、能 fork（GitHub 服务条款允许），但法律上不能使用、修改、分发。所以你的项目想让人用，第一件事就是加一个 `LICENSE` 文件。

## 主流 License 速览

| License | 类型 | 核心要求 | 典型项目 |
| ------- | ---- | -------- | -------- |
| MIT | 宽松 | 保留版权声明 | React、Vue |
| Apache 2.0 | 宽松 | 保留声明 + 专利授权 + 声明修改 | Kubernetes、Android |
| GPL v3 | Copyleft | 衍生作品必须同样开源 | Linux 工具链、WordPress |
| LGPL | 弱 Copyleft | 动态链接可闭源，修改库本身要开源 | Qt（部分） |
| AGPL | 强 Copyleft | **网络提供服务也算分发**，SaaS 也要开源 | MongoDB（旧）、Grafana |

几个实践中真正重要的区别：

- **专利条款**：Apache 2.0 明确授予专利许可，MIT 没有。大公司项目普遍选 Apache 2.0 就是为了这条
- **Copyleft 传染性**：用了 GPL 的库，你的整个项目都要 GPL。商业项目慎入
- **AGPL 的 SaaS 漏洞封堵**：GPL 只管「分发」，云服务时代有人拿 GPL 代码做 SaaS 不开源，AGPL 就是堵这个口子的

## 怎么选

一个简化的决策树：

1. 希望被尽可能广泛地使用，包括闭源商业产品 → **MIT**（简单）或 **Apache 2.0**（要专利保护）
2. 希望衍生作品保持开源 → **GPL v3**
3. 做基础设施/库，希望商业产品能链接使用 → **LGPL**
4. 做网络服务，防止白嫖做 SaaS → **AGPL**（或 SSPL 这类更激进的）

> [!NOTE]
> License 一旦选定并有了外部贡献者，再想换就很难——需要所有贡献者同意。选之前想清楚。

## 贡献者侧：DCO 和 CLA

给大型开源项目提 PR，经常会遇到 bot 提示要签东西，这是项目在解决「你的代码知识产权归谁」的问题。

### DCO（Developer Certificate of Origin）

最轻量的方式：在每个 commit 里加一行 `Signed-off-by`，声明「我有权提交这段代码」：

```bash
git commit -s -m "修复空指针"
# 自动在 message 末尾加上：
# Signed-off-by: Deven su <deven@example.com>
```

Linux Kernel、CNCF 项目（如 containerd）用这种方式。CI 里的 DCO check 会校验每个 commit 是否签名。

### CLA（Contributor License Agreement）

更正式的法律协议，签一次对整个项目生效。分两种：

- **ICLA**：个人签，声明贡献是个人行为
- **CCLA**：公司签，声明员工的贡献得到了公司授权

Apache 基金会项目、Google 系项目（如 Chromium）都要求 CLA。通常是 bot 自动检查，点链接在线签即可。

> [!CAUTION]
> **工作时间或利用公司资源写代码，贡献前确认公司的开源政策。** 很多公司对员工对外贡献有审批流程，职务作品的知识产权默认归公司，擅自贡献可能给项目和自己都带来法律风险。

## 项目侧：依赖的合规

自己的项目还要注意依赖链：

- 用 `license-checker`（Node）或 `go-licenses`（Go）扫描依赖的 license
- GPL 类依赖会让你的项目被传染，商业用途项目要特别排查
- 发布时附带 NOTICE 文件（Apache 2.0 要求）

## 小结

- 没有 LICENSE 的公开代码法律上不能用，项目第一步就加上
- MIT/Apache 2.0 求传播，GPL 系求开源延续，AGPL 防 SaaS 白嫖
- DCO = commit 加签名行；CLA = 在线签协议，两者都是确权手段
- 公司资源写的代码，先确认开源政策再贡献

下一篇回到工程：大型 monorepo 里的协作方式。
