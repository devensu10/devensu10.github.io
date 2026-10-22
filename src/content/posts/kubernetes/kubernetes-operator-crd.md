---
author: Deven su
pubDatetime: 2021-06-08T10:30:00.000Z
modDatetime: 2021-06-15T17:00:00.000Z
title: Kubernetes Operator 开发：用 CRD 和控制器封装运维知识
slug: kubernetes-operator-crd-controller
featured: false
draft: false
tags:
  - kubernetes
  - operator
  - golang
description: 深入 Operator 模式：自定义 CRD，用 controller-runtime 编写 Reconcile 循环，把有状态应用的运维经验代码化。
---

深入 Operator 模式：自定义 CRD，用 controller-runtime 编写 Reconcile 循环，把有状态应用的运维经验代码化。

## Table of contents

## 从 Helm 到 Operator

Helm 解决的是「部署」问题，但有状态应用（数据库、消息队列）的难点在**运行时运维**：备份、扩容、主从切换、版本升级。这些逻辑没法用模板表达，需要一段持续运行的代码来观察集群状态并做出反应——这就是 Operator。

Operator = CRD（自定义资源） + Controller（调谐循环）。

## 定义 CRD

```yaml file="crd.yaml"
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: pgclusters.db.example.com
spec:
  group: db.example.com
  versions:
    - name: v1
      served: true
      storage: true
      schema:
        openAPIV3Schema:
          type: object
          properties:
            spec:
              type: object
              properties:
                replicas:
                  type: integer
                  minimum: 1
                storageSize:
                  type: string
  scope: Namespaced
  names:
    kind: PGCluster
    plural: pgclusters
```

应用 CRD 后，用户就可以像用内置资源一样声明一个 `PGCluster`，剩下的交给控制器。

## Reconcile：核心调谐循环

Operator 的精髓是 **level-triggered**：不是响应「事件」，而是不断对比「期望状态（spec）」和「实际状态」，把差异收敛为零。

```go
func (r *PGClusterReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
	log := log.FromContext(ctx)

	var pg dbv1.PGCluster
	if err := r.Get(ctx, req.NamespacedName, &pg); err != nil {
		return ctrl.Result{}, client.IgnoreNotFound(err)
	}

	// 1. 确保 StatefulSet 存在且副本数符合期望
	sts := buildStatefulSet(&pg)
	if err := ctrl.SetControllerReference(&pg, sts, r.Scheme); err != nil {
		return ctrl.Result{}, err
	}
	if err := r.createOrUpdate(ctx, sts); err != nil {
		return ctrl.Result{}, err
	}

	// 2. 更新 status，反馈当前实际状态
	pg.Status.Ready = readyReplicas(ctx, &pg)
	if err := r.Status().Update(ctx, &pg); err != nil {
		return ctrl.Result{}, err
	}

	// 3. 备份还没完成？30 秒后重新调谐
	if !pg.Status.BackupCompleted {
		return ctrl.Result{RequeueAfter: 30 * time.Second}, nil
	}
	return ctrl.Result{}, nil
}
```

几个关键点：

- **幂等**：Reconcile 可能被触发任意多次，每次都要能安全重入
- **SetControllerReference**：建立 owner 关系，删除 CR 时级联回收子资源
- **Status 子资源**：spec 归用户写，status 归控制器写，职责分离
- **RequeueAfter**：长任务（备份、升级）不要阻塞，定期回来检查

## Finalizer：优雅清理

删除 CR 时，如果还有外部资源（云盘、备份）需要清理，用 finalizer 挡住删除，清理完再放行：

```go
if pg.DeletionTimestamp.IsZero() {
	if !controllerutil.ContainsFinalizer(&pg, finalizer) {
		controllerutil.AddFinalizer(&pg, finalizer)
		return ctrl.Result{}, r.Update(ctx, &pg)
	}
} else {
	if controllerutil.ContainsFinalizer(&pg, finalizer) {
		cleanupExternalResources(&pg) // 删除云盘快照等
		controllerutil.RemoveFinalizer(&pg, finalizer)
		return ctrl.Result{}, r.Update(ctx, &pg)
	}
	return ctrl.Result{}, nil
}
```

## 工程实践建议

> [!WARNING]
> - **RBAC 最小权限**：控制器只需要它管理的那几种资源的权限
> - **速率限制**：controller-runtime 默认有指数退避，避免故障资源打爆 API Server
> - **可观测性**：暴露 reconcile 次数、失败率、队列深度等指标
> - **测试**：用 envtest 起一个本地控制面跑集成测试，别只靠单测 mock

## 小结

- Operator 把「运维手册」变成了持续运行的代码
- 核心是声明式 API + level-triggered 的调谐循环，而非事件驱动
- Finalizer、owner reference、status 子资源是三个必须掌握的机制
- 从简单的状态同步做起，再逐步加备份、升级等复杂运维逻辑
