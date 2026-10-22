---
author: Deven su
pubDatetime: 2021-05-18T10:40:02.000Z
modDatetime: 2021-05-18T10:40:02.000Z
title: Spark sql 小文件问题得解决方案分享
slug: spark-sql-small-files
featured: false
draft: false
tags:
  - 大数据
description: Spark sql 小文件问题得解决方案分享
---
Spark sql 小文件问题得解决方案分享



一、Spark sql 小文件问题

小文件是指文件大小显著小于hdfs block块大小的文件，过于繁多的小文件会给HDFS带来很严重的性能瓶颈，对任务的文件和集群的委会会带来极大的挑战



通过hive调度得MR任务都是可以简单设置如下几个小文件合并的参数来解决任务产生的小文件问题

set hive.merge.mapfiles=true

set hive.merge.mapedfiles=true

set hive.merge.size.per.task=xxxx;

set hive.merge.smallfiles.avgsize=xxx;

但spark本身并不支持小文件合并功能，那如何解决sparksql 小文件的问题呢？

二、spark为什么会产生小文件

spark 生成的文件数量直接取决于RDD里partition的数量和表分区数量。注意这里的连个分区概念并不相同，RDD的分区与任务并行度相关，而表分区则是hive的分区数目.生成的文件数目一般是RDD分区数和表分区的乘积。因此，当任务并行度过高或者分区数目很大时，很容易产生很多的小文件

因此，如果需要从参数调整来减少生成的文件数目，就只能通过减少最后一个阶段RDD的分区数来达到了（减少分区数目限制于历史数据和上下游关系，难以修改）

三、通过参数进行调整的方案

3.1 不含有shuffle算子的简单静态分区SQL

对于SQL比较简单，主要filter上游表一部分数据写入到下游表，或者是两张表简单UNION起来的任务，这种任务的分区的数目主要是由读取文件时Partition数据决定的

因为从spark 2.4 以来，对于hive orc表和parquet支持已经很不错了，为了加快运行速率，建议开启了hive orc/parquet表自动转为DataSource的参数。对于这种DataSource表的类型，Partition数目主要是由如下三个参数控制其关系

spark.sql.files.maxPartitionBytes;

spark.sql.files.opencostinbytes;

spark.default.parallelism;

其关系如下，因此可以通过调整这三个参数来输入数据的分区进行调整

val maxsplitBytes=math.min(defaultMaxSplitBytes,Math.max(opencostinbytes,bytesPerCore))



而非DataSource表，使用CombineInputFormat来读取数据，因此主要是通过MR参数来进行分片调整：

mapreduce.input.fileinputformat.split.minsize

虽然可以通过调整输入数据的分片来对最终文件数据量进行调整，但是这样的调整的是不稳定的，上游数据大小发生一些轻微的变化，就可能带来参数的重新适配

为了简单粗暴的解决这个问题，我们对这样的sql加了repatition的hint，引入新的shuffle,保证文件数量是一个固定值

---修改前

insert overwrite table a select emplid，stat_day from b where emplid = 'xxxx' and stat_day='2020-10-01';

---修改后

insert overwrite table a select /*+ REPARTITION(10)+*/ emplid，stat_day from b where emplid = 'xxxx' and stat_day='2020-10-01';

2.2带有shuffle算子的静态分区任务

在ISSUE SPARK-9858中，引入了一个新的参数：spark.sql.adaptive.shuffle.targetPostShuffleInputSize大小的数据，因此这个参数我们也可以用来在一定程度上控制生成的文件数量

2.3 动态分区任务

动态分区任务因为存在着分区这一变量，单纯调整rdd这边的partition数目很难把控整体的文件数量。在hive里，可以通过设置hive.optimize.sort.dynamic.partition来缓解动态分区产生文件过多导致任务执行时task节点经常oom的状况。这样的参数会引入新的shuffle，来对数据进行重排序，讲相同的partition分给同一个task处理，从而避免了一个task同时持有多个文件句柄。因此，可以借助这样的思想，使用distribute by 语句来修改sql，从而控制文件数量。一般而言，假设我们像对于每个分区生成不超过N个文件，则可以在sql末尾增加distribute by【动态分区列】，cell(rand()*N)

insert overwrite table a  partition(stat_year,stat_month)select emplid，stat_day from b where emplid = 'xxxx' ;

insert overwrite table a  partition(stat_year,stat_month)select emplid，stat_day from b where emplid = 'xxxx' distribute by (stat_year,stat_month,cell(rand()*5);