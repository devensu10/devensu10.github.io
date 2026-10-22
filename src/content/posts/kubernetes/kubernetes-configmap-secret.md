---
author: Deven su
pubDatetime: 2019-11-05T10:00:00.000Z
modDatetime: 2019-11-12T16:40:00.000Z
title: Kubernetes 配置管理：ConfigMap 与 Secret 的正确用法
slug: kubernetes-configmap-and-secret
featured: false
draft: false
tags:
  - kubernetes
  - configuration
description: 把配置从镜像中剥离出来，用 ConfigMap 和 Secret 管理不同环境的应用配置。
---

把配置从镜像中剥离出来，用 ConfigMap 和 Secret 管理不同环境的应用配置。

## Table of contents

## 为什么需要配置管理

如果把数据库地址、功能开关硬编码在镜像里，那么 dev、staging、prod 三个环境就需要打三个镜像——这违背了「一次构建，到处运行」的原则。Kubernetes 提供了两种资源来解决这个问题：

- **ConfigMap**：普通配置，如环境变量、配置文件
- **Secret**：敏感配置，如密码、Token，内容以 base64 编码存储

## ConfigMap

```yaml file="configmap.yaml"
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  LOG_LEVEL: "debug"
  application.yaml: |
    server:
      port: 8080
    feature:
      newUI: true
```

## Secret

```yaml file="secret.yaml"
apiVersion: v1
kind: Secret
metadata:
  name: db-secret
type: Opaque
stringData:
  username: admin
  password: s3cr3t
```

> [!NOTE]
> 用 `stringData` 可以直接写明文，K8s 会自动做 base64 编码。注意 base64 只是编码不是加密，生产环境建议配合 RBAC 限制访问，或接入外部密钥管理（如 Vault、Sealed Secrets）。

## 在 Pod 中使用

### 环境变量方式

```yaml
env:
  - name: LOG_LEVEL
    valueFrom:
      configMapKeyRef:
        name: app-config
        key: LOG_LEVEL
  - name: DB_PASSWORD
    valueFrom:
      secretKeyRef:
        name: db-secret
        key: password
```

### 挂载为文件

```yaml
volumeMounts:
  - name: config
    mountPath: /etc/app
volumes:
  - name: config
    configMap:
      name: app-config
```

## 两种方式的区别

| 方式 | 更新后是否生效 | 适用场景 |
| ---- | -------------- | -------- |
| 环境变量 | 不生效，需重启 Pod | 启动时读取一次 |
| 文件挂载 | 自动更新（有延迟，约 1 分钟） | 支持热加载的应用 |

## 小结

- 非敏感配置用 ConfigMap，敏感配置用 Secret
- 优先用文件挂载，配合应用的热加载能力实现配置更新
- 命名建议带上应用名后缀，避免多个应用之间互相覆盖
