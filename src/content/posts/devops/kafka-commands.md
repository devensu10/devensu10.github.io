---
author: Deven su
pubDatetime: 2022-11-09T02:27:09.491Z
title: "Kafka 启动命令"
slug: kafka-commands
featured: false
draft: false
tags:
  - kafka
  - commands
description: "./bin/zookeeper-server-start.sh config/zookeeper.properties &"
---
./bin/zookeeper-server-start.sh config/zookeeper.properties &



./bin/kafka-server-start.sh config/server.properties &



./bin/kafka-topics.sh --list --zookeeper 127.0.0.1:2181



./bin/kafka-console-producer.sh --broker-list 127.0.0.1:9092 --topic qr-clue-source-all



./bin/kafka-console-consumer.sh --bootstrap-server 127.0.0.1:9092 --topic test --from-beginning



kafka-topics.sh --zookeeper localhost:2181/myKafka --alter --topic topic_test_01 --config max.message.bytes=1048576

kafka-topics.sh --zookeeper localhost:2181/myKafka --describe --topic topic_test_01




前台程序切换后台程序  ctrl + z bg %1

查看后台进程 jobs

jobs -l  显示pid



yarn application -list 



yarn application -kill application_1526100291229_206393