---
author: Deven su
pubDatetime: 2021-05-19T03:21:16.000Z
modDatetime: 2021-05-19T03:21:16.000Z
title: 深入 ProtoBuf
slug: deep-dive-protobuf
featured: false
draft: false
tags:
  - 数据工程
description: 之前在网络通信和通用数据交换等应用场景中经常使用的技术是 JSON 或 XML，而在最近的开发中接触到了 Google  的 ProtoBuf。
---
之前在网络通信和通用数据交换等应用场景中经常使用的技术是 JSON 或 XML，而在最近的开发中接触到了 Google  的 ProtoBuf。

在查阅相关资料学习 ProtoBuf 以及研读其源码之后，发现其在效率、兼容性等方面非常出色。在以后的项目技术选型中，尤其是网络通信、通用数据交换等场景应该会优先选择 ProtoBuf。

自己在学习 ProtoBuf 的过程中翻译了官方的主要文档，一来当然是在学习 ProtoBuf，二来是培养阅读英文文档的能力，三来是因为 Google 的文档？不存在的！

看完这些文档对 ProtoBuf 应该就有相当程度的了解了。

翻译文档见 [[索引\]文章索引](https://www.jianshu.com/p/b33ca81b19b5)，导航为翻译 - 技术 - ProtoBuf 官方文档。

但是官方文档更多的是作为查阅和权威参考，并不意味着看完官方文档就能立马理解其原理。

本文以及接下来的几篇文章会对 ProtoBuf 的编码、序列化、反序列化、反射等原理做一些详细介绍，同时也会尽量将这些原理表达的更为通俗易懂。

## 何为 ProtoBuf

我们先来看看官方文档给出的定义和描述：

> protocol buffers 是一种语言无关、平台无关、可扩展的序列化结构数据的方法，它可用于（数据）通信协议、数据存储等。
>
> Protocol Buffers 是一种灵活，高效，自动化机制的结构数据序列化方法－可类比 XML，但是比 XML 更小（3 ~ 10倍）、更快（20 ~ 100倍）、更为简单。
>
> 你可以定义数据的结构，然后使用特殊生成的源代码轻松的在各种数据流中使用各种语言进行编写和读取结构数据。你甚至可以更新数据结构，而不破坏由旧数据结构编译的已部署程序。

简单来讲， ProtoBuf 是结构数据**序列化[1]** 方法，可简单**类比于 XML[2]**，其具有以下特点：

- **语言无关、平台无关**。即 ProtoBuf 支持 Java、C++、Python 等多种语言，支持多个平台
- **高效**。即比 XML 更小（3 ~ 10倍）、更快（20 ~ 100倍）、更为简单
- **扩展性、兼容性好**。你可以更新数据结构，而不影响和破坏原有的旧程序

> **序列化[1]**：将**结构数据**或**对象**转换成**能够被存储和传输（例如网络传输）的格式**，同时应当要保证这个序列化结果在之后（可能在另一个计算环境中）能够被重建回原来的结构数据或对象。
>  更为详尽的介绍可参阅 [维基百科](https://links.jianshu.com/go?to=https%3A%2F%2Fen.wikipedia.org%2Fwiki%2FSerialization)。
>  **类比于 XML[2]**：这里主要指在数据通信和数据存储应用场景中序列化方面的类比，但个人认为 XML 作为一种扩展标记语言和 ProtoBuf 还是有着本质区别的。

## 使用 ProtoBuf

对 ProtoBuf 的基本概念有了一定了解之后，我们来看看具体该如何使用 ProtoBuf。
 **第一步，创建 .proto 文件，定义数据结构，如下例1所示：**



```protobuf
// 例1: 在 xxx.proto 文件中定义 Example1 message
message Example1 {
    optional string stringVal = 1;
    optional bytes bytesVal = 2;
    message EmbeddedMessage {
        int32 int32Val = 1;
        string stringVal = 2;
    }
    optional EmbeddedMessage embeddedExample1 = 3;
    repeated int32 repeatedInt32Val = 4;
    repeated string repeatedStringVal = 5;
}
```

我们在上例中定义了一个名为 Example1 的 消息，语法很简单，message 关键字后跟上消息名称：



```protobuf
message xxx {

}
```

之后我们在其中定义了 message 具有的字段，形式为：



```protobuf
message xxx {
  // 字段规则：required -> 字段只能也必须出现 1 次
  // 字段规则：optional -> 字段可出现 0 次或1次
  // 字段规则：repeated -> 字段可出现任意多次（包括 0）
  // 类型：int32、int64、sint32、sint64、string、32-bit ....
  // 字段编号：0 ~ 536870911（除去 19000 到 19999 之间的数字）
  字段规则 类型 名称 = 字段编号;
}
```

在上例中，我们定义了：

- 类型 string，名为 stringVal 的 optional 可选字段，字段编号为 1，此字段可出现 0 或 1 次
- 类型 bytes，名为 bytesVal 的 optional 可选字段，字段编号为 2，此字段可出现 0 或 1 次
- 类型 EmbeddedMessage（自定义的内嵌 message 类型），名为 embeddedExample1 的 optional 可选字段，字段编号为 3，此字段可出现 0 或 1 次
- 类型 int32，名为 repeatedInt32Val 的 repeated 可重复字段，字段编号为 4，此字段可出现 任意多次（包括 0）
- 类型 string，名为 repeatedStringVal 的 repeated 可重复字段，字段编号为 5，此字段可出现 任意多次（包括 0）

关于 proto2 定义 message 消息的更多语法细节，例如具有支持哪些类型，字段编号分配、import
 导入定义，reserved 保留字段等知识请参阅 [[翻译\] ProtoBuf 官方文档（二）- 语法指引（proto2）](https://www.jianshu.com/p/6f68fb2c7d19)。

关于定义时的一些规范请参阅 [[翻译\] ProtoBuf 官方文档（四）- 规范指引](https://www.jianshu.com/p/8c55fb0a09b5)

**第二步，protoc 编译 .proto 文件生成读写接口**

我们在 .proto 文件中定义了数据结构，这些数据结构是面向开发者和业务程序的，并不面向存储和传输。

当需要把这些数据进行存储或传输时，就需要将这些结构数据进行序列化、反序列化以及读写。那么如何实现呢？不用担心， ProtoBuf 将会为我们提供相应的接口代码。如何提供？答案就是通过 protoc 这个编译器。

可通过如下命令生成相应的接口代码：



```php
// $SRC_DIR: .proto 所在的源目录
// --cpp_out: 生成 c++ 代码
// $DST_DIR: 生成代码的目标目录
// xxx.proto: 要针对哪个 proto 文件生成接口代码

protoc -I=$SRC_DIR --cpp_out=$DST_DIR $SRC_DIR/xxx.proto
```

最终生成的代码将提供类似如下的接口：

![img](https:////upload-images.jianshu.io/upload_images/6009978-f3c7605cf9e5706d.png?imageMogr2/auto-orient/strip|imageView2/2/w/600/format/webp)

例子-序列化和解析接口.png

![img](https:////upload-images.jianshu.io/upload_images/6009978-ae5060fd2624b6a3.png?imageMogr2/auto-orient/strip|imageView2/2/w/600/format/webp)

例子-protoc 生成接口.png

**第三步，调用接口实现序列化、反序列化以及读写**
 针对第一步中例1定义的 message，我们可以调用第二步中生成的接口，实现测试代码如下：



```c
//
// Created by yue on 18-7-21.
//
#include <iostream>
#include <fstream>
#include <string>
#include "single_length_delimited_all.pb.h"

int main() {
    Example1 example1;
    example1.set_stringval("hello,world");
    example1.set_bytesval("are you ok?");

    Example1_EmbeddedMessage *embeddedExample2 = new Example1_EmbeddedMessage();

    embeddedExample2->set_int32val(1);
    embeddedExample2->set_stringval("embeddedInfo");
    example1.set_allocated_embeddedexample1(embeddedExample2);

    example1.add_repeatedint32val(2);
    example1.add_repeatedint32val(3);
    example1.add_repeatedstringval("repeated1");
    example1.add_repeatedstringval("repeated2");

    std::string filename = "single_length_delimited_all_example1_val_result";
    std::fstream output(filename, std::ios::out | std::ios::trunc | std::ios::binary);
    if (!example1.SerializeToOstream(&output)) {
        std::cerr << "Failed to write example1." << std::endl;
        exit(-1);
    }

    return 0;
}
```

关于 protoc 的使用以及接口调用的更多信息可参阅 [[翻译\] ProtoBuf 官方文档（九）- （C++开发）教程](https://www.jianshu.com/p/d2bed3614259)

关于例1的完整代码请参阅 [源码：protobuf 例1](https://links.jianshu.com/go?to=https%3A%2F%2Fgithub.com%2FYueHub%2Fdemo%2Ftree%2Fmaster%2Fprotobuf-demo%2Flearn-encoding%2FLength-delimited)。其中的 single_length_delimited_all.* 为例子相关代码和文件。

因为此系列文章重点在于深入 ProtoBuf 的编码、序列化、反射等原理，关于 ProtoBuf 的语法、使用等只做简单介绍，更为详见的使用教程可参阅我翻译的系列官方文档。

## 关于 ProtoBuf 的一些思考

官方文档以及网上很多文章提到 ProtoBuf 可类比 XML 或 JSON。

那么 ProtoBuf 是否就等同于 XML 和 JSON 呢，它们是否具有完全相同的应用场景呢？

个人认为如果要将 ProtoBuf、XML、JSON 三者放到一起去比较，应该区分两个维度。一个是**数据结构化**，一个是**数据序列化**。这里的数据结构化主要面向开发或业务层面，数据序列化面向通信或存储层面，当然数据序列化也需要“结构”和“格式”，所以这两者之间的区别主要在于面向领域和场景不同，一般要求和侧重点也会有所不同。数据结构化侧重人类可读性甚至有时会强调语义表达能力，而数据序列化侧重效率和压缩。

从这两个维度，我们可以做出下面的一些思考。

XML 作为一种扩展标记语言，JSON 作为源于 JS 的数据格式，都具有**数据结构化**的能力。

例如 XML 可以衍生出 HTML （虽然 HTML 早于 XML，但从概念上讲，HTML 只是预定义标签的 XML），HTML 的作用是标记和表达万维网中资源的结构，以便浏览器更好的展示万维网资源，同时也要尽可能保证其人类可读以便开发人员进行编辑，这就是面向业务或开发层面的**数据结构化**。

再如 XML 还可衍生出 RDF/RDFS，进一步表达语义网中资源的关系和语义，同样它强调**数据结构化**的能力和人类可读。

> 关于 RDF/RDFS 和语义网的概念可查询相关资料了解，或参阅 [2-Answer 系列-本体构建模块（一）](https://www.jianshu.com/p/97445e45c0ae) 和 [3-Answer 系列-本体构建模块（二）](https://www.jianshu.com/p/87b43925b027) ，文中有一些简单介绍。

JSON 也是同理，在很多场合更多的是体现了**数据结构化**的能力，例如作为交互接口的数据结构的表达。在 MongoDB 中采用 JSON 作为查询语句，也是在发挥其数据结构化的能力。

当然，JSON、XML 同样也可以直接被用来**数据序列化**，实际上很多时候它们也是这么被使用的，例如直接采用 JSON、XML 进行网络通信传输，此时 JSON、XML 就成了一种序列化格式，它发挥了数据序列化的能力。但是经常这么被使用，不代表这么做就是合理。实际将 JSON、XML 直接作用数据序列化通常并不是最优选择，因为它们在速度、效率、空间上并不是最优。换句话说它们更适合数据结构化而非数据序列化。

扯完 XML 和 JSON，我们来看看 ProtoBuf，同样的 ProtoBuf 也具有数据结构化的能力，其实也就是上面介绍的 message 定义。我们能够在 .proto 文件中，通过 message、import、内嵌 message 等语法来实现数据结构化，但是很容易能够看出，ProtoBuf 在数据结构化方面和 XML、JSON 相差较大，人类可读性较差，不适合上面提到的 XML、JSON 的一些应用场景。

但是如果从数据序列化的角度你会发现 ProtoBuf 有着明显的优势，效率、速度、空间几乎全面占优，看完后面的 ProtoBuf 编码的文章，你更会了解 ProtoBuf 是如何极尽所能的压榨每一寸空间和性能，而其中的编码原理正是 ProtoBuf 的关键所在，message 的表达能力并不是 ProtoBuf 最关键的重点。所以可以看出 ProtoBuf 重点侧重于**数据序列化** 而非 *数据结构化*。

最终对这些个人思考做一些小小的总结：

1. XML、JSON、ProtoBuf 都具有**数据结构化**和**数据序列化**的能力
2. XML、JSON 更注重**数据结构化**，关注人类可读性和语义表达能力。ProtoBuf 更注重**数据序列化**，关注效率、空间、速度，人类可读性差，语义表达能力不足（为保证极致的效率，会舍弃一部分元信息）
3. ProtoBuf 的应用场景更为明确，XML、JSON 的应用场景更为丰富。

在对 ProtoBuf 做了一些基本介绍之后，这篇开始进入正题，深入 ProtoBuf 的一些原理，让我们看看 ProtoBuf 是如何尽其所能的压榨编码性能和效率的。

## 编码结构

TLV 格式是我们比较熟悉的编码格式。

所谓的 TLV 即 Tag - Length - Value。Tag 作为该字段的唯一标识，Length 代表 Value 数据域的长度，最后的 Value 便是数据本身。

ProtoBuf 编码采用类似的结构，但是实际上又有较大区别，其编码结构可见下图：

![img](https:////upload-images.jianshu.io/upload_images/6009978-fa1925e9b2c985e3.png?imageMogr2/auto-orient/strip|imageView2/2/w/900/format/webp)

ProtoBuf 编码结构图.png

我们来一步步解析上图所表达的编码结构。

首先，每一个 message 进行编码，其结果由一个个字段组成，每个字段可划分为 **Tag - [Length] - Value**，如下图所示：

![img](https:////upload-images.jianshu.io/upload_images/6009978-334273bbb6191fd6.png?imageMogr2/auto-orient/strip|imageView2/2/w/680/format/webp)

ProtoBuf 编码结构图-1.png

> 特别注意这里的 [Length] 是可选的，含义是针对不同类型的数据编码结构可能会变成 **Tag - Value** 的形式，如果变成这样的形式，没有了 Length 我们该如何确定 Value 的边界？答案就是 **Varint 编码**，在后面将详细介绍。

继续深入 Tag ，Tag 由 **field_number** 和 **wire_type** 两个部分组成：

- **field_number**: message 定义字段时指定的字段编号
- **wire_type**: ProtoBuf 编码类型，根据这个类型选择不同的 Value 编码方案。

整个 Tag 采用 Varints 编码方案进行编码，**Varints 编码**会在后面详细介绍。

Tag 结构如下图所示：

![img](https:////upload-images.jianshu.io/upload_images/6009978-9ac80dc61783d5eb.png?imageMogr2/auto-orient/strip|imageView2/2/w/520/format/webp)

ProtoBuf 编码结构图-2.png

3 bit 的 wire_type 最多可以表达 8 种编码类型，目前 ProtoBuf 已经定义了 6 种，如下图所示：

![img](https:////upload-images.jianshu.io/upload_images/6009978-1f5a226beed30152.png?imageMogr2/auto-orient/strip|imageView2/2/w/720/format/webp)

PB 编码数据类型.png

第一列即是对应的类型编号，第二列为面向最终编码的编码类型，第三列是面向开发者的 message 字段的类型。

> 注意其中的 **Start group** 和 **End group** 两种类型已被遗弃。

> 另外要特别注意一点，虽然 wire_type 代表编码类型，但是 Varint 这个编码类型里针对 sint32、sint64 又会有一些特别编码（**ZigTag 编码**）处理，相当于 Varint 这个编码类型里又存在两种不同编码。

重新来看完整的编码结构图：

![img](https:////upload-images.jianshu.io/upload_images/6009978-fa1925e9b2c985e3.png?imageMogr2/auto-orient/strip|imageView2/2/w/900/format/webp)

ProtoBuf 编码结构图.png

现在我们可以理解一个 message 编码将由一个个的 field 组成，每个 field 根据类型将有如下两种格式：

- **Tag - Length - Value**：编码类型表中 Type = 2 即 Length-delimited 编码类型将使用这种结构，
- **Tag - Value**：编码类型表中 Varint、64-bit、32-bit 使用这种结构。

> 可以思考一下为什么这么设计编码方案？可以看完下面各种编码详细的介绍再来细细品味这个问题。

其中 Tag 由字段编号 field_number 和 编码类型 wire_type 组成， Tag 整体采用 Varints 编码。

现在来模拟一下，我们接收到了一串序列化的二进制数据，我们先读一个 Varints 编码块，进行 Varints 解码，读取最后 3 bit 得到 wire_type（由此可知是后面的 Value 采用的哪种编码），随后获取到 field_number （由此可知是哪一个字段）。依据 wire_type 来正确读取后面的 Value。接着继续读取下一个字段 field...

## Varints 编码

上一节中多次提到 Varints 编码，现在我们来正式介绍这种编码方案。

总结的讲，Varints 编码的规则主要为以下三点：

1. 在每个字节开头的 bit 设置了 **msb(most significant bit )**，标识是否需要继续读取下一个字节
2. 存储数字对应的二进制补码
3. 补码的低位排在前面

> 为什么低位排在前面？这里主要是为编码实现（移位操作）做的一个小优化。可以尝试写个二进制移位进行编码解码的小例子来体会这一点。

先来看一个最为简单的例子：



```protobuf
int32 val =  1;  // 设置一个 int32 的字段的值 val = 1; 这时编码的结果如下
原码：0000 ... 0000 0001  // 1 的原码表示
补码：0000 ... 0000 0001  // 1 的补码表示
Varints 编码：0#000 0001（0x01）  // 1 的 Varints 编码，其中第一个字节的 msb = 0
```

- **编码过程：**
   数字 1 对应补码 0000 ... 0000 0001（规则 2），从末端开始取每 7 位一组并且反转排序（规则 3），因为 0000 ... 0000 0001 除了第一个取出的 7 位组（即原数列的后 7 位），剩下的均为 0。所以只需取第一个 7 位组，无需再取下一个 7 bit，那么第一个 7 位组的 msb = 0。最终得到

  

  ```protobuf
  0 | 000 0001（0x01） 
  ```

- **解码过程：**
   我们再做一遍解码过程，加深理解。

  编码结果为 0#000 0001（0x01）。首先，每个字节的第一个 bit 为 msb 位，msb = 1 表示需要再读一个字节（还未结束），msb = 0 表示无需再读字节（读取到此为止）。

  在上面的例子中，数字 1 的 Varints 编码中 msb = 0，所以只需要读完第一个字节无需再读。去掉 msb 之后，剩下的 **000 0001** 就是**补码的逆序**，但是这里只有一个字节，所以无需反转，直接解释补码 000 0001，还原即为数字 1。

> 注意：这里编码数字 1，Varints 只使用了 1 个字节。而正常情况下 int32 将使用 4 个字节存储数字 1。

再看一个需要两个字节的数字 666 的编码：



```protobuf
int32 val = 666; // 设置一个 int32 的字段的值 val = 666; 这时编码的结果如下
原码：000 ... 101 0011010  // 666 的源码
补码：000 ... 101 0011010  // 666 的补码
Varints 编码：1#0011010  0#000 0101 （9a 05）  // 666 的 Varints 编码
```

- **编码过程：**
   666 的补码为 000 ... 101 0011010，从后依次向前取 7 位组并反转排序，则得到：

  

  ```protobuf
  0011010 | 0000101
  ```

  加上 msb，则

  

  ```protobuf
  1 0011010 | 0 0000101 （0x9a 0x05）
  ```

- **解码过程：**
   编码结果为 1#0011010  0#000 0101 （9a 05），与第一个例子类似，但是这里的第一个字节 msb = 1，所以需要再读一个字节，第二个字节的 msb = 0，则读取两个字节后停止。读到两个字节后先去掉两个 msb，剩下：

  

  ```protobuf
  0011010  000 0101
  ```

  将这两个 7-bit 组反转得到补码：

  

  ```protobuf
  000 0101 0011010
  ```

  然后还原其原码为 666。

> 注意：这里编码数字 666，Varints 只使用了 2 个字节。而正常情况下 int32 将使用 4 个字节存储数字 666。

仔细品味上述的 Varints 编码，我们可以发现 Varints 的本质实际上是每个字节都**牺牲**一个 bit 位（msb），来表示是否已经结束（是否还需要读取下一个字节），msb 实际上就起到了 Length 的作用，正因为有了 msb（Length），所以我们可以摆脱原来那种无论数字大小都必须分配四个字节的窘境。**通过 Varints 我们可以让小的数字用更少的字节表示**。从而提高了空间利用和效率。

> 这里为什么强调**牺牲**？因为每个字节都拿出一个 bit 做 msb，而原先这个 bit 是可直接用来表示 Value 的，现在每个字节都少了一个 bit 位即只有 7 位能真正用来表达 Value。那就意味这 4 个字节能表达的最大数字为 228，而不再是 232 了。
>  这意味着什么？意味着当数字大于 228 时，采用 Varints 编码将导致分配 5 个字节，而原先明明只需要 4 个字节，此时 Varints 编码的效率不仅不是提高反而是下降。
>  但这并不影响 Varints 在实际应用时的高效，因为事实证明，在大多数情况下，小于 228 的数字比大于 228 的数字出现的更为频繁。

到目前为止，好像一切都很完美。但是当前的 Varints 编码却存在着明显缺陷。我们的例子好像只给出了正数，我们来看一下负数的 Varints 编码情况。



```protobuf
int32 val = -1
原码：1000 ... 0001  // 注意这里是 8 个字节
补码：1111 ... 1111  // 注意这里是 8 个字节
再次复习 Varints 编码：对补码取 7 bit 一组，低位放在前面。
上述补码 8 个字节共 64 bit，可分 9 组且这 9 组均为 1，这 9 组的 msb 均为 1（因为还有最后一组）
最后剩下一个 bit 的 1，用 0 补齐作为最后一组放在最后，最后得到 Varints 编码
Varints 编码：1#1111111 ... 0#000 0001 （FF FF FF FF FF FF FF FF FF 01）
```

注意，因为负数必须在最高位（符号位）置 1，这一点意味着无论如何，负数都必须占用所有字节，所以它的补码总是占满 8 个字节。你没法像正数那样去掉多余的高位（都是 0）。再加上 msb，最终 Varints 编码的结果将固定在 10 个字节。

> **为什么是十个字节？** int32 不应该是 4 个字节吗？这里是 ProtoBuf 基于兼容性的考虑（比如开发者将 int64 的字段改成 int32 后应当不影响旧程序），而将 int32 扩展成 int64 的八个字节。
>  **为什么之前讲正数的时候没有这种扩展？**。请仔细品味 Varints 编码，正数的前提下 int32 和 int64 天然兼容！

所以目前的情况是我们定义了一个 int32 类型的变量，如果将变量值设置为负数，那么直接采用 Varints 编码的话，其编码结果将总是占用十个字节，这显然不是我们希望得到的结果。如何解决？

## ZigZag 编码

在上一节中我们提到了 Varints 编码对负数编码效率低的问题。

为解决这个问题，ProtoBuf 为我们提供了 sint32、sint64 两种类型，当你在使用这两种类型定义字段时，ProtoBuf 将使用 ZigZag 编码，而 ZigZag 编码将解决负数编码效率低的问题。

ZigZag 的原理和概念比我们想象的简单易懂，一句话就可概括介绍 ZigZag 编码：

> **ZigZag 编码：有符号整数映射到无符号整数，然后再使用 Varints 编码**

如下图所示：

![img](https:////upload-images.jianshu.io/upload_images/6009978-e4df40b2cb502e6e.png?imageMogr2/auto-orient/strip|imageView2/2/w/720/format/webp)

ZigZag 编码.png

对于 ZigZag 编码的思维不难理解，既然负数的 Varints 编码效率很低，那么就将负数映射到正数，然后对映射后的正数进行 Varints 编码。解码时，解出正数之后再按映射关系映射回原来的负数。

例如我们设置 int32 val = -2。映射得到 3，那么对数字 3 进行 Varints 编码，将结果存储或发送出去。接收方接到数据后进行 Varints 解码，得到数字 3，再将 3 映射回 -2。

> 这里的“映射”是以移位实现的，并非存储映射表。

## Varint 类型

介绍了 Varints 编码和 ZigZag 编码之后，我们就可以继续深入分析每个类型的编码。

在第一节中我们提到了 wire_type 目前已定义 6 种，其中两种已被遗弃（Start group 和 End group），只剩下四种类型： **Varint、64-bit、Length-delimited、32-bit**。

接下来我们就来一个个详细分析，彻底搞明白 ProtoBuf 针对每种类型的编码策略。

注意，我们在之前已经强调过，与其它三种类型不同，Varint 类型里不止一种编码策略。 除了 int32、int64 等类型的 Varints 编码，还有 sint32、sint64 类型的 ZigZag 编码。

### int32、int64、uint32、uint64、bool、enum

当我们使用 int32、int64、uint32、uint64、bool、enum 声明字段类型时，其字段值将使用之前介绍的 Varints 编码。

> 其中 bool 的本质为 0 和 1，enum 本质为整数常量。

在结合本文开头介绍的编码结构： **Tag - [Length] - Value**，这里的 Value 采用 Varints 编码，因此不需要 Length，则编码结构为 **Tag - Value**，其中 Tag 和 Value 均采用 Vartins 编码。

#### int32、int64、uint32、uint64

来看一个最简单的 int32 的小例子：



```protobuf
syntax = "proto3";

// message 定义
message Example1 {
    int32 int32Val = 1;
}
```

在程序中设置字段值为 1，其编码结果为：



```c
//  设置字段值 为 1
Example1 example1;
example1.set_int32val(1);
// 编码结果
tag-(Varints)0#0001 000 + value-(Varints)0#000 0001 = 0x08 0x01
```

在程序中设置字段值为 666，其编码结果为：



```c
//  设置字段值 为 666
Example1 example1;
example1.set_int32val(666);
// 编码结果
tag-(Varints)00001 000 + value-(Varints)1#0011010  0#000 0101 = 0x08 0x9a 0x05
```

在程序中设置字段值为 -1，其编码结果为：



```c
//  设置字段值 为 1
Example1 example1;
example1.set_int32val(-1);
// 编码结果
tag-(Varints)00001 000 + value-(Varints)1#1111111 ... 0#000 0001 = 0x08 0xFF 0xFF 0xFF 0xFF 0xFF 0xFF 0xFF 0xFF 0xFF 0x01
```

int64、uint32、uint64 与 int32 同理

#### bool、enum

bool 的例子：



```protobuf
syntax = "proto3";

// message 定义
message Example1 {
    bool boolVal = 1;
}
```

在程序中设置字段值为 true，其编码结果为：



```c
//  设置字段值 为 true
Example1 example1;
example1.set_boolval(true);

// 编码结果
tag-(Varints)00001 000 + value-(Varints)0#000 0001 = 08 01
```

在程序中设置字段值为 false，其编码结果为：



```c
//  设置字段值 为 false
Example1 example1;
example1.set_boolval(false);

// 编码结果
空
```

> 这里有个有意思的现象，当 boolVal = false 时，其编码结果为空，为什么？
>  这里是 ProtoBuf 为了提高效率做的又一个小技巧：规定一个默认值机制，当读出来的字段为空的时候就设置字段的值为默认值。而 bool 类型的默认值为 false。也就是说将 false 编码然后传递（消耗一个字节），不如直接不输出任何编码结果（空），终端解析时发现该字段为空，它会按照规定设置其值为默认值（也就是 false）。如此，可进一步节省空间提高效率。

enum 的例子：



```protobuf
syntax = "proto3";

// message 定义
message Example1 {
    enum COLOR {
        YELLOW = 0;
        RED = 1;
        BLACK = 2;
        WHITE = 3;
        BLUE = 4;
    }
    // 枚举常量必须在 32 位整型值的范围
    // 使用 Varints 编码,对负数不够高效，因此不推荐在枚举中使用负数
    COLOR colorVal = 1;
}
```

在程序中设置字段值为 Example1_COLOR_BLUE，其编码结果为：



```c
//  设置字段值 为 Example1_COLOR_BLUE
Example1 example1;
example1.set_colorval(Example1_COLOR_BLUE);

// 编码结果
tag-(Varints)00001 000 + value-(Varints)0#000 0100 = 08 04
```

### sint32、sint64

sint32、sint64 将采用 ZigZag 编码。编码结构依然为 Tag - Value，只不过在编码和解码的过程中多出一个映射的过程，映射后依然采用 Varints 编码。
 来看 sint32 的例子：



```protobuf
syntax = "proto3";

// message 定义
message Example1 {
    sint32 sint32Val = 1;
}
```

在程序中设置字段值为 -1，其编码结果为：



```c
//  设置字段值 为 -1
Example1 example1;
example1.set_colorval(-1);

// 编码结果，1 映射回 -1 
tag-(Varints)00001 000 + value-(Varints)0#000 0001 = 08 01
```

在程序中设置字段值为 -2，其编码结果为：



```c
//  设置字段值 为 -2
Example1 example1;
example1.set_colorval(-2);

// 编码结果，3 映射回 -2
编码结果：tag-(Varints)00001 000 + value-(Varints)0#000 0011 = 08 03
```

sint64 与 sint32 同理。

> int、uint 和 sint: 之所以同时出现了这三种类型，是因为历史和代码迭代的结果。ProtoBuf 最初只有 int 类型，由于 int 类型不适合负数（负数编码效率低），所以提供了 sint。因为 sint 的一部分正数其实是表达的负数，所以其正数范围有所减小，所以在一些全是正数场景下需要提供 uint 类型。

## 64-bit 和 32-bit 类型

64-bit 和 32-bit 比较简单，与 Varints 一样其编码结构为 **Tag-Value**，不同的是不管数字大小，64-bit 存储 8 字节，32-bit 存储 4 字节。读取时同理，64-bit 直接读取 8 字节，32-bit 直接读取 4 字节。

> 为什么需要 64-bit 和 32-bit？之前已经分析过了 Varints 编码在一定范围内是有高效的，超过某一个数字占用字节反而更多，效率更低。如果现在有场景是存在大量的大数字，那么使用 Varints 就不太合适了，此时使用 64-bit 和 32-bit 更为合适。具体的，如果数值比 256 大的话，64-bit 这个类型比 uint64 高效，如果数值比 228 大的话，32-bit 这个类型比 uint32 高效。

### fixed64、sfixed64、double

来看例子：



```protobuf
// message 定义
syntax = "proto3";

message Example1 {
    fixed64 fixed64Val = 1;
    sfixed64 sfixed64Val = 2;
    double doubleVal = 3;
}
```

在程序中分别设置字段值 1、-1、1.2，其编码结果为：



```c
//  设置字段值 为 -2
example1.set_fixed64val(1)
example1.set_sfixed64val(-1)
example1.set_doubleval(1.2)

// 编码结果，总是 8 个字节
09 # 01 00 00 00 00 00 00 00
11 # FF FF FF FF FF FF FF FF （没有 ZigZag 编码）
19 # 33 33 33 33 33 33 F3 3F
```

### fixed32、sfixed32、float

与 64-bit 同理。

## Length-delimited 类型

### string、bytes、EmbeddedMessage、repeated

终于遇到了体现编码结构图中 [Length] 意义的类型了。Length-delimited 类型的编码结构为 **Tag - Length - Value**

这种编码方式很好理解，来看例子：



```protobuf
syntax = "proto3";

// message 定义
message Example1 {
    string stringVal = 1;
    bytes bytesVal = 2;
    message EmbeddedMessage {
        int32 int32Val = 1;
        string stringVal = 2;
    }
    EmbeddedMessage embeddedExample1 = 3;
    repeated int32 repeatedInt32Val = 4;
    repeated string repeatedStringVal = 5;
}
```

设置相应的值：



```php
Example1 example1;
example1.set_stringval("hello,world");
example1.set_bytesval("are you ok?");

Example1_EmbeddedMessage *embeddedExample2 = new Example1_EmbeddedMessage();

embeddedExample2->set_int32val(1);
embeddedExample2->set_stringval("embeddedInfo");
example1.set_allocated_embeddedexample1(embeddedExample2);

example1.add_repeatedint32val(2);
example1.add_repeatedint32val(3);
example1.add_repeatedstringval("repeated1");
example1.add_repeatedstringval("repeated2");
```

最终编码的结果为：



```cpp
0A 0B 68 65 6C 6C 6F 2C 77 6F 72 6C 64 
12 0B 61 72 65 20 79 6F 75 20 6F 6B 3F 
1A 10 08 01 12 0C 65 6D 62 65 64 64 65 64 49 6E 66 6F 
22 02 02 03[ proto3 默认 packed = true]（编码结果打包处理，见下一小节的介绍）
2A 09 72 65 70 65 61 74 65 64 31 2A 09 72 65 70 65 61 74 65 64 32(repeated string 为啥不进行默认 packed ?)
```

读者可对照上面介绍过的编码来理解这段相对复杂的编码结果。（为降低难度，已按字段分行，即第一个字段的编码结果对应第一行，第二个字段对应第二行...）

## 补充 packed 编码

在 proto2 中为我们提供了可选的设置 [packed = true]，而这一可选项在 proto3 中已成默认设置。

> packed 目前只能用于 primitive 类型。

packed = true 主要使让 ProtoBuf 为我们把 repeated primitive 的编码结果打包，从而进一步压缩空间，进一步提高效率、速度。这里打包的含义其实就是：原先的 repeated 字段的编码结构为 **Tag-Length-Value-Tag-Length-Value-Tag-Length-Value...**，因为这些 Tag 都是相同的（同一字段），因此可以将这些字段的 Value 打包，即将编码结构变为 **Tag-Length-Value-Value-Value...**

上一节例子中 repeatedInt32Val 字段的编码结果为：



```protobuf
22 | 02 02 03
```

22 即 00100010 -> wire_type = 2(Length-delimited), field_number = 4(repeatedInt32Val 字段)，02 字节长度为 2，则读取两个字节，之后按照 Varints 解码出数字 2 和 3。



