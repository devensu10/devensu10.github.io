---
author: Deven su
pubDatetime: 2020-12-09T02:57:08.000Z
modDatetime: 2020-12-09T02:57:08.000Z
title: nifi调优
slug: nifi-tuning
featured: false
draft: false
tags:
  - 大数据
description: java.arg.13=-XX:+UseConcMarkSweepGC
---
## 调优策略

#### 1.修改GC机制（原本使用G1，修改为CMS）解决因GC时间过长甚至失败导致节点失去连接的问题（18-23为新增）

```
java.arg.13=-XX:+UseConcMarkSweepGC
java.arg.18=-XX:+PrintGCDetails
java.arg.19=-verbose:gc
java.arg.20=-XX:+PrintGCTimeStamps
java.arg.21=-XX:CMSInitiatingOccupancyFraction=60
java.arg.22=-XX:+UseParNewGC
java.arg.23=-XX:+CMSScavengeBeforeRemark

```

![image-20201209105642232](/posts/nifi-tuning/image-20201209105642232.png)

#### 2.调大nifi jvm内存

```
java.arg.2=-Xms2g
java.arg.3=-Xmx2g
```

#### 3.从kafka消费的数据，使用MergeRecord组件将单条记录合并后，流入hive

#### 4.面对查询数据量很大的表，可使用GenerateTableFetch组件生成查询sql，通过配置partition size ，自动分行数区间来生成sql语句，最后交给下一个节点ExceuteSQL组件来执行sql语句，可在一定程度减轻对nifi的冲击

