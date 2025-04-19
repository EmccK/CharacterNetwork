# 使用Node.js 20作为基础镜像
FROM node:20-alpine

# 安装依赖工具
RUN apk add --no-cache bash

# 创建工作目录
WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm ci

# 复制项目文件
COPY . .

# 构建项目
RUN npm run build

# 创建uploads目录
RUN mkdir -p uploads && chmod 777 uploads

# 添加执行权限到初始化脚本
RUN chmod +x db-init.sh

# 暴露端口
EXPOSE 5001

# 启动应用前先初始化数据库
CMD ["sh", "-c", "./db-init.sh && NODE_ENV=production npm start"]