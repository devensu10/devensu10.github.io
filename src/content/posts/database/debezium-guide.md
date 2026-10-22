---
author: Deven su
pubDatetime: 2021-06-16T09:51:44.000Z
modDatetime: 2021-06-16T09:51:44.000Z
title: debezium使用
slug: debezium-guide
featured: false
draft: false
tags:
  - 数据库
description: docker run -it --rm --name zookeeper -p 2181:2181 -p 2888:2888 -p 3888:3888 debezium/zookeeper:latest
---
## docker环境安装

```shell
# zookeeper安装
docker run -it --rm --name zookeeper -p 2181:2181 -p 2888:2888 -p 3888:3888 debezium/zookeeper:latest

# kafka安装
docker run -it --rm --name kafka -p 9092:9092 --link zookeeper:zookeeper debezium/kafka:latest

# postgresql安装，默认用户名postgres
docker run -it --rm --name database -p 5432:5432 -e POSTGRES_PASSWORD=19930210  -d debezium/example-postgres:latest

# connect安装
docker volume create connect
docker run -itd --rm --name connect --volume connect:/kafka/connect -p 8083:8083 -e GROUP_ID=1 -e CONFIG_STORAGE_TOPIC=my_connect_configs -e OFFSET_STORAGE_TOPIC=my_connect_offsets -e STATUS_STORAGE_TOPIC=my_connect_statuses --link zookeeper:zookeeper --link kafka:kafka --link database:database debezium/connect:latest
```

## 监听数据

```shell
# 查看运行的容器
docker ps
# 进入kafka容器
docker -it exec <容器id> /bin/bash
# 查看topic
./kafka-topics.sh --bootstrap-server 192.168.227.176:9092 --list
# 开启消费者
./kafka-topics.sh --bootstrap-server 192.168.227.176:9092 --list
```

## 添加connect

1. 测试环境是否安装成功

   ```
   get ip:8083
   ```

2. 创建postgresql连接器

   以pgoutput为例，除了该选项还支持wal2json、protobuf

   ```
   post ip:8083/connectors 
   {
       "name": "test-connector",      
       "config": {
           "name": "test-connector",    
           "connector.class": "io.debezium.connector.postgresql.PostgresConnector",
           "tasks.max": "1",
           "database.hostname": "IP地址",   
           "database.port": "5432",
           "database.dbname": "postgres",
           "database.user": "postgres",
           "database.password": "xxxxx",
           "database.server.name": "my-service",
           "plugin.name": "pgoutput"
       }
   }
   ```

## 数据库模拟更改

创建表格

```sql
DROP TABLE IF EXISTS "public"."user";
CREATE TABLE "public"."user" (
  "id" int4 NOT NULL,
  "name" varchar(255) COLLATE "pg_catalog"."default",
  "age" int4
)
;
ALTER TABLE "public"."user" OWNER TO "postgres";

-- ----------------------------
-- Primary Key structure for table user
-- ----------------------------
ALTER TABLE "public"."user" ADD CONSTRAINT "user_pkey" PRIMARY KEY ("id");
```

插入数据

```sql
insert into "user" values 
(1, 'user1', 10),
(2, 'user2', 20),
(3, 'user3', 10),
(4, 'user4', 10),
(5, 'user5', 10),
(6, 'user6', 10),
(7, 'user7', 10),
(8, 'name8', 10);
```

删除数据

```sq
delete from "user" where name like 'user%';
```

修改数据

```sql
update "user" set name=name||'-test';
```

## 数据格式说明

新增一条数据

```json
{
  "schema": {
    "type": "struct",
    "fields": [
      {
        "type": "struct",
        "fields": [
          {
            "type": "int32",
            "optional": false,
            "field": "id"
          },
          {
            "type": "string",
            "optional": true,
            "field": "name"
          },
          {
            "type": "int32",
            "optional": true,
            "field": "age"
          }
        ],
        "optional": true,
        "name": "my_service.public.user.Value",
        "field": "before"
      },
      {
        "type": "struct",
        "fields": [
          {
            "type": "int32",
            "optional": false,
            "field": "id"
          },
          {
            "type": "string",
            "optional": true,
            "field": "name"
          },
          {
            "type": "int32",
            "optional": true,
            "field": "age"
          }
        ],
        "optional": true,
        "name": "my_service.public.user.Value",
        "field": "after"
      },
      {
        "type": "struct",
        "fields": [
          {
            "type": "string",
            "optional": false,
            "field": "version"
          },
          {
            "type": "string",
            "optional": false,
            "field": "connector"
          },
          {
            "type": "string",
            "optional": false,
            "field": "name"
          },
          {
            "type": "int64",
            "optional": false,
            "field": "ts_ms"
          },
          {
            "type": "string",
            "optional": true,
            "name": "io.debezium.data.Enum",
            "version": 1,
            "parameters": {
              "allowed": "true,last,false"
            },
            "default": "false",
            "field": "snapshot"
          },
          {
            "type": "string",
            "optional": false,
            "field": "db"
          },
          {
            "type": "string",
            "optional": true,
            "field": "sequence"
          },
          {
            "type": "string",
            "optional": false,
            "field": "schema"
          },
          {
            "type": "string",
            "optional": false,
            "field": "table"
          },
          {
            "type": "int64",
            "optional": true,
            "field": "txId"
          },
          {
            "type": "int64",
            "optional": true,
            "field": "lsn"
          },
          {
            "type": "int64",
            "optional": true,
            "field": "xmin"
          }
        ],
        "optional": false,
        "name": "io.debezium.connector.postgresql.Source",
        "field": "source"
      },
      {
        "type": "string",
        "optional": false,
        "field": "op"
      },
      {
        "type": "int64",
        "optional": true,
        "field": "ts_ms"
      },
      {
        "type": "struct",
        "fields": [
          {
            "type": "string",
            "optional": false,
            "field": "id"
          },
          {
            "type": "int64",
            "optional": false,
            "field": "total_order"
          },
          {
            "type": "int64",
            "optional": false,
            "field": "data_collection_order"
          }
        ],
        "optional": true,
        "field": "transaction"
      }
    ],
    "optional": false,
    "name": "my_service.public.user.Envelope"
  },
  "payload": {
    "before": null,
    "after": {
      "id": 7,
      "name": "user7",
      "age": 10
    },
    "source": {
      "version": "1.5.2.Final",
      "connector": "postgresql",
      "name": "my-service",
      "ts_ms": 1623761739799,
      "snapshot": "false",
      "db": "postgres",
      "sequence": "[null,\"34291712\"]",
      "schema": "public",
      "table": "user",
      "txId": 604,
      "lsn": 34303264,
      "xmin": null
    },
    "op": "c",
    "ts_ms": 1623761740359,
    "transaction": null
  }
}
```

修改一条数据

```json
{
  "schema": {
    "type": "struct",
    "fields": [
      {
        "type": "struct",
        "fields": [
          {
            "type": "int32",
            "optional": false,
            "field": "id"
          },
          {
            "type": "string",
            "optional": true,
            "field": "name"
          },
          {
            "type": "int32",
            "optional": true,
            "field": "age"
          }
        ],
        "optional": true,
        "name": "my_service.public.user.Value",
        "field": "before"
      },
      {
        "type": "struct",
        "fields": [
          {
            "type": "int32",
            "optional": false,
            "field": "id"
          },
          {
            "type": "string",
            "optional": true,
            "field": "name"
          },
          {
            "type": "int32",
            "optional": true,
            "field": "age"
          }
        ],
        "optional": true,
        "name": "my_service.public.user.Value",
        "field": "after"
      },
      {
        "type": "struct",
        "fields": [
          {
            "type": "string",
            "optional": false,
            "field": "version"
          },
          {
            "type": "string",
            "optional": false,
            "field": "connector"
          },
          {
            "type": "string",
            "optional": false,
            "field": "name"
          },
          {
            "type": "int64",
            "optional": false,
            "field": "ts_ms"
          },
          {
            "type": "string",
            "optional": true,
            "name": "io.debezium.data.Enum",
            "version": 1,
            "parameters": {
              "allowed": "true,last,false"
            },
            "default": "false",
            "field": "snapshot"
          },
          {
            "type": "string",
            "optional": false,
            "field": "db"
          },
          {
            "type": "string",
            "optional": true,
            "field": "sequence"
          },
          {
            "type": "string",
            "optional": false,
            "field": "schema"
          },
          {
            "type": "string",
            "optional": false,
            "field": "table"
          },
          {
            "type": "int64",
            "optional": true,
            "field": "txId"
          },
          {
            "type": "int64",
            "optional": true,
            "field": "lsn"
          },
          {
            "type": "int64",
            "optional": true,
            "field": "xmin"
          }
        ],
        "optional": false,
        "name": "io.debezium.connector.postgresql.Source",
        "field": "source"
      },
      {
        "type": "string",
        "optional": false,
        "field": "op"
      },
      {
        "type": "int64",
        "optional": true,
        "field": "ts_ms"
      },
      {
        "type": "struct",
        "fields": [
          {
            "type": "string",
            "optional": false,
            "field": "id"
          },
          {
            "type": "int64",
            "optional": false,
            "field": "total_order"
          },
          {
            "type": "int64",
            "optional": false,
            "field": "data_collection_order"
          }
        ],
        "optional": true,
        "field": "transaction"
      }
    ],
    "optional": false,
    "name": "my_service.public.user.Envelope"
  },
  "payload": {
    "before": null,
    "after": {
      "id": 2,
      "name": "user2",
      "age": 30
    },
    "source": {
      "version": "1.5.2.Final",
      "connector": "postgresql",
      "name": "my-service",
      "ts_ms": 1623761827895,
      "snapshot": "false",
      "db": "postgres",
      "sequence": "[\"34303448\",\"34303448\"]",
      "schema": "public",
      "table": "user",
      "txId": 605,
      "lsn": 34303504,
      "xmin": null
    },
    "op": "u",
    "ts_ms": 1623761828018,
    "transaction": null
  }
}
```

删除一条记录

```json
{
  "schema": {
    "type": "struct",
    "fields": [
      {
        "type": "struct",
        "fields": [
          {
            "type": "int32",
            "optional": false,
            "field": "id"
          },
          {
            "type": "string",
            "optional": true,
            "field": "name"
          },
          {
            "type": "int32",
            "optional": true,
            "field": "age"
          }
        ],
        "optional": true,
        "name": "my_service.public.user.Value",
        "field": "before"
      },
      {
        "type": "struct",
        "fields": [
          {
            "type": "int32",
            "optional": false,
            "field": "id"
          },
          {
            "type": "string",
            "optional": true,
            "field": "name"
          },
          {
            "type": "int32",
            "optional": true,
            "field": "age"
          }
        ],
        "optional": true,
        "name": "my_service.public.user.Value",
        "field": "after"
      },
      {
        "type": "struct",
        "fields": [
          {
            "type": "string",
            "optional": false,
            "field": "version"
          },
          {
            "type": "string",
            "optional": false,
            "field": "connector"
          },
          {
            "type": "string",
            "optional": false,
            "field": "name"
          },
          {
            "type": "int64",
            "optional": false,
            "field": "ts_ms"
          },
          {
            "type": "string",
            "optional": true,
            "name": "io.debezium.data.Enum",
            "version": 1,
            "parameters": {
              "allowed": "true,last,false"
            },
            "default": "false",
            "field": "snapshot"
          },
          {
            "type": "string",
            "optional": false,
            "field": "db"
          },
          {
            "type": "string",
            "optional": true,
            "field": "sequence"
          },
          {
            "type": "string",
            "optional": false,
            "field": "schema"
          },
          {
            "type": "string",
            "optional": false,
            "field": "table"
          },
          {
            "type": "int64",
            "optional": true,
            "field": "txId"
          },
          {
            "type": "int64",
            "optional": true,
            "field": "lsn"
          },
          {
            "type": "int64",
            "optional": true,
            "field": "xmin"
          }
        ],
        "optional": false,
        "name": "io.debezium.connector.postgresql.Source",
        "field": "source"
      },
      {
        "type": "string",
        "optional": false,
        "field": "op"
      },
      {
        "type": "int64",
        "optional": true,
        "field": "ts_ms"
      },
      {
        "type": "struct",
        "fields": [
          {
            "type": "string",
            "optional": false,
            "field": "id"
          },
          {
            "type": "int64",
            "optional": false,
            "field": "total_order"
          },
          {
            "type": "int64",
            "optional": false,
            "field": "data_collection_order"
          }
        ],
        "optional": true,
        "field": "transaction"
      }
    ],
    "optional": false,
    "name": "my_service.public.user.Envelope"
  },
  "payload": {
    "before": {
      "id": 2,
      "name": null,
      "age": null
    },
    "after": null,
    "source": {
      "version": "1.5.2.Final",
      "connector": "postgresql",
      "name": "my-service",
      "ts_ms": 1623761844383,
      "snapshot": "false",
      "db": "postgres",
      "sequence": "[\"34303640\",\"34303640\"]",
      "schema": "public",
      "table": "user",
      "txId": 606,
      "lsn": 34303696,
      "xmin": null
    },
    "op": "d",
    "ts_ms": 1623761844818,
    "transaction": null
  }
}
```

