---
author: Deven su
pubDatetime: 2021-03-03T10:59:53.000Z
modDatetime: 2021-03-03T10:59:53.000Z
title: ES优化
slug: es-optimization
featured: false
draft: false
tags:
  - 大数据
description: Linux系统资源限制优化
---
系统层

Linux系统资源限制优化

1.关闭交换分区，防止内存置换降低性能；

将/etc/fstab 文件中包含swap的行注释

关闭交换分区 swapoff -a

2.磁盘挂载优化

noatime：禁止记录访问时间戳，提高文件系统读写性能

data=writeback：不记录data journal，提高文件系统读写性能

Barrier=0  journal关闭 barrier也关闭

Nobh：关闭buffer_head,防止内核大块数据io操作

mount -o noatime,data=writeback,barrier=0,nobh  /dev/xxx  /esdata

3.对于SSD磁盘，采用电梯调度算法

echo noop > /sys/block/sda/queue/scheduler