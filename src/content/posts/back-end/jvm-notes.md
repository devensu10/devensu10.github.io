---
author: Deven su
pubDatetime: 2022-12-27T10:51:15.000Z
modDatetime: 2022-12-27T10:51:15.000Z
title: jvm
slug: jvm-notes
featured: false
draft: false
tags:
  - 后端
description: !image-20221227174757765
---
![image-20221227174757765](/posts/jvm-notes/image-20221227174757765.png)

常用代码 会被编译到本地，由编译器执行，就可以不用一句一句解释执行

java跟jvm无关  

任何语言能变成class 就可以放在jvm执行

jvm是一种规范

虚拟出来的一台计算机  有自己的汇编语言（字节码指令集）

内存管理

![image-20221227175831970](/posts/jvm-notes/image-20221227175831970.png)



![image-20221227180230827](/posts/jvm-notes/image-20221227180230827.png)



class文件结构

有文件头 cafe babe

有版本号

常量池

接口个数

属性个数

方法个数

。。。



加载过程

1.loading

 class文件装载进内存

2.linking

​		1.verification 校验 符不符合class文件标准

​		2.preparation  静态变量赋成默认值

​		3.Resolution ruaisilushen  符号引用 转换为直接引用 直接指向内存

2.initializing  静态变量赋成初值





类加载器

![image-20221227183714664](/posts/jvm-notes/image-20221227183714664.png)