---
author: Deven su
pubDatetime: 2022-07-11T01:39:31.000Z
modDatetime: 2022-07-11T01:39:31.000Z
title: git使用技巧
slug: git-tips
featured: false
draft: false
tags:
  - 技术杂谈
description: 如果commit注释写错了，先要改一下注释
---
如果commit注释写错了，先要改一下注释

git commit --amend
这时候会进入vim编辑器，修改完成你要的注释后保存即可





一、

查看变更还未载入(changed but unstaged，当前没有add 的内容)的文件比对:

只需运行不带任何参数的'git diff'命令即可

二、

查看载入（stage，即已经add）而并未提交（not committed，）的变更：

可以使用'git diff --stage'命令（在git 1.6之前的版本中，使用'--cached'）

适应情形：在运行git commit（不带'-a'）之前，查看所有载入而未提交的变更内容。

三、

如果你想查看最后一次提交之后工作目录中文件的变更，你可以在git diff之后加一个HEAD来进行比对：

git diff HEAD 是上面两条的合并

适用情形：在运行'git commit -a'之前。显示所有载入的和未载入的变更。

四、

如果你想对两次快照做差异比对，也即项目的两个版本之间比对--直接在git diff后跟上要比对的两个版本号即可：

比较两个版本号码的src 文件夹的差异：git diff 版本号码1 版本号码2 src