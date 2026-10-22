---
author: Deven su
pubDatetime: 2019-03-12T09:30:00.000Z
modDatetime: 2019-03-18T14:20:00.000Z
title: Kubernetes 知识分享：你的第一个 Deployment 和 Service
slug: kubernetes-first-deployment-and-service
featured: false
draft: false
tags:
  - kubernetes
  - tutorial
description: 从零开始在 Kubernetes 上部署第一个应用，理解 Pod、Deployment 和 Service 的关系。
---

从零开始在 Kubernetes 上部署第一个应用，理解 Pod、Deployment 和 Service 的关系。

## Table of contents

## 前言

刚开始接触 Kubernetes 时，最容易被一堆概念吓住：Pod、Deployment、ReplicaSet、Service……其实入门只需要记住一件事：**Deployment 管 Pod，Service 管访问**。本文用一个 nginx 例子走通整个流程。

## 前置条件

- 本地安装了 [Minikube](https://minikube.sigs.k8s.io/) 或 kind
- `kubectl` 已配置好

## 创建 Deployment

```yaml file="deployment.yaml"
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
        - name: nginx
          image: nginx:1.15
          ports:
            - containerPort: 80
```

```bash
kubectl apply -f deployment.yaml
kubectl get pods -w
```

Deployment 会创建一个 ReplicaSet，由它确保始终有 3 个 Pod 在运行。某个 Pod 挂掉时会自动重建——这就是「自愈」。

## 暴露服务

Pod 的 IP 是临时的，重建后会变化，所以不能直接访问 Pod。需要一个 Service 提供稳定的访问入口：

```yaml file="service.yaml"
apiVersion: v1
kind: Service
metadata:
  name: web
spec:
  type: NodePort
  selector:
    app: web
  ports:
    - port: 80
      targetPort: 80
```

```bash
kubectl apply -f service.yaml
minikube service web
```

Service 通过 `selector` 找到带有 `app: web` 标签的 Pod，把流量转发过去。

## 常用排查命令

| 命令 | 用途 |
| ---- | ---- |
| `kubectl get pods` | 查看 Pod 状态 |
| `kubectl describe pod <name>` | 查看事件和错误详情 |
| `kubectl logs <pod>` | 查看容器日志 |
| `kubectl rollout status deployment/web` | 查看发布进度 |

## 小结

- Pod 是最小调度单位，但生产上不要直接创建 Pod
- Deployment 负责副本数和滚动更新
- Service 提供稳定的访问入口，通过标签选择器关联 Pod

下一篇我们会讲如何用 ConfigMap 和 Secret 管理应用配置。
