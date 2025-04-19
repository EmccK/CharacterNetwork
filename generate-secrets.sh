#!/bin/bash

# 检查是否安装了openssl
if ! command -v openssl &> /dev/null; then
    echo "错误: 需要安装openssl来生成安全密钥"
    exit 1
fi

# 生成随机SESSION_SECRET
SESSION_SECRET=$(openssl rand -base64 32)

# 生成随机数据库密码
DB_PASSWORD=$(openssl rand -base64 16)

# 备份现有的.env文件（如果存在）
if [ -f .env ]; then
    mv .env .env.backup.$(date +%Y%m%d%H%M%S)
    echo "已备份现有的.env文件"
fi

# 创建.env文件
cat > .env << EOL
# 数据库配置
DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@db:5432/characternetwork?sslmode=disable
PGDATABASE=characternetwork
PGHOST=db
PGPORT=5432
PGUSER=postgres
PGPASSWORD=${DB_PASSWORD}

# 安全生成的会话密钥
SESSION_SECRET=${SESSION_SECRET}

# 环境设置 - 这是必需的
NODE_ENV=production
EOL

# 设置文件权限
chmod 600 .env

echo "已生成安全的.env文件，包含随机SESSION_SECRET和数据库密码"
echo "请保管好这些密钥！"
echo "确保 docker-compose.yml 中的数据库密码与.env文件中的一致"