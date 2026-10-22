---
author: Deven su
pubDatetime: 2021-05-20T07:21:32.000Z
modDatetime: 2021-05-20T07:21:32.000Z
title: 超大流量的多层嵌套日志ETL作业过程优化经验总结
slug: spark-etl-log-optimization
featured: false
draft: false
tags:
  - 大数据
description: 流量超大，每秒钟160条至800条日志记录流入，每条记录有近2M字节；每天流入500万到1100万记录
---
一、场景概述

流量超大，每秒钟160条至800条日志记录流入，每条记录有近2M字节；每天流入500万到1100万记录

结构复杂，日志内容为多层嵌套的JSON结构

字段超多，第一层级的字段数量即高达300多个

二、旧方案



![未命名文件 (1)](/images/spark-etl-log-optimization/未命名文件 (1).png)

1.日志生产者Ares系统将原始日志消息发送到Kafka

2.从kafka取回日志消息，进行二次处理

3.将过二次处理后的日志消息发送kafka上的另一个topic；

4、flume从kafka上消费日志消息；

5.flume将日志消息以JSON文本格式写入HDFS

6.spark程序以批处理模式从HDFS上读取日志文件，反序列化并生成DataFrame对象，然后以Parquet格式将日志数据写入HDFS

7.分析人员从Hdfs上读取parquet文件，各取所需，获取部分的日志记录结构体的部分内容吸入hive数据库中

这个过程有明显的缺点：

1.链路长，易出错

2.延迟过大，T+2以上

3.数据部分入库

另外，由于spark处理过程时离线的，即对24小时累积下来的海量数据（高达数百G）进行批处理，这个过程对集群IO和计算资源的压力很大，也很容易在资源竞争失败时导致任务失败

三、新方案（实时流处理）

为了解决以上问题，我重新设计了整个ETL过程的数据链路，去除了所有的非必须环节，借助spark streaming的流处理能力近乎实时地对日志数据进行解析转换入库。新的ETL过程链路如下图所示：

![未命名文件 (2)](/images/spark-etl-log-optimization/未命名文件 (2).png)

新ETL流程的包括如下步骤：

1、日志生产者（Ares系统）将原始日志发送kafka

2.spark streaming程序直接从kafka消费日志消息

3.spark streaming程序对日志数据进行二次处理、解析转换、拆分并写入hive数据库

上面的蓝色链路为备用的数据补偿机制，当橙色链路正常链路因为不可抗拒因素（比如集群关键服务宕机）发生中断，丢失部分数据时，可启用蓝色链路从日志云回补数据

新流程具备以下显著优点：

1.实时入库，平均时延一分钟，峰值延迟5分钟，基本可认为数据时即时可用的

2.链路短、性能好，更可靠

3、出错后一天内的数据可自动恢复，一天以上的数据可通过补偿机制进行旁路回补



四、ETL工程关键步骤代码刨析

```
//开启hive的动态分区写入模式
sparkSession.sql("set hive.exec.dynamic.partition=true")
sparkSession.sql("set hive.exec.dynamic.partition.mode=nonstrict")
sparkSession.sql("set hive.exec.max.dynamic.partitions.parnode=10000")
sparkSession.sql("set hive.exec.max.dynamic.partitions=100000")
sparkSession.sql("set hive.exec.max.created.files=150000")
```

五、运行程序并监控任务

--num-executors 指定executors的数目

--executor-cores： 指定executors的核数

--queue 为程序指定yarn资源队列，程序能够支配的资源受到该队列配额的限制

--executor-memory: 为每个executor指定内存大小

--driver-memory：为driver端指定内存大小

--conf spark.streaming.backpressoure.enabled=true:流量反压开关，设置为true后，当数据处理过程承压过重时，spark会启用反压机制，降低从kafka消费数据的流量速度

--conf spark.streaming.kafka.maxRatePerPartition=10:指定从每个分区拉去消息的最大速率，单位”条/秒“；该参数偏移量与最新数据时间间隔较大时，能起到控制流速，保证不会有大量数据堆积在单个任务中，导致失败

--conf spark.blacklist.enabled=true 节点黑名单，当某个节点上的任务多次重试后仍然失败时，spark会将该节点加入黑名单，在一段时间（默认一个小时）spark将不会再向该节点分配任务