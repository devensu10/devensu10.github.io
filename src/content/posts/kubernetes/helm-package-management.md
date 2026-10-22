---
author: Deven su
pubDatetime: 2020-09-15T09:00:00.000Z
modDatetime: 2020-09-21T15:30:00.000Z
title: Helm 知识分享：Kubernetes 应用的打包与多环境发布
slug: helm-kubernetes-package-management
featured: false
draft: false
tags:
  - kubernetes
  - helm
  - devops
description: 用 Helm Chart 模板化 Kubernetes 资源，通过 values 分离环境差异，实现可回滚的多环境发布。
---

用 Helm Chart 模板化 Kubernetes 资源，通过 values 分离环境差异，实现可回滚的多环境发布。

## Table of contents

## 纯 YAML 的痛点

一个应用通常有 Deployment、Service、Ingress、ConfigMap 一堆 YAML。到了多环境，复制粘贴改参数很快就失控了：dev 改了镜像 tag 忘了同步 prod，回滚时翻 git 历史找旧版本……Helm 解决的就是这两件事：**模板化**和**版本化**。

## Chart 结构

```
myapp/
├── Chart.yaml          # 元信息：名称、版本
├── values.yaml         # 默认配置
└── templates/
    ├── deployment.yaml
    ├── service.yaml
    └── ingress.yaml
```

## 模板与 values

```yaml file="templates/deployment.yaml"
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Release.Name }}-myapp
spec:
  replicas: {{ .Values.replicaCount }}
  template:
    spec:
      containers:
        - name: myapp
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          resources:
            {{- toYaml .Values.resources | nindent 12 }}
```

```yaml file="values.yaml"
replicaCount: 2
image:
  repository: registry.example.com/myapp
  tag: "1.2.0"
resources:
  requests:
    cpu: 100m
    memory: 128Mi
```

## 多环境：values 覆盖

环境差异不写进模板，而是每个环境一份 values 文件：

```bash
helm upgrade --install myapp ./myapp -f values.yaml -f values-prod.yaml -n prod
```

后加载的文件覆盖前面的，这样「差异」被收敛到一个文件里，review 时一目了然。

## 常用命令

| 命令 | 用途 |
| ---- | ---- |
| `helm template myapp ./myapp` | 本地渲染，调试用 |
| `helm upgrade --install` | 幂等部署 |
| `helm history myapp` | 查看发布历史 |
| `helm rollback myapp 3` | 回滚到第 3 版 |

> [!NOTE]
> `helm upgrade --install` 是幂等的：没装过就安装，装过就升级。CI 里统一用这条命令即可。

## 模板函数小贴士

- `default` 提供兜底值：`{{ .Values.tag | default "latest" }}`
- `required` 强制校验：`{{ required "image.tag is required" .Values.image.tag }}`
- `nindent N` 常用于嵌入 `resources` 这类嵌套块
- 给所有资源加统一的 label 约定（`app.kubernetes.io/instance` 等），方便后续用 `kubectl -l` 批量筛选

## 小结

- Chart = 模板 + values，环境差异放 values 文件
- `upgrade --install` + `rollback` 覆盖发布与回滚的闭环
- 模板里用 `required` 和 `default` 把参数错误暴露在渲染阶段，而不是部署失败时

下一篇进阶：用 Operator 模式把有状态应用的运维知识写进控制器。
