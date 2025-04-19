#!/bin/bash

echo "========== 小说人物关系管理器 Docker 部署故障排除 =========="
echo

# 检查 Docker 是否已安装并运行
if ! command -v docker &> /dev/null; then
    echo "错误: Docker 未安装。请先安装 Docker。"
    exit 1
fi

# 检查 Docker 是否在运行
if ! docker info &> /dev/null; then
    echo "错误: Docker 守护进程未运行。请启动 Docker 服务。"
    exit 1
fi

echo "✓ Docker 已安装并正在运行"

# 检查 Docker Compose 是否已安装
if ! command -v docker-compose &> /dev/null; then
    echo "错误: Docker Compose 未安装。请安装 Docker Compose。"
    exit 1
fi

echo "✓ Docker Compose 已安装"

# 检查 .env 文件是否存在
if [ ! -f .env ]; then
    echo "警告: .env 文件不存在。正在创建一个示例文件..."
    cp .env.example .env 2>/dev/null
    
    if [ ! -f .env ]; then
        echo "错误: 无法创建 .env 文件。请手动创建。"
        exit 1
    fi
    
    echo "已创建 .env 文件。请编辑它以设置您的环境变量。"
else
    echo "✓ .env 文件已存在"
fi

# 检查 NODE_ENV=production 是否在 .env 文件中
if ! grep -q "NODE_ENV=production" .env; then
    echo "警告: .env 文件中未设置 NODE_ENV=production。正在添加..."
    echo "NODE_ENV=production" >> .env
    echo "已添加 NODE_ENV=production 到 .env 文件"
else
    echo "✓ NODE_ENV=production 已设置"
fi

# 检查 db-init.sh 是否有执行权限
if [ ! -x db-init.sh ]; then
    echo "警告: db-init.sh 没有执行权限。正在授予..."
    chmod +x db-init.sh
    echo "已授予 db-init.sh 执行权限"
else
    echo "✓ db-init.sh 有执行权限"
fi

# 检查 uploads 目录是否存在
if [ ! -d uploads ]; then
    echo "警告: uploads 目录不存在。正在创建..."
    mkdir -p uploads
    chmod 777 uploads
    echo "已创建 uploads 目录"
else
    echo "✓ uploads 目录已存在"
fi

# 检查容器状态
if docker-compose ps | grep -q "character-network-app"; then
    echo "✓ 应用容器已创建"
    
    if docker-compose ps | grep -q "character-network-app.*Up"; then
        echo "✓ 应用容器正在运行"
    else
        echo "警告: 应用容器存在但未运行。尝试重启..."
        docker-compose restart app
    fi
else
    echo "应用容器尚未创建。请运行 docker-compose up -d"
fi

if docker-compose ps | grep -q "character-network-db"; then
    echo "✓ 数据库容器已创建"
    
    if docker-compose ps | grep -q "character-network-db.*Up"; then
        echo "✓ 数据库容器正在运行"
    else
        echo "警告: 数据库容器存在但未运行。尝试重启..."
        docker-compose restart db
    fi
else
    echo "数据库容器尚未创建。请运行 docker-compose up -d"
fi

echo
echo "========== 状态检查完成 =========="
echo
echo "如果仍有问题，请尝试以下步骤:"
echo "1. 运行 'docker-compose down' 停止所有容器"
echo "2. 运行 'docker-compose up -d --build' 重新构建并启动容器"
echo "3. 查看日志: 'docker-compose logs -f'"
echo
echo "如果数据库连接有问题，请确保 .env 文件中的数据库密码与 docker-compose.yml 一致"