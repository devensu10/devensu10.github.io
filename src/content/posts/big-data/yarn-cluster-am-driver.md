---
author: Deven su
pubDatetime: 2023-02-20T02:28:01.079Z
title: "yarn-cluster模式下AM和Driver启动过程"
slug: yarn-cluster-am-driver
featured: false
draft: false
tags:
  - big-data
  - mindmap
description: "Yarn-cluster 模式下 ApplicationMaster 与 Driver 的完整启动流程梳理。"
---

![思维导图缩略图](/posts/yarn-cluster-am-driver/thumbnail.png)

## 1、cluster模式下ApplicationMaster进程执行的是org.apache.spark.deploy.yarn.ApplicationMaster入口类

## main()方法会创建YarnAMClient，YarnAMClient主要作用向ResourceManager注册ApplicationMaster；创建ApplicationMaster实例，调用ApplicationMaster.run()方法启动ApplicationMaster实例

## 在cluster模式下，run()方法执行runDriver()，runDriver()方法中会单独启动一个线程来执行用户指定的class入口类，通过反射来执行类的main()方法，此时我们的用户代码开始被执行，Driver正式启动

### driver启动之后，YarnAMClient会向ResourceManager注册ApplicationMaster，包括AM的hostname，端口，ui地址等。（其实是通过YarnAMClient内部封装的AMRMClient客户端与ResourceManager通信，AMRMClient在org.apache.hadoop.yarn.client.api中）。

- startUserApplication()方法实现如下，主要就是创建一个新线程来执行用户入口类的main方法，同时会将用户传递的参数一并传递进去。此时，就意味着Driver启动了，不过这里Driver并非是一个单独的进程，而是运行在ApplicationMaster中的一个线程。

### 注册完AM之后，会创建YarnAllocator，YarnAllocator负责向ResourceManager申请container资源，并在container上启动Executor，主要实现在YarnAllocator.allocateResources()。主线程会首先调用YarnAllocator.allocateResources()进行一次资源调度

### 创建reporterThread线程，reporterThread会循环的调用YarnAllocator.allocateResources()进行资源的请求和使用。

## Container资源调度和Executor启动的实现

### ApplicationMaster中会创建YarnAllocator，主线程会首先调用一次YarnAllocator.allocateResources()进行资源请求分配，接下来会创建reportThread线程，该线程会循环不断的调用YarnAllocator.allocateResources()，所有的操作都在allocateResources()中

### YarnAllocator首先会创建ContainerRequest，ContainerRequest的请求数=总的executor数，对于固定executor数量（即没有配置executor动态分配）的application，ContainerRequest请求的container是任意节点的，即完全由ResourceManager随机分配。如果Executor是动态分配的，例如streaming中可配，那么会尽可能按照最大化数据本地策略请求container。

### 创建完的ContainerRequest会添加到amClient中的remoteRequestsTable这个map中，后面对container进行筛选匹配就是通过这个remoteRequestsTable进行的，同时这些请求也会添加到ask集合中，封装成ResourceRequest，用于amClient向ResourceManager提交请求

### amClient向ResourceManager提交资源请求，等待RM回复，获取RM给分配的containers

### 对分配到的containers进行筛选，匹配之前的ContainerRequest，满足请求的container才会被认为是可用的。一般情况下，ContainerRequest是任意节点，RM分配的container都能满足需求。某些情况下container可能不满足，那么会把不满足的container资源释放掉

### 对5中筛选完的container，每个container被封装为ExecutorRunnable，由一个独立的线程来启动。具体是创建ContainerLaunchContext，由nmClient(NodeManager客户端)负责启动Container，Container进程启动的入口类是org.apache.spark.executor.CoarseGrainedExecutorBackend
