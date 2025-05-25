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

### 前提条件

- [Node.js](https://nodejs.org/) (v18或更高版本)
- [Supabase](https://supabase.com/) 账户和项目

### 设置步骤

1. 安装依赖：
   ```bash
   npm install
   ```

2. 配置 Supabase 连接：
   - 创建 `.env` 文件并添加 Supabase 连接信息：
   ```
   SUPABASE_URL=https://your-project-url.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   DATABASE_URL=postgresql://postgres:your-db-password@db.your-project-url.supabase.co:5432/postgres
   PGDATABASE=postgres
   PGHOST=db.your-project-url.supabase.co
   PGPORT=5432
   PGUSER=postgres
   PGPASSWORD=your-db-password
   SESSION_SECRET=your-secure-session-secret
   ```

3. 设置 Supabase 数据库架构：
   ```bash
   npm run supabase:setup
   ```

4. 启动开发服务器：
   ```bash
   npm run dev
   ```

### 环境变量

开发环境的环境变量需要在`.env`文件中设置，包括：

- `SUPABASE_URL`: Supabase 项目 URL
- `SUPABASE_ANON_KEY`: Supabase 匿名密钥
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase 服务角色密钥
- `DATABASE_URL`: Supabase PostgreSQL 连接字符串
- `SESSION_SECRET`: 会话密钥
- `NODE_ENV`: 环境设置

### 故障排除

如果遇到 Supabase 连接问题，请检查：

1. Supabase 项目是否处于活动状态
2. 环境变量中的 URL 和密钥是否正确
3. 网络连接是否正常

## 安全注意事项

- 在生产环境中，请确保保护好 Supabase 密钥
- 设置一个强随机的`SESSION_SECRET`
- 考虑对`docker-compose.yml`中的端口映射进行调整
- 在生产部署中，考虑使用Nginx作为反向代理