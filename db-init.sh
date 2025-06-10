#!/bin/bash

# 等待数据库启动
echo "等待数据库启动..."
sleep 10

# 运行数据库迁移
echo "正在运行数据库迁移..."
npx drizzle-kit push

echo "数据库初始化完成!"