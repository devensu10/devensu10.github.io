---
author: Deven su
pubDatetime: 2020-04-22T08:30:00.000Z
modDatetime: 2020-04-28T11:15:00.000Z
title: Kubernetes Ingress：七层流量路由经验分享
slug: kubernetes-ingress-traffic-routing
featured: false
draft: false
tags:
  - kubernetes
  - networking
  - ingress
description: 用 Ingress 统一管理集群入口流量，实现基于域名和路径的路由、TLS 终止与灰度发布。
---

用 Ingress 统一管理集群入口流量，实现基于域名和路径的路由、TLS 终止与灰度发布。

## Table of contents

## 为什么需要 Ingress

如果每个 Service 都用 `LoadBalancer` 类型暴露，云上每个 LB 都要单独计费，而且无法做基于路径的路由。Ingress 是七层（HTTP）的入口抽象：一个入口，按域名和路径分发到不同 Service。

```
                ┌──────────────┐
  api.example.com ──→ │            │ ──→ api-svc:80
                      │  Ingress   │
  example.com/blog ──→ │ Controller │ ──→ blog-svc:80
                └──────────────┘
```

## 安装 Ingress Controller

Ingress 资源本身只是规则声明，需要一个 Controller 来真正干活。常用的是 ingress-nginx：

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/cloud/deploy.yaml
```

## 路由规则

```yaml file="ingress.yaml"
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: main
spec:
  ingressClassName: nginx
  rules:
    - host: example.com
      http:
        paths:
          - path: /blog
            pathType: Prefix
            backend:
              service:
                name: blog-svc
                port:
                  number: 80
    - host: api.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: api-svc
                port:
                  number: 80
```

> [!CAUTION]
> `pathType` 很关键：`Prefix` 是前缀匹配，`Exact` 是精确匹配。写错会导致 404，这是新手最常见的坑。

## TLS 终止

把证书存进 Secret，在 Ingress 中引用即可，证书校验在入口处完成，后端服务只需处理 HTTP：

```yaml
spec:
  tls:
    - hosts:
        - example.com
      secretName: example-com-tls
```

```bash
kubectl create secret tls example-com-tls --cert=tls.crt --key=tls.key
```

## 基于注解的灰度发布

ingress-nginx 支持通过注解做 canary 分流，下面把 10% 的流量打到新版本：

```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/canary: "true"
    nginx.ingress.kubernetes.io/canary-weight: "10"
```

## 小结

- Ingress 统一了集群的七层入口，省 LB、省证书管理成本
- Controller 是规则的实际执行者，社区最常用 ingress-nginx
- 注解可以做灰度、限流、重写等高级能力，但会绑定具体 Controller

下一篇讲如何用 Helm 把这些 YAML 模板化，管理多环境发布。
