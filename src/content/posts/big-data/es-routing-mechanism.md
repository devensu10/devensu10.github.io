---
author: Deven su
pubDatetime: 2020-12-21T02:03:11.000Z
modDatetime: 2020-12-21T02:03:11.000Z
title: ES的路由机制
slug: es-routing-mechanism
featured: false
draft: false
tags:
  - 大数据
description: 一条数据是如何落地到对应的shard上的？
---
## [ElasticSearch——路由(_routing)机制](https://www.cnblogs.com/caoweixiong/p/12029789.html)

 

# 前言

**一条数据是如何落地到对应的shard上的？**

当索引一个文档的时候，文档会被存储到一个主分片中。 Elasticsearch 如何知道一个文档应该存放到哪个分片中呢？

 ![img](/images/es-routing-mechanism/1577453-20191212154716877-1197993517.png)

首先这肯定不会是随机的，**否则将来要获取文档的时候我们就不知道从何处寻找了**。实际上，这个过程是根据下面这个算法决定的：

```
shard_num = hash(_routing) % num_primary_shards
```

其中 _**routing** 是一个可变值，默认是文档的 **_id** 的值 ，也可以设置成一个自定义的值。 _routing 通过 hash 函数生成一个数字，然后这个数字再除以 num_of_primary_shards （主分片的数量）后得到余数 。这个分布在 0 到 number_of_primary_shards-1 之间的余数，就是我们所寻求的文档所在分片的位置。**这就解释了为什么我们要在创建索引的时候就确定好主分片的数量** **并且永远不会改变这个数量**：因为如果数量变化了，那么所有之前路由的值都会无效，文档也再也找不到了。

 

# 路由机制

假设你有一个100个分片的索引。当一个请求在集群上执行时会发生什么呢？

```
1. 这个搜索的请求会被发送到一个节点
2. 接收到这个请求的节点，将这个查询广播到这个索引的每个分片上（可能是主分片，也可能是复本分片）
3. 每个分片执行这个搜索查询并返回结果
4. 结果在通道节点上合并、排序并返回给用户
```

![img](/images/es-routing-mechanism/1577453-20191212155119515-1922627973.png)

因为默认情况下，Elasticsearch使用文档的ID（类似于关系数据库中的自增ID），如果插入数据量比较大，文档会平均的分布于所有的分片上，这导致了Elasticsearch不能确定文档的位置，

**所以它必须将这个请求广播到所有的N个分片上去执行** 这种操作会给集群带来负担，增大了网络的开销；

```

```

# 自定义路由

自定义路由的方式非常简单，只需要在插入数据的时候指定路由的key即可。虽然使用简单，但有许多的细节需要注意。我们从一个例子看起（*注：本文关于ES的命令都是在Kibana dev tool中执行的*）：



```json
// 步骤1：先创建一个名为route_test的索引，该索引有3个shard，0个副本
PUT route_test/
{
  "settings": {
    "number_of_shards": 2,
    "number_of_replicas": 0
  }
}

// 步骤2：查看shard
GET _cat/shards/route_test?v
index      shard prirep state   docs store ip         node
route_test 1     p      STARTED    0  230b 172.19.0.2 es7_02
route_test 0     p      STARTED    0  230b 172.19.0.5 es7_01

// 步骤3：插入第1条数据
PUT route_test/_doc/a?refresh
{
  "data": "A"
}

// 步骤4：查看shard
GET _cat/shards/route_test?v
index      shard prirep state   docs store ip         node
route_test 1     p      STARTED    0  230b 172.19.0.2 es7_02
route_test 0     p      STARTED    1 3.3kb 172.19.0.5 es7_01

// 步骤5：插入第2条数据
PUT route_test/_doc/b?refresh
{
  "data": "B"
}

// 步骤6：查看数据
GET _cat/shards/route_test?v
index      shard prirep state   docs store ip         node
route_test 1     p      STARTED    1 3.3kb 172.19.0.2 es7_02
route_test 0     p      STARTED    1 3.3kb 172.19.0.5 es7_01

// 步骤7：查看此时索引里面的数据
GET route_test/_search
{
  "took" : 5,
  "timed_out" : false,
  "_shards" : {
    "total" : 2,
    "successful" : 2,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 2,
      "relation" : "eq"
    },
    "max_score" : 1.0,
    "hits" : [
      {
        "_index" : "route_test",
        "_type" : "_doc",
        "_id" : "a",
        "_score" : 1.0,
        "_source" : {
          "data" : "A"
        }
      },
      {
        "_index" : "route_test",
        "_type" : "_doc",
        "_id" : "b",
        "_score" : 1.0,
        "_source" : {
          "data" : "B"
        }
      }
    ]
  }
}
```



上面这个例子比较简单，先创建了一个拥有2个shard，0个副本（为了方便观察）的索引 *route_test* 。创建完之后查看两个shard的信息，此时shard为空，里面没有任何文档（ *docs* 列为0）。接着我们插入了两条数据，每次插完之后，都检查shard的变化。通过对比可以发现 docid=a 的第一条数据写入了0号shard，docid=b 的第二条数据写入了1号 shard。需要注意的是这里的doc id我选用的是字母"a"和"b"，而非数字。原因是连续的数字很容易路由到一个shard中去。以上的过程就是不指定routing时候的默认行为。

接着，我们指定routing，看一些有趣的变化：



```json
// 步骤8：插入第3条数据
PUT route_test/_doc/c?routing=key1&refresh
{
  "data": "C"
}

// 步骤9：查看shard
GET _cat/shards/route_test?v
index      shard prirep state   docs store ip         node
route_test 1     p      STARTED    1 3.4kb 172.19.0.2 es7_02
route_test 0     p      STARTED    2 6.9kb 172.19.0.5 es7_01

// 步骤10：查看索引数据
GET route_test/_search
{
  "took" : 5,
  "timed_out" : false,
  "_shards" : {
    "total" : 2,
    "successful" : 2,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 3,
      "relation" : "eq"
    },
    "max_score" : 1.0,
    "hits" : [
      {
        "_index" : "route_test",
        "_type" : "_doc",
        "_id" : "a",
        "_score" : 1.0,
        "_source" : {
          "data" : "A"
        }
      },
      {
        "_index" : "route_test",
        "_type" : "_doc",
        "_id" : "c",
        "_score" : 1.0,
        "_routing" : "key1",
        "_source" : {
          "data" : "C"
        }
      },
      {
        "_index" : "route_test",
        "_type" : "_doc",
        "_id" : "b",
        "_score" : 1.0,
        "_source" : {
          "data" : "B"
        }
      }
    ]
  }
}
```



我们又插入了1条 docid=c 的新数据，但这次我们指定了路由，路由的值是一个字符串"key1". 通过查看shard信息，能看出这条数据路由到了0号shard。也就是说用"key1"做路由时，文档会写入到0号shard。

接着我们使用该路由再插入两条数据，但这两条数据的 docid 分别为之前使用过的 "a"和"b"，你猜一下最终结果会是什么样？



```json
// 步骤11：插入 docid=a 的数据，并指定 routing=key1
PUT route_test/_doc/a?routing=key1&refresh
{
  "data": "A with routing key1"
}

// es的返回信息为：
{
  "_index" : "route_test",
  "_type" : "_doc",
  "_id" : "a",
  "_version" : 2,
  "result" : "updated",        // 注意此处为updated，之前的三次插入返回都为created
  "forced_refresh" : true,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "failed" : 0
  },
  "_seq_no" : 2,
  "_primary_term" : 1
}

// 步骤12：查看shard
GET _cat/shards/route_test?v
index      shard prirep state   docs  store ip         node
route_test 1     p      STARTED    1  3.4kb 172.19.0.2 es7_02
route_test 0     p      STARTED    2 10.5kb 172.19.0.5 es7_01

// 步骤13：查询索引
GET route_test/_search
{
  "took" : 6,
  "timed_out" : false,
  "_shards" : {
    "total" : 2,
    "successful" : 2,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 3,
      "relation" : "eq"
    },
    "max_score" : 1.0,
    "hits" : [
      {
        "_index" : "route_test",
        "_type" : "_doc",
        "_id" : "c",
        "_score" : 1.0,
        "_routing" : "key1",
        "_source" : {
          "data" : "C"
        }
      },
      {
        "_index" : "route_test",
        "_type" : "_doc",
        "_id" : "a",
        "_score" : 1.0,
        "_routing" : "key1",
        "_source" : {
          "data" : "A with routing key1"
        }
      },
      {
        "_index" : "route_test",
        "_type" : "_doc",
        "_id" : "b",
        "_score" : 1.0,
        "_source" : {
          "data" : "B"
        }
      }
    ]
  }
}
```



之前 docid=a 的数据就在0号shard中，这次依旧写入到0号shard中了，因为docid重复，所以文档被更新了。然后再插入 docid=b 的数据：



```json
// 步骤14：插入 docid=b的数据，使用key1作为路由字段的值
PUT route_test/_doc/b?routing=key1&refresh
{
  "data": "B with routing key1"
}

// es返回的信息
{
  "_index" : "route_test",
  "_type" : "_doc",
  "_id" : "b",
  "_version" : 1,
  "result" : "created",        // 注意这里不是updated
  "forced_refresh" : true,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "failed" : 0
  },
  "_seq_no" : 3,
  "_primary_term" : 1
}

// 步骤15：查看shard信息
GET _cat/shards/route_test?v
index      shard prirep state   docs store ip         node
route_test 1     p      STARTED    1 3.4kb 172.19.0.2 es7_02
route_test 0     p      STARTED    3  11kb 172.19.0.5 es7_01

// 步骤16：查询索引内容
{
  "took" : 6,
  "timed_out" : false,
  "_shards" : {
    "total" : 2,
    "successful" : 2,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 4,
      "relation" : "eq"
    },
    "max_score" : 1.0,
    "hits" : [
      {
        "_index" : "route_test",
        "_type" : "_doc",
        "_id" : "c",
        "_score" : 1.0,
        "_routing" : "key1",
        "_source" : {
          "data" : "C"
        }
      },
      {
        "_index" : "route_test",
        "_type" : "_doc",
        "_id" : "a",
        "_score" : 1.0,
        "_routing" : "key1",
        "_source" : {
          "data" : "A with routing key1"
        }
      },
      {
        "_index" : "route_test",
        "_type" : "_doc",
        "_id" : "b",
        "_score" : 1.0,
        "_routing" : "key1",        // 和下面的 id=b 的doc相比，多了一个这个字段
        "_source" : {
          "data" : "B with routing key1"
        }
      },
      {
        "_index" : "route_test",
        "_type" : "_doc",
        "_id" : "b",
        "_score" : 1.0,
        "_source" : {
          "data" : "B"
        }
      }
    ]
  }
}
```



和步骤11插入docid=a 的那条数据相比，这次这个有些不同，我们来分析一下。步骤11中插入 docid=a 时，es返回的是updated，也就是更新了步骤2中插入的docid为a的数据，步骤12和13中查询的结果也能看出，并没有新增数据，route_test中还是只有3条数据。而步骤14插入 docid=b 的数据时，es返回的是created，也就是新增了一条数据，而不是updated原来docid为b的数据，步骤15和16的确也能看出多了一条数据，现在有4条数据。而且从步骤16查询的结果来看，有两条docid为b的数据，但一个有routing，一个没有。而且也能分析出有routing的在0号shard上面，没有的那个在1号shard上。

这个就是我们自定义routing后会导致的一个问题：**docid不再全局唯一**。ES shard的实质是Lucene的索引，所以其实每个shard都是一个功能完善的倒排索引。ES能保证docid全局唯一是采用do id作为了路由，所以同样的docid肯定会路由到同一个shard上面，如果出现docid重复，就会update或者抛异常，从而保证了集群内docid唯一标识一个doc。但如果我们换用其它值做routing，那这个就保证不了了，如果用户还需要docid的全局唯一性，那只能自己保证了。因为docid不再全局唯一，所以doc的增删改查API就可能产生问题，比如下面的查询：



```
GET route_test/_doc/b

// es返回
{
  "_index" : "route_test",
  "_type" : "_doc",
  "_id" : "b",
  "_version" : 1,
  "_seq_no" : 0,
  "_primary_term" : 1,
  "found" : true,
  "_source" : {
    "data" : "B"
  }
}


GET route_test/_doc/b?routing=key1

// es返回
{
  "_index" : "route_test",
  "_type" : "_doc",
  "_id" : "b",
  "_version" : 1,
  "_seq_no" : 3,
  "_primary_term" : 1,
  "_routing" : "key1",
  "found" : true,
  "_source" : {
    "data" : "B with routing key1"
  }
}
```



上面两个查询，虽然指定的docid都是b，但返回的结果是不一样的。所以，**如果自定义了routing字段的话，一般doc的增删改查接口都要加上routing参数以保证一致性。注意这里的【一般】指的是查询，并不是所有查询接口都要加上routing。**

为此，ES在mapping中提供了一个选项，可以强制检查doc的增删改查接口是否加了routing参数，如果没有加，就会报错。设置方式如下：



```
PUT <索引名>/
{
  "settings": {
    "number_of_shards": 2,
    "number_of_replicas": 0
  },
  "mappings": {
    "_routing": {
      "required": true        // 设置为true，则强制检查；false则不检查，默认为false
    }
  }
}
```



举个例子：



```json
PUT route_test1/
{
  "settings": {
    "number_of_shards": 3,
    "number_of_replicas": 0
  },
  "mappings": {
    "_routing": {
      "required": true
    }
  }
}

// 写入一条数据
PUT route_test1/_doc/b?routing=key1
{
  "data": "b with routing"
}

// 以下的增删改查都会抱错
GET route_test1/_doc/b
PUT route_test1/_doc/b
{
  "data": "B"
}
DELETE route_test1/_doc/b

// 错误信息
  "error": {
    "root_cause": [
      {
        "type": "routing_missing_exception",
        "reason": "routing is required for [route_test1]/[_doc]/[b]",
        "index_uuid": "_na_",
        "index": "route_test1"
      }
    ],
    "type": "routing_missing_exception",
    "reason": "routing is required for [route_test1]/[_doc]/[b]",
    "index_uuid": "_na_",
    "index": "route_test1"
  },
  "status": 400
}
```



当然，很多时候自定义路由是为了减少查询时扫描shard的个数，从而提高查询效率。**默认查询接口会搜索所有的shard**，但也可以指定routing字段，这样就只会查询routing计算出来的shard，提高查询速度。

使用方式也非常简单，只需在查询语句上面指定routing即可，允许指定多个：



```json
-- 查询所有分区
GET route_test/_search 
{
  "query": {
    "match": {
      "data": "b"
    }
  }
}

-- 查询指定分区
GET route_test/_search?routing=key1,key2 
{
  "query": {
    "match": {
      "data": "b"
    }
  }
}
```



另外，指定routing还有个弊端就是容易造成负载不均衡。所以ES提供了一种机制可以将数据路由到一组shard上面，而不是某一个。只需在创建索引时（也只能在创建时）设置**`index.routing_partition_size`**，默认值是1，即只路由到1个shard，可以将其设置为大于1且小于索引shard总数的某个值，就可以路由到一组shard了。值越大，数据越均匀。当然，从设置就能看出来，这个设置是针对单个索引的，可以加入到动态模板中，以对多个索引生效。指定后，shard的计算方式变为：

```
shard_num = (hash(_routing) + hash(_id) % routing_partition_size) % num_primary_shards
```

对于同一个routing值，**`hash(_routing)`**的结果固定的，**`hash(_id) % routing_partition_size`**的结果有 *routing_partition_size* 个可能的值，两个组合在一起，对于同一个routing值的不同doc，也就能计算出 *routing_partition_size* 可能的shard num了，即一个shard集合。但要注意这样做以后有两个限制：

1. 索引的mapping中不能再定义join关系的字段，原因是join强制要求关联的doc必须路由到同一个shard，如果采用shard集合，这个是保证不了的。
2. 索引mapping中**`_routing`**的**`required`**必须设置为true。

但是对于第2点我测试了一下，如果不写mapping，是可以的，此时**`_routing`**的**`required`**默认值其实是false的。但如果显式的写了，就必须设置为true，否则创建索引会报错。



```json
// 不显式的设置mapping，可以成功创建索引
PUT route_test_3/
{
  "settings": {
    "number_of_shards": 2,
    "number_of_replicas": 0,
    "routing_partition_size": 2
  }
}
// 查询也可以不用带routing，也可以正确执行，增删改也一样
GET route_test_3/_doc/a

// 如果显式的设置了mappings域，且required设置为false，创建索引就会失败，必须改为true
PUT route_test_4/
{
  "settings": {
    "number_of_shards": 2,
    "number_of_replicas": 0,
    "routing_partition_size": 2
  },
  "mappings": {
    "_routing": {
      "required": false
    }
  }
}
```

不知道这算不算一个bug。

 

# 总结

ElasticSearch的routing算是一个高级用法，但的确非常有用。在我们公司的订单数据，就用merchant_no作为routing，这样就能保证同一个商户的数据全部保存到同一个shard去，后面检索的时候，同样使用merchant_no作为routing，就可以精准的从某个shard获取数据了。**对于超大数据量的搜索，routing再配合hot&warm的架构，是非常有用的一种解决方案。**而且同一种属性的数据写到同一个shard还有很多好处，比如可以提高aggregation的准确性。

```
注1：本文例子中routing=key1，这里的key1是具体的值，而不是字段名称；

注2：通过JavaAPI创建 IndexRequest 时，通过 routing(java.lang.String routing) 方法指定routing值，注意这里是具体的值，而不是字段名称；

注3：本文的所有测试基于ES 7.1.0版本。
```