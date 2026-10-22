---
author: Deven su
pubDatetime: 2021-05-06T02:25:27.000Z
modDatetime: 2021-05-06T02:25:27.000Z
title: spark的join原理
slug: spark-join-mechanism
featured: false
draft: false
tags:
  - 大数据
description: 当前SparkSQL支持三种join算法：Shuffle Hash Join、Broadcast Hash Join以及Sort Merge Join。
---
#### Join背景

当前SparkSQL支持三种join算法：Shuffle Hash Join、Broadcast Hash Join以及Sort Merge Join。
其中前两者归根到底都属于Hash Join，只不过载Hash Join之前需要先Shuffle还是先Broadcast。
其实，Hash Join算法来自于传统数据库，而Shuffle和Broadcast是大数据在分布式情况下的概念，两者结合的产物。
因此可以说，大数据的根就是传统数据库。Hash Join是内核。

#### Spark Join的分类和实现机制

![file](/images/spark-join-mechanism/3465301091-5dd0c87bc2731_articlex)

上图是Spark Join的分类和使用。

##### Hash Join

先来看看这样一条SQL语句：select * from order,item where item.id = order.i_id，参与join的两张表是order和item，join key分别是item.id以及order.i_id。现在假设Join采用的是hash join算法，整个过程会经历三步：

- 确定Build Table以及Probe Table：这个概念比较重要，Build Table会被构建成以join key为key的hash table，而Probe Table使用join key在这张hash table表中寻找符合条件的行，然后进行join链接。Build表和Probe表是Spark决定的。通常情况下，小表会被作为Build Table，较大的表会被作为Probe Table。
- 构建Hash Table：依次读取Build Table(item)的数据，对于每一条数据根据Join Key(item.id)进行hash，hash到对应的bucket中(类似于HashMap的原理)，最后会生成一张HashTable，HashTable会缓存在内存中，如果内存放不下会dump到磁盘中。
- 匹配：生成Hash Table后，在依次扫描Probe Table(order)的数据，使用相同的hash函数(在spark中，实际上就是要使用相同的partitioner)在Hash Table中寻找hash(join key)相同的值，如果匹配成功就将两者join在一起。

![file](/images/spark-join-mechanism/4149557144-5dd0c87c7683b_articlex)

##### Broadcast Hash Join

当Join的一张表很小的时候，使用broadcast hash join。

Broadcast Hash Join的条件有以下几个：

- 被广播的表需要小于spark.sql.autoBroadcastJoinThreshold所配置的信息，默认是10M；
- 基表不能被广播，比如left outer join时，只能广播右表。

![file](/images/spark-join-mechanism/2238566779-5dd0c87d09a0a_articlex)

broadcast hash join可以分为两步：

- broadcast阶段：将小表广播到所有的executor上，广播的算法有很多，最简单的是先发给driver，driver再统一分发给所有的executor，要不就是基于bittorrete的p2p思路；
- hash join阶段：在每个executor上执行 hash join，小表构建为hash table，大表的分区数据匹配hash table中的数据。

##### Sort Merge Join

![file](/images/spark-join-mechanism/3215834520-5dd0c87d90968_articlex)

当两个表都非常大时，SparkSQL采用了一种全新的方案来对表进行Join，即Sort Merge Join。这种方式不用将一侧数据全部加载后再进行hash join，但需要在join前将数据进行排序。

首先将两张表按照join key进行重新shuffle，保证join key值相同的记录会被分在相应的分区，分区后对每个分区内的数据进行排序，排序后再对相应的分区内的记录进行连接。可以看出，无论分区有多大，Sort Merge Join都不用把一侧的数据全部加载到内存中，而是即用即丢；因为两个序列都有有序的，从头遍历，碰到key相同的就输出，如果不同，左边小就继续取左边，反之取右边。从而大大提高了大数据量下sql join的稳定性。

整个过程分为三个步骤：

- shuffle阶段：将两张大表根据join key进行重新分区，两张表数据会分布到整个集群，以便分布式并行处理
- sort阶段：对单个分区节点的两表数据，分别进行排序
- merge阶段：对排好序的两张分区表数据执行join操作。join操作很简单，分别遍历两个有序序列，碰到相同join key就merge输出，否则继续取更小一边的key。

![file](/images/spark-join-mechanism/3581550157-5dd0c87e7f78b_articlex)

经过上文的分析，很明显可以得出这几种join的代价关系：cost(Broadcast Hash Join)< cost(Shuffle Hash Join) < cost(Sort Merge Join)，数据仓库设计时最好避免大表与大表的join查询，SparkSQL也可以根据内存资源、带宽资源适量将参数spark.sql. autoBroadcastJoinThreshold调大，让更多join实际执行为Broadcast Hash Join。