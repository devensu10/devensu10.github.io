---
author: Deven su
pubDatetime: 2021-02-19T02:31:30.000Z
modDatetime: 2021-02-19T02:31:30.000Z
title: 自定义udf函数
slug: hive-custom-udf
featured: false
draft: false
tags:
  - 大数据
description: 使用Intellij工具开发Hive的UDF函数，进行编译；
---
## UDF函数开发

使用Intellij工具开发Hive的UDF函数，进行编译；

1.使用Intellij工具通过Maven创建一个Java工程，并添加依赖
![在这里插入图片描述](/images/hive-custom-udf/2019031110115840.png)
2.Java示例代码如下

```
import org.apache.hadoop.hive.ql.exec.UDF;

/**
 * @Auther: w 截取20180611 前四位（简单示例）
 * @Date: 2019/3/11 10:00
 * @Description:
 */
public class CutUdf extends UDF {

    public static String evaluate(String str) {

        if(null == str || str.length()==0){
            return "";
        }else{
            return str.substring(0,4);
        }
    }
}
123456789101112131415161718
```

此处使用一个简单的日期截取来做示例，注意此处需要集成UDF类，重写evaluate方法，来实现自己定义函数。

3.编译jar包

前提条件是已配置Maven的环境变量，命令行进入工程目录，执行如下命令：
**mvn clean package**
或者
直接在IDE maven 的插件里面进行打包
![在这里插入图片描述](/images/hive-custom-udf/20190311101511552.png)

## 3.Hive使用自定义函数（UDF）

将章节2中编译好的sql-udf-demo-1.0.jar上传到集群服务器；

### 3.1创建临时UDF

#### 1.进入Hive的shell命令行，执行如下命令，创建临时函数

```
add jar /var/lib/hadoop-hdfs/sql-udf-demo-1.0.jar;
create temporary function CutUdf as 'com.demo.hive.CutUdf';
12
```

![在这里插入图片描述](/images/hive-custom-udf/20190311102441479.png)

#### 2.在命令行测试该UDF函数

select CutUdf (yuqi_time), yuqi_time from marketing.sp_yuqi limit 10 ;
![在这里插入图片描述](/images/hive-custom-udf/20190311103051910.png)

### 3.2创建永久UDF

#### 1.在HDFS中创建相应目录，将sql-udf-demo-1.0.jar包上传至该目录

[hdfs@cdh21 ~]$ hadoop fs -mkdir /udf
[hdfs@cdh21 ~]$ hadoop fs -put sql-udf-demo-1.0.jar /udf

#### 2.进入Hive的shell命令行，执行如下命令创建永久的UDF

```
create function CutUdf as 'com.demo.hive.CutUdf' using jar  'hdfs://cdh21:8020/udf/sql-udf-demo-1.0.jar';
1
```

注意：在创建的时候如果带有数据库名，则该UDF函数只对该库生效，其它库无法使用该UDF函数。
在命令行测试该函数是否可用，测试与上面一样

#### 3.验证永久UDF函数是否生效

重新打开Hive CLI能正常使用创建的UDF函数。
![在这里插入图片描述](/images/hive-custom-udf/20190311103957575.png)