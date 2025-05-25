# 小说人物关系管理器

这是一个用于管理小说中人物关系的Web应用程序。用户可以创建小说，添加角色，并定义角色之间的关系。

## 使用Docker部署

本项目支持使用Docker进行简单部署，无需手动配置环境。

### 前提条件

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)

### 快速开始

1. 克隆仓库：

```bash
git clone https://your-repository-url.git
cd CharacterNetwork
```

2. 生成安全的环境变量：

```bash
chmod +x generate-secrets.sh
./generate-secrets.sh
```

这将创建一个包含随机安全密钥的 `.env` 文件。

或者，您也可以手动配置环境变量：

```bash
cp .env.example .env
```

然后编辑 `.env` 文件中的变量，尤其是 `SESSION_SECRET` 和数据库密码，建议更改为强随机密钥。

3. 赋予脚本执行权限：

```bash
chmod +x db-init.sh
chmod +x docker-troubleshoot.sh
```

4. 启动应用：

```bash
docker-compose up -d
```

5. 访问应用：

   打开浏览器，访问 [http://localhost:5001](http://localhost:5001)

初始用户注册后将自动成为管理员。

### 故障排除

如果您在部署过程中遇到问题，可以运行故障排除脚本：

```bash
./docker-troubleshoot.sh
```

### 目录结构

主要目录结构如下：

- `client/`: 前端React应用
- `server/`: 后端Express API
- `shared/`: 前后端共享代码
- `uploads/`: 上传的文件存储目录（头像等）

### 数据持久化

- 所有上传的文件存储在`uploads/`目录
- 数据库数据存储存储在`db/`目录

### 常见操作

#### 停止应用

```bash
docker-compose down
```

#### 查看日志

```bash
docker-compose logs -f app
```

#### 重新构建应用

如果对代码进行了修改，需要重新构建：

```bash
docker-compose build app
docker-compose up -d
```

#### 备份数据库

```bash
docker exec character-network-db pg_dump -U postgres characternetwork > backup.sql
```

#### 恢复数据库

```bash
cat backup.sql | docker exec -i character-network-db psql -U postgres -d characternetwork
```

## 不使用Docker的开发环境设置

### 使用本地PostgreSQL数据库

1. 安装依赖：
   ```bash
   npm install
   ```

2. 启动开发用PostgreSQL数据库：
   ```bash
   npm run db:start
   ```

3. 设置数据库架构：
   ```bash
   npm run db:setup
   ```

4. 启动开发服务器：
   ```bash
   npm run dev
   ```

5. 完成后停止数据库：
   ```bash
   npm run db:stop
   ```

### 环境变量

开发环境的环境变量已在`.env`文件中设置，包括：

- `DATABASE_URL`: 数据库连接字符串
- `SESSION_SECRET`: 会话密钥
- `NODE_ENV`: 环境设置

如果需要修改数据库连接信息，请编辑`.env`文件。

## 安全注意事项

- 在生产环境中，请确保更改默认的数据库密码
- 设置一个强随机的`SESSION_SECRET`
- 考虑对`docker-compose.yml`中的端口映射进行调整
- 在生产部署中，考虑使用Nginx作为反向代理