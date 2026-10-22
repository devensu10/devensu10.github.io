---
author: Deven su
pubDatetime: 2021-05-19T01:52:07.000Z
modDatetime: 2021-05-19T01:52:07.000Z
title: yarn相关命令
slug: yarn-cheatsheet
featured: false
draft: false
tags:
  - 后端
description: yarn applicationattempt -list application_1437364567082_0106
---
yarn applicationattempt -list application_1437364567082_0106

查询相关应用名称

yarn application -list -appStates ACCEPTED





ARN命令是调用bin/yarn脚本文件，如果运行yarn脚本没有带任何参数，则会打印yarn所有命令的描述。

使用: yarn [--config confdir] COMMAND [--loglevel loglevel] [GENERIC_OPTIONS] [COMMAND_OPTIONS]
YARN有一个参数解析框架，采用解析泛型参数以及运行类。

 

| 命令参数                | 描述                                                         |
| ----------------------- | ------------------------------------------------------------ |
| --config confdir        | 指定一个默认的配置文件目录，默认值是： ${HADOOP_PREFIX}/conf. |
| --loglevel loglevel     | 重载Log级别。有效的日志级别包含：FATAL, ERROR, WARN, INFO, DEBUG, and TRACE。默认是INFO。 |
| GENERIC_OPTIONS         | YARN支持表A的通用命令项。                                    |
| COMMAND COMMAND_OPTIONS | YARN分为用户命令和管理员命令。                               |


表A：
 

| 通用项                                       | Description                                             |
| -------------------------------------------- | ------------------------------------------------------- |
| -archives <comma separated list of archives> | 用逗号分隔计算中未归档的文件。 仅仅针对JOB。            |
| -conf <configuration file>                   | 制定应用程序的配置文件。                                |
| -D <property>=<value>                        | 使用给定的属性值。                                      |
| -files <comma separated list of files>       | 用逗号分隔的文件,拷贝到Map reduce机器，仅仅针对JOB      |
| -jt <local> or <resourcemanager:port>        | 指定一个ResourceManager. 仅仅针对JOB。                  |
| -libjars <comma seperated list of jars>      | 将用逗号分隔的jar路径包含到classpath中去，仅仅针对JOB。 |



**用户命令：**
对于Hadoop集群用户很有用的命令：

**application**
使用: yarn application [options]

| 命令选项                | 描述                                                         |
| ----------------------- | ------------------------------------------------------------ |
| -appStates <States>     | 使用-list命令，基于应用程序的状态来过滤应用程序。如果应用程序的状态有多个，用逗号分隔。 有效的应用程序状态包含 如下： ALL, NEW, NEW_SAVING, SUBMITTED, ACCEPTED, RUNNING, FINISHED, FAILED, KILLED |
| -appTypes <Types>       | 使用-list命令，基于应用程序类型来过滤应用程序。如果应用程序的类型有多个，用逗号分隔。 |
| -list                   | 从RM返回的应用程序列表，使用-appTypes参数，支持基于应用程序类型的过滤，使用-appStates参数，支持对应用程序状态的过滤。 |
| -kill <ApplicationId>   | kill掉指定的应用程序。                                       |
| -status <ApplicationId> | 打印应用程序的状态。                                         |

示例1：
 

```
[hduser@hadoop0 bin]$ ./yarn application -list -appStates ACCEPTED



15/08/10 11:48:43 INFO client.RMProxy: Connecting to ResourceManager at hadoop1/10.0.1.41:8032



Total number of applications (application-types: [] and states: [ACCEPTED]):1



Application-Id                  Application-Name Application-Type User   Queue   State    Final-State Progress Tracking-URL



application_1438998625140_1703  MAC_STATUS   MAPREDUCE    hduser default ACCEPTED UNDEFINED   0%       N/A
```

 


示例2：
 

```
[hduser@hadoop0 bin]$ ./yarn application -list



15/08/10 11:43:01 INFO client.RMProxy: Connecting to ResourceManager at hadoop1/10.0.1.41:8032



Total number of applications (application-types: [] and states: [SUBMITTED, ACCEPTED, RUNNING]):1



Application-Id                 Application-Name Application-Type  User   Queue   State    Final-State   Progress Tracking-URL



application_1438998625140_1701 MAC_STATUS   MAPREDUCE     hduser default ACCEPTED UNDEFINED 0%   N/A
```

 


示例3：
 

```
[hduser@hadoop0 bin]$ ./yarn application -kill application_1438998625140_1705



15/08/10 11:57:41 INFO client.RMProxy: Connecting to ResourceManager at hadoop1/10.0.1.41:8032



Killing application application_1438998625140_1705



15/08/10 11:57:42 INFO impl.YarnClientImpl: Killed application application_1438998625140_1705
```





**applicationattempt**
使用: yarn applicationattempt [options]
 

| 命令选项                         | 描述                                                         |
| -------------------------------- | ------------------------------------------------------------ |
| -help                            | 帮助                                                         |
| -list <ApplicationId>            | 获取到应用程序尝试的列表，其返回值ApplicationAttempt-Id 等于 <Application Attempt Id> |
| -status <Application Attempt Id> | 打印应用程序尝试的状态。                                     |

打印应用程序尝试的报告。
示例1：
 

```
[hadoop@hadoopcluster78 bin]$ yarn applicationattempt -list application_1437364567082_0106



15/08/10 20:58:28 INFO client.RMProxy: Connecting to ResourceManager at hadoopcluster79/10.0.1.79:8032



Total number of application attempts :1



ApplicationAttempt-Id                  State    AM-Container-Id                        Tracking-URL



appattempt_1437364567082_0106_000001   RUNNING  container_1437364567082_0106_01_000001 http://hadoopcluster79:8088/proxy/application_1437364567082_0106/
```

 


示例2：

```
[cloudera-scm@app7 ~]$ yarn applicationattempt -status appattempt_1540201000392_0038_000001



18/10/24 17:45:30 INFO client.RMProxy: Connecting to ResourceManager at dmp-b4/10.170.0.23:8032



Application Attempt Report : 



	ApplicationAttempt-Id : appattempt_1540201000392_0038_000001



	State : RUNNING



	AMContainer : container_1540201000392_0038_01_000001



	Tracking-URL : http://dmp-b4:8088/proxy/application_1540201000392_0038/



	RPC Port : 0



	AM Host : 10.170.0.28



	Diagnostics : 
```

 



**classpath**

使用: yarn classpath
 

打印需要得到Hadoop的jar和所需要的lib包路径
 

```
[cloudera-scm@app7 ~]$ yarn classpath



/etc/hadoop/conf:/etc/hadoop/conf:/etc/hadoop/conf:/opt/cloudera/parcels/CDH-5.14.0-1.cdh5.14.0.p0.24/lib/hadoop/libexec/../../hadoop/lib/*:/opt/cloudera/parcels/CDH-5.14.0-1.cdh5.14.0.p0.24/lib/hadoop/libexec/../../hadoop/.//*:/opt/cloudera/parcels/CDH-5.14.0-1.cdh5.14.0.p0.24/lib/hadoop/libexec/../../hadoop-hdfs/./:/opt/cloudera/parcels/CDH-5.14.0-1.cdh5.14.0.p0.24/lib/hadoop/libexec/../../hadoop-hdfs/lib/*:/opt/cloudera/parcels/CDH-5.14.0-1.cdh5.14.0.p0.24/lib/hadoop/libexec/../../hadoop-hdfs/.//*:/opt/cloudera/parcels/CDH-5.14.0-1.cdh5.14.0.p0.24/lib/hadoop/libexec/../../hadoop-yarn/lib/*:/opt/cloudera/parcels/CDH-5.14.0-1.cdh5.14.0.p0.24/lib/hadoop/libexec/../../hadoop-yarn/.//*:/opt/cloudera/parcels/CDH/lib/hadoop-mapreduce/lib/*:/opt/cloudera/parcels/CDH/lib/hadoop-mapreduce/.//*:/opt/cloudera/parcels/CDH-5.14.0-1.cdh5.14.0.p0.24/lib/hadoop/libexec/../../hadoop-yarn/.//*:/opt/cloudera/parcels/CDH-5.14.0-1.cdh5.14.0.p0.24/lib/hadoop/libexec/../../hadoop-yarn/lib/*
```




**container**
使用: yarn container [options]
 

| 命令选项                       | 描述                         |
| ------------------------------ | ---------------------------- |
| -help                          | 帮助                         |
| -list <Application Attempt Id> | 应用程序尝试的Containers列表 |
| -status <ContainerId>          | 打印Container的状态          |

打印container(s)的报告
示例1：

 

```
[hadoop@hadoopcluster78 bin]$ yarn container -list appattempt_1437364567082_0106_01



15/08/10 20:45:45 INFO client.RMProxy: Connecting to ResourceManager at hadoopcluster79/10.0.1.79:8032



Total number of containers :25



                  Container-Id            Start Time             Finish Time                   State                    Host                                LOG-URL



container_1437364567082_0106_01_000028         1439210458659                       0                 RUNNING    hadoopcluster83:37140   //hadoopcluster83:8042/node/containerlogs/container_1437364567082_0106_01_000028/hadoop



container_1437364567082_0106_01_000016         1439210314436                       0                 RUNNING    hadoopcluster84:43818   //hadoopcluster84:8042/node/containerlogs/container_1437364567082_0106_01_000016/hadoop



container_1437364567082_0106_01_000019         1439210338598                       0                 RUNNING    hadoopcluster83:37140   //hadoopcluster83:8042/node/containerlogs/container_1437364567082_0106_01_000019/hadoop



container_1437364567082_0106_01_000004         1439210314130                       0                 RUNNING    hadoopcluster82:48622   //hadoopcluster82:8042/node/containerlogs/container_1437364567082_0106_01_000004/hadoop



container_1437364567082_0106_01_000008         1439210314130                       0                 RUNNING    hadoopcluster82:48622   //hadoopcluster82:8042/node/containerlogs/container_1437364567082_0106_01_000008/hadoop



container_1437364567082_0106_01_000031         1439210718604                       0                 RUNNING    hadoopcluster83:37140   //hadoopcluster83:8042/node/containerlogs/container_1437364567082_0106_01_000031/hadoop



container_1437364567082_0106_01_000020         1439210339601                       0                 RUNNING    hadoopcluster83:37140   //hadoopcluster83:8042/node/containerlogs/container_1437364567082_0106_01_000020/hadoop



container_1437364567082_0106_01_000005         1439210314130                       0                 RUNNING    hadoopcluster82:48622   //hadoopcluster82:8042/node/containerlogs/container_1437364567082_0106_01_000005/hadoop



container_1437364567082_0106_01_000013         1439210314435                       0                 RUNNING    hadoopcluster84:43818   //hadoopcluster84:8042/node/containerlogs/container_1437364567082_0106_01_000013/hadoop



container_1437364567082_0106_01_000022         1439210368679                       0                 RUNNING    hadoopcluster84:43818   //hadoopcluster84:8042/node/containerlogs/container_1437364567082_0106_01_000022/hadoop



container_1437364567082_0106_01_000021         1439210353626                       0                 RUNNING    hadoopcluster83:37140   //hadoopcluster83:8042/node/containerlogs/container_1437364567082_0106_01_000021/hadoop



container_1437364567082_0106_01_000014         1439210314435                       0                 RUNNING    hadoopcluster84:43818   //hadoopcluster84:8042/node/containerlogs/container_1437364567082_0106_01_000014/hadoop



container_1437364567082_0106_01_000029         1439210473726                       0                 RUNNING    hadoopcluster80:42366   //hadoopcluster80:8042/node/containerlogs/container_1437364567082_0106_01_000029/hadoop



container_1437364567082_0106_01_000006         1439210314130                       0                 RUNNING    hadoopcluster82:48622   //hadoopcluster82:8042/node/containerlogs/container_1437364567082_0106_01_000006/hadoop



container_1437364567082_0106_01_000003         1439210314129                       0                 RUNNING    hadoopcluster82:48622   //hadoopcluster82:8042/node/containerlogs/container_1437364567082_0106_01_000003/hadoop



container_1437364567082_0106_01_000015         1439210314436                       0                 RUNNING    hadoopcluster84:43818   //hadoopcluster84:8042/node/containerlogs/container_1437364567082_0106_01_000015/hadoop



container_1437364567082_0106_01_000009         1439210314130                       0                 RUNNING    hadoopcluster82:48622   //hadoopcluster82:8042/node/containerlogs/container_1437364567082_0106_01_000009/hadoop



container_1437364567082_0106_01_000030         1439210708467                       0                 RUNNING    hadoopcluster83:37140   //hadoopcluster83:8042/node/containerlogs/container_1437364567082_0106_01_000030/hadoop



container_1437364567082_0106_01_000012         1439210314435                       0                 RUNNING    hadoopcluster84:43818   //hadoopcluster84:8042/node/containerlogs/container_1437364567082_0106_01_000012/hadoop



container_1437364567082_0106_01_000027         1439210444354                       0                 RUNNING    hadoopcluster84:43818   //hadoopcluster84:8042/node/containerlogs/container_1437364567082_0106_01_000027/hadoop



container_1437364567082_0106_01_000026         1439210428514                       0                 RUNNING    hadoopcluster83:37140   //hadoopcluster83:8042/node/containerlogs/container_1437364567082_0106_01_000026/hadoop



container_1437364567082_0106_01_000017         1439210314436                       0                 RUNNING    hadoopcluster84:43818   //hadoopcluster84:8042/node/containerlogs/container_1437364567082_0106_01_000017/hadoop



container_1437364567082_0106_01_000001         1439210306902                       0                 RUNNING    hadoopcluster80:42366   //hadoopcluster80:8042/node/containerlogs/container_1437364567082_0106_01_000001/hadoop



container_1437364567082_0106_01_000002         1439210314129                       0                 RUNNING    hadoopcluster82:48622   //hadoopcluster82:8042/node/containerlogs/container_1437364567082_0106_01_000002/hadoop



container_1437364567082_0106_01_000025         1439210414171                       0                 RUNNING    hadoopcluster83:37140   //hadoopcluster83:8042/node/containerlogs/container_1437364567082_0106_01_000025/hadoop
```



示例2：

 

```
[hadoop@hadoopcluster78 bin]$ yarn container -status container_1437364567082_0105_01_000020



15/08/10 20:28:00 INFO client.RMProxy: Connecting to ResourceManager at hadoopcluster79/10.0.1.79:8032



Container Report :



    Container-Id : container_1437364567082_0105_01_000020



    Start-Time : 1439208779842



    Finish-Time : 0



    State : RUNNING



    LOG-URL : //hadoopcluster83:8042/node/containerlogs/container_1437364567082_0105_01_000020/hadoop



    Host : hadoopcluster83:37140



    Diagnostics : null
```

 




**jar**使用: yarn jar <jar> [mainClass] args...
运行jar文件，用户可以将写好的YARN代码打包成jar文件，用这个命令去运行它。


**logs**
使用: yarn logs -applicationId <application ID> [options]
注：应用程序没有完成，该命令是不能打印日志的。

 

| 命令选项                        | 描述                                                         |
| ------------------------------- | ------------------------------------------------------------ |
| -applicationId <application ID> | 指定应用程序ID，应用程序的ID可以在yarn.resourcemanager.webapp.address配置的路径查看（即：ID） |
| -appOwner <AppOwner>            | 应用的所有者（如果没有指定就是当前用户）应用程序的ID可以在yarn.resourcemanager.webapp.address配置的路径查看（即：User） |
| -containerId <ContainerId>      | Container Id                                                 |
| -help                           | 帮助                                                         |
| -nodeAddress <NodeAddress>      | 节点地址的格式：nodename:port （端口是配置文件中:yarn.nodemanager.webapp.address参数指定） |

转存container的日志。
示例：

```
[hadoop@hadoopcluster78 bin]$ yarn logs -applicationId application_1437364567082_0104  -appOwner hadoop



15/08/10 17:59:19 INFO client.RMProxy: Connecting to ResourceManager at hadoopcluster79/10.0.1.79:8032



Container: container_1437364567082_0104_01_000003 on hadoopcluster82_48622



============================================================================



LogType: stderr



LogLength: 0



Log Contents:



LogType: stdout



LogLength: 0



Log Contents:



LogType: syslog



LogLength: 3673



Log Contents:



2015-08-10 17:24:01,565 WARN [main] org.apache.hadoop.conf.Configuration: job.xml:an attempt to override final parameter: mapreduce.job.end-notification.max.retry.interval;  Ignoring.



2015-08-10 17:24:01,580 WARN [main] org.apache.hadoop.conf.Configuration: job.xml:an attempt to override final parameter: mapreduce.job.end-notification.max.attempts;  Ignoring.



。。。。。。此处省略N万个字符



// 下面的命令，根据APP的所有者查看LOG日志，因为application_1437364567082_0104任务我是用hadoop用户启动的，所以打印的是如下信息：



[hadoop@hadoopcluster78 bin]$ yarn logs -applicationId application_1437364567082_0104  -appOwner root



15/08/10 17:59:25 INFO client.RMProxy: Connecting to ResourceManager at hadoopcluster79/10.0.1.79:8032



Logs not available at /tmp/logs/root/logs/application_1437364567082_0104



Log aggregation has not completed or is not enabled.
```

 

 


**node**
使用: yarn node [options]
 

| 命令选项         | 描述                                                         |
| ---------------- | ------------------------------------------------------------ |
| -all             | 所有的节点，不管是什么状态的。                               |
| -list            | 列出所有RUNNING状态的节点。支持-states选项过滤指定的状态，节点的状态包 含：NEW，RUNNING，UNHEALTHY，DECOMMISSIONED，LOST，REBOOTED。支持--all显示所有的节点。 |
| -states <States> | 和-list配合使用，用逗号分隔节点状态，只显示这些状态的节点信息。 |
| -status <NodeId> | 打印指定节点的状态。                                         |

示例1：
 

```
[hadoop@hadoopcluster78 bin]$ ./yarn node -list -all



15/08/10 17:34:17 INFO client.RMProxy: Connecting to ResourceManager at hadoopcluster79/10.0.1.79:8032



Total Nodes:4



         Node-Id         Node-State Node-Http-Address   Number-of-Running-Containers



hadoopcluster82:48622           RUNNING hadoopcluster82:8042                               0



hadoopcluster84:43818           RUNNING hadoopcluster84:8042                               0



hadoopcluster83:37140           RUNNING hadoopcluster83:8042                               0



hadoopcluster80:42366           RUNNING hadoopcluster80:8042                               0
```


示例2：
 

```
[hadoop@hadoopcluster78 bin]$ ./yarn node -list -states RUNNING



15/08/10 17:39:55 INFO client.RMProxy: Connecting to ResourceManager at hadoopcluster79/10.0.1.79:8032



Total Nodes:4



         Node-Id         Node-State Node-Http-Address   Number-of-Running-Containers



hadoopcluster82:48622           RUNNING hadoopcluster82:8042                               0



hadoopcluster84:43818           RUNNING hadoopcluster84:8042                               0



hadoopcluster83:37140           RUNNING hadoopcluster83:8042                               0



hadoopcluster80:42366           RUNNING hadoopcluster80:8042                               0
```

 


示例3：

```
[hadoop@hadoopcluster78 bin]$ ./yarn node -status hadoopcluster82:48622



15/08/10 17:52:52 INFO client.RMProxy: Connecting to ResourceManager at hadoopcluster79/10.0.1.79:8032



Node Report :



    Node-Id : hadoopcluster82:48622



    Rack : /default-rack



    Node-State : RUNNING



    Node-Http-Address : hadoopcluster82:8042



    Last-Health-Update : 星期一 10/八月/15 05:52:09:601CST



    Health-Report :



    Containers : 0



    Memory-Used : 0MB



    Memory-Capacity : 10240MB



    CPU-Used : 0 vcores



    CPU-Capacity : 8 vcores
```

 

 


打印节点的报告。


**queue**
使用: yarn queue [options]
 

| 命令选项            | 描述           |
| ------------------- | -------------- |
| -help               | 帮助           |
| -status <QueueName> | 打印队列的状态 |

打印队列信息。


**version**
使用: yarn version
打印hadoop的版本。


**管理员命令：**
下列这些命令对hadoop集群的管理员是非常有用的。

**daemonlog**使用:
  yarn daemonlog -getlevel <host:httpport> <classname>  yarn daemonlog -setlevel <host:httpport> <classname> <level>

 

| 参数选项                                      | 描述                                                         |
| --------------------------------------------- | ------------------------------------------------------------ |
| -getlevel <host:httpport> <classname>         | 打印运行在<host:port>的守护进程的日志级别。这个命令内部会连接http://<host:port>/logLevel?log=<name> |
| -setlevel <host:httpport> <classname> <level> | 设置运行在<host:port>的守护进程的日志级别。这个命令内部会连接http://<host:port>/logLevel?log=<name> |

针对指定的守护进程，获取/设置日志级别.
 

示例1：

 

```
[root@hadoopcluster78 ~]# hadoop daemonlog -getlevel hadoopcluster82:50075 org.apache.hadoop.hdfs.server.datanode.DataNode



Connecting to http://hadoopcluster82:50075/logLevel?log=org.apache.hadoop.hdfs.server.datanode.DataNode



Submitted Log Name: org.apache.hadoop.hdfs.server.datanode.DataNode



Log Class: org.apache.commons.logging.impl.Log4JLogger



Effective level: INFO



[root@hadoopcluster78 ~]# yarn daemonlog -getlevel hadoopcluster79:8088 org.apache.hadoop.yarn.server.resourcemanager.rmapp.RMAppImpl



Connecting to http://hadoopcluster79:8088/logLevel?log=org.apache.hadoop.yarn.server.resourcemanager.rmapp.RMAppImpl



Submitted Log Name: org.apache.hadoop.yarn.server.resourcemanager.rmapp.RMAppImpl



Log Class: org.apache.commons.logging.impl.Log4JLogger



Effective level: INFO



[root@hadoopcluster78 ~]# yarn daemonlog -getlevel hadoopcluster78:19888 org.apache.hadoop.mapreduce.v2.hs.JobHistory



Connecting to http://hadoopcluster78:19888/logLevel?log=org.apache.hadoop.mapreduce.v2.hs.JobHistory



Submitted Log Name: org.apache.hadoop.mapreduce.v2.hs.JobHistory



Log Class: org.apache.commons.logging.impl.Log4JLogger



Effective level: INFO
```

 


**nodemanager**
使用: yarn nodemanager
启动NodeManager


**proxyserver**
使用: yarn proxyserver
启动web proxy server


**resourcemanager**
使用: yarn resourcemanager [-format-state-store]
 

| 参数选项            | 描述                                                         |
| ------------------- | ------------------------------------------------------------ |
| -format-state-store | RMStateStore的格式. 如果过去的应用程序不再需要，则清理RMStateStore， RMStateStore仅仅在ResourceManager没有运行的时候，才运行RMStateStore |

启动ResourceManager


**rmadmin**
使用:
 yarn rmadmin [-refreshQueues]          [-refreshNodes]          [-refreshUserToGroupsMapping]          [-refreshSuperUserGroupsConfiguration]          [-refreshAdminAcls]          [-refreshServiceAcl]          [-getGroups [username]]          [-transitionToActive [--forceactive] [--forcemanual] <serviceId>]          [-transitionToStandby [--forcemanual] <serviceId>]          [-failover [--forcefence] [--forceactive] <serviceId1> <serviceId2>]          [-getServiceState <serviceId>]          [-checkHealth <serviceId>]          [-help [cmd]]

 

| 参数选项                                                     | 描述                                                         |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| -refreshQueues                                               | 重载队列的ACL，状态和调度器特定的属性，ResourceManager将重载mapred-queues配置文件 |
| -refreshNodes                                                | 动态刷新dfs.hosts和dfs.hosts.exclude配置，无需重启NameNode。 dfs.hosts：列出了允许连入NameNode的datanode清单（IP或者机器名） dfs.hosts.exclude：列出了禁止连入NameNode的datanode清单（IP或者机器名） 重新读取hosts和exclude文件，更新允许连到Namenode的或那些需要退出或入编的Datanode的集合。 |
| -refreshUserToGroupsMappings                                 | 刷新用户到组的映射。                                         |
| -refreshSuperUserGroupsConfiguration                         | 刷新用户组的配置                                             |
| -refreshAdminAcls                                            | 刷新ResourceManager的ACL管理                                 |
| -refreshServiceAcl                                           | ResourceManager重载服务级别的授权文件。                      |
| -getGroups [username]                                        | 获取指定用户所属的组。                                       |
| -transitionToActive [–forceactive] [–forcemanual] <serviceId> | 尝试将目标服务转为 Active 状态。如果使用了–forceactive选项，不需要核对非Active节点。如果采用了自动故障转移，这个命令不能使用。虽然你可以重写–forcemanual选项，你需要谨慎。 |
| -transitionToStandby [–forcemanual] <serviceId>              | 将服务转为 Standby 状态. 如果采用了自动故障转移，这个命令不能使用。虽然你可以重写–forcemanual选项，你需要谨慎。 |
| -failover [–forceactive] <serviceId1> <serviceId2>           | 启动从serviceId1 到 serviceId2的故障转移。如果使用了-forceactive选项，即使服务没有准备，也会尝试故障转移到目标服务。如果采用了自动故障转移，这个命令不能使用。 |
| -getServiceState <serviceId>                                 | 返回服务的状态。（注：ResourceManager不是HA的时候，时不能运行该命令的） |
| -checkHealth <serviceId>                                     | 请求服务器执行健康检查，如果检查失败，RMAdmin将用一个非零标示退出。（注：ResourceManager不是HA的时候，时不能运行该命令的） |
| -help [cmd]                                                  | 显示指定命令的帮助，如果没有指定，则显示命令的帮助。         |



**scmadmin**使用: yarn scmadmin [options]
 

| 参数选项        | 描述                  |
| --------------- | --------------------- |
| -help           | Help                  |
| -runCleanerTask | Runs the cleaner task |

Runs Shared Cache Manager admin client


**sharedcachemanager**
使用: yarn sharedcachemanager
启动Shared Cache Manager


**timelineserver**
之前yarn运行框架只有Job history server，这是hadoop2.4版本之后加的通用Job History Server，命令为Application Timeline Server，详情请看：The YARN Timeline Server

使用: yarn timelineserver
启动TimeLineServer