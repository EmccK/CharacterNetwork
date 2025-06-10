#!/bin/bash

set -e  # 遇到错误时立即退出

echo "========== 数据库初始化开始 =========="

# 解析数据库连接参数，支持环境变量和DATABASE_URL
if [ -n "$DATABASE_URL" ]; then
    echo "使用 DATABASE_URL 配置"
    DB_HOST=${PGHOST:-$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')}
    DB_PORT=${PGPORT:-$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')}
    DB_USER=${PGUSER:-$(echo $DATABASE_URL | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')}
else
    echo "使用环境变量配置"
    DB_HOST=${PGHOST:-localhost}
    DB_PORT=${PGPORT:-5432}
    DB_USER=${PGUSER:-postgres}
fi

echo "数据库连接参数: $DB_USER@$DB_HOST:$DB_PORT"

# 智能等待数据库就绪
echo "等待数据库服务就绪..."
MAX_RETRIES=30
RETRY_COUNT=0

until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -q 2>/dev/null; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    
    if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
        echo "❌ 错误: 等待数据库超时 (${MAX_RETRIES}次重试)"
        echo "请检查数据库服务是否正常启动"
        exit 1
    fi
    
    echo "数据库未就绪，等待中... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

echo "✅ 数据库服务已就绪"

# 运行数据库迁移
echo "正在运行数据库schema推送..."

if npx drizzle-kit push --verbose; then
    echo "✅ 数据库schema推送成功"
else
    echo "❌ 数据库schema推送失败"
    echo "错误详情请查看上方日志"
    exit 1
fi

# 验证数据库连接
echo "验证数据库连接..."
if command -v psql >/dev/null 2>&1; then
    if echo "SELECT 1;" | psql "$DATABASE_URL" -q >/dev/null 2>&1; then
        echo "✅ 数据库连接验证成功"
    else
        echo "⚠️  警告: 数据库连接验证失败，但迁移已完成"
    fi
else
    echo "ℹ️  跳过数据库连接验证 (psql不可用)"
fi

echo "========== 数据库初始化完成 =========="
echo