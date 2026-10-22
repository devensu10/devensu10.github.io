---
author: Deven su
pubDatetime: 2021-06-30T02:49:18.000Z
modDatetime: 2021-06-30T02:49:18.000Z
title: Hbase优化
slug: hbase-optimization
featured: false
draft: false
tags:
  - 数据库
description: 1.  读请求是否均衡
---
#### Hbase服务器端优化

1.  读请求是否均衡
2.  BlockCache设置是否合理
3.  HFile文件是否太多
4. Compaction是否消耗系统资源过多
5. 数据本地率是不是很低

#### Hbase客户端优化

1. scan缓存是否设置合理？
2. get是否使用批量请求？
3. 请求是否可以显式指定列簇或者列？
4. 离线批量读取请求是否设置禁止缓存？

#### HBase列簇设计优化

1. 布隆过滤器是否设置？

   布隆过滤器取值有两个——row以及rowcol，需要根据业务来确定具体使用哪种。如果业务中大多数随机查询仅仅使用row作为查询条件，布隆过滤器一定要设置为row；如果大多数随机查询使用row+column作为查询条件，布隆过滤器需要设置为rowcol。如果不确定业务查询类型，则设置为row。

#### HBase写入性能调优

![image-20210630103059260](/images/hbase-optimization/image-20210630103059260.png)

#### HBase服务器端优化

1. Region是否太少？
2. 写入请求是否均衡？
3. Utilize Flash storage for WAL

####  HBase客户端优化

1. 是否可以使用Bulkload方案写入？
2. 是否需要写WAL WAL是否需要同步写入？
3. Put是否可以同步批量提交？
4. Put是否可以异步批量提交？
5. 写入KeyValue数据是否太大？

