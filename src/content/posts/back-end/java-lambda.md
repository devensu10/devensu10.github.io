---
author: Deven su
pubDatetime: 2021-08-05T10:35:20.000Z
modDatetime: 2021-08-05T10:35:20.000Z
title: java lamda
slug: java-lambda
featured: false
draft: false
tags:
  - 后端
description: List<Person> list = new ArrayList();
---
List<Person> list = new ArrayList();  
        list.add(new Person("1001", "小A"));  
        list.add(new Person("1002", "小B"));  
        list.add(new Person("1003", "小C"));
        System.out.println(list);
//将list转换map
Map<String, String> map = list.stream().collect(Collectors.toMap(Person::getId, Person::getName));

1. List<StaffPublic> result = staff.stream().map(temp -> {
2. ​            StaffPublic obj = new StaffPublic();
3. ​            obj.setName(temp.getName());
4. ​            obj.setAge(temp.getAge());
5. ​            if ("mkyong".equals(temp.getName())) {
6. ​                obj.setExtra("this field is for mkyong only!");
7. ​            }
8. ​            return obj;
9. ​        }).collect(Collectors.toList());
10. 