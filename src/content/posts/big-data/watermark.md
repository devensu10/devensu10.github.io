---
author: Deven su
pubDatetime: 2023-02-17T07:54:21.257Z
title: "watermark"
slug: watermark
featured: false
draft: false
tags:
  - big-data
  - mindmap
description: "Watermark 的产生、传播与触发机制梳理。"
---

![思维导图缩略图](/posts/watermark/thumbnail.png)

## 产生

### 用户调用stream.assignTimestampsAndWatermarks(assigner)方法会创建一个DataStream，同时会生成一个TimestampsAndPeriodicWatermarksOperator（针对定期生成的watermark来说），它就是一个普通的operator，可以和filter/map operator进行chain

- WatermarksOperator的open()方法中会注册一个定时线程，定时调用WatermarksOperator.onProcessTime()方法来将watermark发送出去(如果新的watermark>当前的watermark)，定时的间隔就是用户设置的周期间隔，如果WatermarksOperator和map等operator进行了chain，那么watermark就直接发送到chain的map等operator中，注意这里并不是对watermark进行广播
- 如果WatermarksOperator没有和map等operator进行chain，或者watermark已经发送到了chain operator的最后一个，那么watermark将会被进行广播到下游的每一个channel中，即上游的一个task会将watermark发送到下游的所有的task中。

## 传播

### 下游的task通过statusWatermarkValve.inputWatermark()来处理watermark消息，，会更新状态信息的watermark值，消息。

### 下游的每一个task都会记录上游所有inputChannel（即所有上游task）的状态信息，状态信息里就包括watermark的值，下游task在接收到上游task广播的watermark之后

### 同时从上游所有task的watermark中选择出最小的watermark值，如果这个值大于最近一次发送出去的watermark，就调用handleWatermark()来处理这个watermark

- 如果下游的task还是map等operator，那么就直接将watermark再次进行发送，或直接发送个chain的其他operator，或者广播给下游task。
- 如果这个operator是windowOperator，那么会调用InternalTimerServiceImpl.advanceWatermark()方法，大致实现是如果watermark大于eventTimeTimersQueue中头元素timer的时间，那么从eventTimeTimersQueue出队timer，也意味着触发了窗口计算。eventTimeTimersQueue是一个优先队列，头元素timer是timestamp值最小的。

## 触发

### 窗口触发计算的形式和ProcessTime类似，都是一个key一个key的获取状态数据，然后依次发送出去，如果到了窗口状态清理时间（=window.maxTimestamp() + allowedLateness），还会清除当前key的状态数据，窗口计算完之后调用output.emitWatermark(mark)将watermark继续发送给下游。

### 在EventTime下的窗口计算，对于每个到达窗口的元素都会调用EventTimeTrigger.onElement()，在一般情况下，如果不返回FIRE，就会给当前数据按照key给添加一个timer到eventTimeTimersQueue中（如果key之前已经有了，就不再重复添加了）。onElement()返回FIRE的情况是比较特殊的，主要针对的迟到数据处于 window.maxTimestamp =< watermark <= window.maxTimestamp+allowedLateness的情况。

- 没有设置allowedLateness的时候，即allowedLateness=0

	- EventTimeTrigger#onElement用来注册窗口触发的定时器
定时器触发之后回调EventTimeTrigger#onEventTime触发窗口的计算
定时器是在InternalTimerServiceImpl#advanceWatermark方法中触发的，关键在timer.getTimestamp() <= time，这个time就是传进来的当前的watermark，也就是watermark的时间大于等于定时器的注册时间的时候就会调用triggerTarget.onEventTime

- 设置allowedLateness>0

	- 没有迟到的数据调用逻辑如上
窗口已经触发计算之后，在允许迟到时间范围内到来的数据，会在EventTimeTrigger#onElement中返回TriggerResult.FIRE触发计算，每一条都会触发一次所在窗口的计算
迟到的数据不会在EventTimeTrigger#onEventTime触发计算，此时对于迟到的数据返回TriggerResult.CONTINUE

## 结束

### windowOperator在处理完窗口数据后，会接着将watermark往下游进行发送，直到最后到达StreamSink，StreamSink处于流的末尾，没有下一步的输出了，到此，watermark的旅程也就结束了。
