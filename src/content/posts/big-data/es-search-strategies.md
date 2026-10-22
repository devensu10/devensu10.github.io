---
author: Deven su
pubDatetime: 2020-12-22T09:58:21.000Z
modDatetime: 2020-12-22T09:58:21.000Z
title: ES搜索策略
slug: es-search-strategies
featured: false
draft: false
tags:
  - 大数据
description: 1. 为帖子数据增加content字段
---
1. 为帖子数据增加content字段

```
POST /forum/article/_bulk
{ "update": { "_id": "1"} }
{ "doc" : {"content" : "i like to write best elasticsearch article"} }
{ "update": { "_id": "2"} }
{ "doc" : {"content" : "i think java is the best programming language"} }
{ "update": { "_id": "3"} }
{ "doc" : {"content" : "i am only an elasticsearch beginner"} }
{ "update": { "_id": "4"} }
{ "doc" : {"content" : "elasticsearch and hadoop are all very good solution, i am a beginner"} }
{ "update": { "_id": "5"} }
{ "doc" : {"content" : "spark is best big data solution based on scala ,an programming language similar to java"} }
```



2. 搜索title或content中包含java或solution的帖子



```
GET /forum/article/_search
{
    "query": {
        "bool": {
            "should": [
                { "match": { "title": "java solution" }},
                { "match": { "content":  "java solution" }}
            ]
        }
    }
}
```



期望的是doc5，结果是doc2,doc4排在了前面，它的计算过程是：

计算每个document的relevance score：每个query的分数，乘以matched query数量，除以总query数量

算一下doc4的分数

　　{ "match": { "title": "java solution" }}，针对doc4，是有一个分数的
　　{ "match": { "content": "java solution" }}，针对doc4，也是有一个分数的

所以是两个分数加起来，比如说，1.1 + 1.2 = 2.3
matched query数量 = 2
总query数量 = 2

2.3 * 2 / 2 = 2.3

算一下doc5的分数

　　{ "match": { "title": "java solution" }}，针对doc5，是没有分数的
　　{ "match": { "content": "java solution" }}，针对doc5，是有一个分数的

所以说，只有一个query是有分数的，比如2.3
matched query数量 = 1
总query数量 = 2

2.3 * 1 / 2 = 1.15

doc5的分数 = 1.15 < doc4的分数 = 2.3

3. best fields策略，dis_max

　　best fields策略，就是说，**搜索到的结果，应该是某一个field中匹配到了尽可能多的关键词，被排在前面**；而不是尽可能多的field匹配到了少数的关键词，排在了前面，dis_max语法，直接取多个query中，分数最高的那一个query的分数即可

{ "match": { "title": "java solution" }}，针对doc4，是有一个分数的，1.1
{ "match": { "content": "java solution" }}，针对doc4，也是有一个分数的，1.2
取最大分数，1.2

{ "match": { "title": "java solution" }}，针对doc5，是没有分数的
{ "match": { "content": "java solution" }}，针对doc5，是有一个分数的，2.3
取最大分数，2.3

然后doc4的分数 = 1.2 < doc5的分数 = 2.3，所以doc5就可以排在更前面的地方，符合我们的需要



```
GET /forum/article/_search
{
    "query": {
        "dis_max": {
            "queries": [
                { "match": { "title": "java solution" }},
                { "match": { "content":  "java solution" }}
            ]
        }
    }
}
```



4. 搜索title或content中包含java beginner的帖子



```
GET /forum/article/_search
{
    "query": {
        "dis_max": {
            "queries": [
                { "match": { "title": "java beginner" }},
                { "match": { "content":  "java beginner" }}
            ]
        }
    }
}
```



（1）某个帖子，doc1，title中包含java，content不包含java beginner任何一个关键词
（2）某个帖子，doc2，content中包含beginner，title中不包含任何一个关键词
（3）某个帖子，doc3，title中包含java，content中包含beginner
（4）最终搜索，可能出来的结果是，doc1和doc2排在doc3的前面，而不是我们期望的doc3排在最前面

dis_max，只是取分数最高的那个query的分数而已，完全不考虑其他query的分数

5. 使用tie_breaker将其他query的分数也考虑进去

　　tie_breaker参数的意义，在于说，将其他query的分数，乘以tie_breaker，然后综合与最高分数的那个query的分数，综合在一起进行计算，除了取最高分以外，还会考虑其他的query的分数，tie_breaker的值，一般在0~1之间，是个小数，就可以



```
GET /forum/article/_search
{
    "query": {
        "dis_max": {
            "queries": [
                { "match": { "title": "java beginner" }},
                { "match": { "body":  "java beginner" }}
            ],
            "tie_breaker": 0.3
        }
    }
}
```



6. minimum_should_match

　　主要是用来去长尾，long tail长尾，比如你搜索5个关键词，但是很多结果是只匹配1个关键词的，其实跟你想要的结果相差甚远，这些结果就是长尾
minimum_should_match，控制搜索结果的精准度，只有匹配一定数量的关键词的数据，才能返回

 



```
GET /forum/article/_search
{
  "query": {
    "dis_max": {
      "queries":  [
        {
          "match": {
            "title": {
              "query": "java beginner",
              "minimum_should_match": "50%",
          	  "boost": 2
            }
          }
        },
        {
          "match": {
            "body": {
              "query": "java beginner",
              "minimum_should_match": "30%"
            }
          }
        }
      ],
      "tie_breaker": 0.3
    }
  } 
}
```



 

7. 从best-fields换成most-fields策略

best-fields策略，主要是说将某一个field匹配尽可能多的关键词的doc优先返回回来
most-fields策略，主要是说尽可能返回更多field匹配到某个关键词的doc，优先返回回来

两者的主要区别是：

 

（1）best_fields，是对多个field进行搜索，**挑选某个field匹配度最高的那个分数**，同时在多个query最高分相同的情况下，在一定程度上考虑其他query的分数。**简单来说，你对多个field进行搜索，就想搜索到某一个field尽可能包含更多关键字的数据**

 

优点：通过best_fields策略，以及综合考虑其他field，还有minimum_should_match支持，可以尽可能精准地将匹配的结果推送到最前面
缺点：除了那些精准匹配的结果，其他差不多大的结果，排序结果不是太均匀，没有什么区分度了

 

实际的例子：百度之类的搜索引擎，最匹配的到最前面，但是其他的就没什么区分度了

 

（2）most_fields，综合多个field一起进行搜索，尽可能多地让所有field的query参与到总分数的计算中来，此时就会是个大杂烩，出现类似best_fields案例最开始的那个结果，结果不一定精准，某一个document的一个field包含更多的关键字，但是因为其他document有更多field匹配到了，所以排在了前面；所以需要建立类似sub_title.std这样的field，尽可能让某一个field精准匹配query string，贡献更高的分数，将更精准匹配的数据排到前面

 

优点：**将尽可能匹配更多field的结果推送到最前面，整个排序结果是比较均匀的**
缺点：可能那些精准匹配的结果，无法推送到最前面