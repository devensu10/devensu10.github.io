---
author: Deven su
pubDatetime: 2021-05-19T09:22:16.000Z
modDatetime: 2021-05-19T09:22:16.000Z
title: SparkSQL优化分享
slug: sparksql-optimization
featured: false
draft: false
tags:
  - 大数据
description: 在大数据处理中，基于spark计算引擎在大数据离线计算领域所占的比例越来越高，同时也会产生越来越来多的性能问题。下面根据自己使用的spark sql的经验，并参考业界的经验，总结出以下优化方法。一般而言，常见的影响spark任务快慢的因素主...
---
优化分享

在大数据处理中，基于spark计算引擎在大数据离线计算领域所占的比例越来越高，同时也会产生越来越来多的性能问题。下面根据自己使用的spark sql的经验，并参考业界的经验，总结出以下优化方法。一般而言，常见的影响spark任务快慢的因素主要有以下六点，分别如下：

1.数据量 gb级 vs tb级

2.数据组织形式 （存储结构 压缩算法 数据schema map等复杂结构）

3、小文件 很多的kb级 10M级

4.core个数 并发量小，shuffle等待

5.算法（聚合因子 过滤条件 sql组织形式）

6、发生大量的shuffle 可用的broadcast代替



一、Executor的设置

建议不要自己配置Executor个数，使用动态分配模式，对应的参数设置如下:

spark.dynamicAllocation.enabled=true

spark.dynamicAllocation.minExecutors=1;

spark.dynamicAllocation.maxExecutors=400;

原因如下：

根据当前的负载动态的增加或者删除Executors，这样做的好处在于：

*在业务组的队列资源（vcore，memory）资源恒定情况下，能更好的均衡各个业务对资源的占用。也就是对于一个计算量较小的任务不用只能用太多资源，而对于一个计算量较大的任务，也能从集群中获取相对较多的资源

*而采用指定模式，则会导致任务再获取足够多（可通过参数设置比例）的executor之前一直处于等待状态，而这通常会浪费计算资源

二、core的设置

spark.executor.cores(默认值1) 在默认情况下spark.task.cpus(每个task使用的core个数也会为1)

*建议executor的cpu core数量设置为2~3个比较合适，同时伴随需要调整spark.executor.memory

*在队列有大量任务提交的情况下，还要更少，以免影响其他用户提交的任务因申请不到cpu资源而卡住



三、Memory的设置

建议：每个Executor的每个core分配的内存设置4g较为合适。用户设置该值的时候需要考虑如下影响因子：

* 自己使用的executor-memory * num-executor所使用的资源不能超过所提交队列的阈值
* 在队列资源共用的模式下，所申请的资源还要更下，以免申请不到资源或者阻塞其他用户的任务
* 用户申请的executor-memory不能超过yarn设置最大值，当前设置的最大值为60g

四、shuffle并行度设置

spark.default.parallelism,该参数用于设置每个stage的默认task数量，这个参数极为重要，如果不设置可能会直接影响你的任务性能。（只有在处理RDD时才会起作用，对sparksql无效）

建议 500~1000较为合适

五、数据存储结构选择

 目前hadoop中常用的数据存储结构包括：

1.Text（行式存储）

2.csv（行式存储）

3.RCFile（列式存储）

4.ORC（列式存储）

5.parquet（列式存储）

由于spark 默认存储格式为parquet，因此在建表中，尽量选择parquet列式数据存储结构

六、压缩方式设置

常用的压缩方式包括：gzip，bzip，lzo，snappy

对于spark任务来说，压缩的数据带来的好处是显而易见的，主要如下：

1.大幅节省内存

2.大幅节省磁盘

3.大幅节省数据读取时间

针对数据存储结构的不同，采用压缩格式设置也不同，下面列举常用的两种的设置方法

1.text格式

--conf spark.hadoop.mapreduce.map.output.compress=true

--conf

spark.hadoop.mapreduce.map.output.compress.codec=org.apache.hadoop.io.compress.SnappyCodec

2.Parquet格式

--conf

spark.hadoop.mapreduce.map.output.compress=true

--conf

spark.sql.parquet.compression.codec=snappy

七、小文件处理方法

所谓小文件，我们定义为小于一个HDFS Block大小一下的文件。

小文件会带来问题主要有以下三点：

1.小文件太多，导致每个task读取的数据量较小，计算的时间很短

2.执行的时间不足以弥补JVM启动的时间

3.由于集群中NameNode节点需要维护文件的元数据信息，太多的输出小文件会给集群的NameNode带来巨大的压力

小文件解决的方案：

可通过控制task个数的方式来对输出数据重分区，通过这种方式可以达到减少或者扩大task个数的目的，从而控制输出文件数量

八、广播设置

对该变量（表）进行广播。广播后的变量，会保证每个Executor的内存中，只驻留一份变量副本，而Executor中的task执行时共享该Executor中的那份数据副本

这样的话，可以大大减少变量副本的数量，从而减少网络传输的性能开销，并减少对Executor内存的占用开销，降低GC的频率

可适当调整广播变量大小的阈值,，使得稍微大一些的数据也能被广播

spark.sql.autoBroadcastJoinThreshold=33554432

spark.sql.broadcastTimeout-600(广播超时时间)

九、SQL标准化

SQL语句中column类型一定要与Hive数仓中的表Column类型保持一致，spark sql相对hive sql 来说对于语法的检查更为严格