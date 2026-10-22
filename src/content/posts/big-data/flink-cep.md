---
author: Deven su
pubDatetime: 2023-02-20T12:07:50.014Z
title: "Flink CDC 与 CEP"
slug: flink-cep
featured: false
draft: false
tags:
  - big-data
  - mindmap
description: "Flink 思维导图笔记，梳理 Flink CDC 与 Flink CEP 的核心概念与使用场景。"
---

![思维导图缩略图](/posts/flink-cep/thumbnail.png)

## flink cdc

## flink cep

### 分析

- 外部加载：通常规则引擎会有专门的规则管理模块，提供用户去创建自己的规则，对于Flink任务来说需要到外部去加载规则
- 动态更新：需要提供定时去检测规则是否变更
- 历史状态清理：在模式匹配中是一系列NFAState 的不断变更，如果规则发生变更那么这些State也就是无用的了，需要清理掉
- 易容的API: 不同的业务开发人员可能会有自己的规则管理、定时策略等，那么需要对外提供易用的API

### 实现接口InjectionPatternFunction

- 初始化方法 init
- inject获取新的pattern
- getPeriod 扫描周期
- isChanged 规则是否变化

### 在CEP类增加 injectionPattern方法，第一个参数还是datastream 第二参数 就是自己接口的实现类

### PatternStreamBuilder.build改造 加一个判断分支   function加载到CepOperator

### 加载Pattern  注册的定时器

### 状态清理一共分为两块: 匹配状态数据清理、定时器清理；

### 使用版本比对的方式进行处理，每一次规则变更对应的version提升，然后在使用该version与数据的version进行比对处理。
