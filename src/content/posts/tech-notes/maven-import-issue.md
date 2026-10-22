---
author: Deven su
pubDatetime: 2021-04-01T09:35:49.000Z
modDatetime: 2021-04-01T09:35:49.000Z
title: maven导包出现问题
slug: maven-import-issue
featured: false
draft: false
tags:
  - 技术杂谈
description: 在Maven命令后加入参数“-Dmaven.wagon.http.ssl.insecure=true -Dmaven.wagon.http.ssl.allowall=true”
---
在Maven命令后加入参数“-Dmaven.wagon.http.ssl.insecure=true -Dmaven.wagon.http.ssl.allowall=true”

这样设置可以跳过证书检查，然后maven clean,compile,再install就可以解决这个问题了
————————————————
版权声明：本文为CSDN博主「xxaann」的原创文章，遵循CC 4.0 BY-SA版权协议，转载请附上原文出处链接及本声明。
原文链接：https://blog.csdn.net/xxaann/article/details/104794669