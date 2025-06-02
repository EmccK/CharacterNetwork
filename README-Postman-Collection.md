# CharacterNetwork API Postman Collection 使用指南

## 📋 概述

本文档提供了 CharacterNetwork 项目的完整 Postman API Collection，包含了所有 API 端点的详细文档、测试用例和使用示例。

## 🚀 快速开始

### 1. 导入 Collection

1. 打开 Postman 应用
2. 点击 "Import" 按钮
3. 选择 `CharacterNetwork-API-Collection.json` 文件
4. 确认导入设置并点击 "Import"

### 2. 环境配置

导入 Collection 后，建议创建环境变量：

```json
{
  "base_url": "http://localhost:5001",
  "username": "testuser",
  "password": "password123"
}
```

### 3. 测试流程

建议按以下顺序测试 API：

1. **认证管理模块** - 用户注册/登录
2. **小说类型模块** - 创建小说分类
3. **书籍信息模块** - 搜索和管理书籍
4. **微信读书代理模块** - 外部数据源集成

## 📁 模块结构

### 1. 认证管理模块 (Authentication Management)

**包含接口：**
- 用户注册 `POST /api/register`
- 用户登录 `POST /api/login`
- 用户登出 `POST /api/logout`
- 获取当前用户信息 `GET /api/user`
- 修改密码 `POST /api/change-password`

**特点：**
- 基于 Session 的认证机制
- 自动管理登录状态环境变量
- 完整的错误处理和测试脚本

### 2. 小说类型模块 (Novel Genres)

**包含接口：**
- 获取用户小说类型 `GET /api/genres`
- 获取公共小说类型 `GET /api/genres/public`
- 获取特定小说类型 `GET /api/genres/{id}`
- 创建小说类型 `POST /api/genres`

**特点：**
- 支持公共和私有类型
- 权限控制和数据验证
- 业务逻辑完整测试

### 3. 书籍信息模块 (Book Information)

**包含接口：**
- 获取书籍信息 `GET /api/books/{id}`
- 通过外部ID获取书籍 `GET /api/books/external/{externalId}`
- 搜索书籍信息 `GET /api/books/search/{query}`
- 创建书籍信息 `POST /api/books`

**特点：**
- 外部API集成和缓存机制
- 分页搜索支持
- 管理员权限控制

### 4. 微信读书代理模块 (WeRead Proxy)

**包含接口：**
- 微信读书搜索 `GET /api/weread/search`

**特点：**
- 跨域代理解决方案
- 外部API错误处理
- 实时搜索无缓存

## 🔧 高级功能

### 环境变量管理

Collection 自动管理以下环境变量：

| 变量名 | 描述 | 示例值 |
|--------|------|--------|
| `base_url` | API基础URL | `http://localhost:5001` |
| `current_user_id` | 当前用户ID | `1` |
| `is_logged_in` | 登录状态 | `true/false` |
| `is_admin` | 管理员状态 | `true/false` |
| `genre_id` | 类型ID | `1` |
| `book_id` | 书籍ID | `1` |

### 全局测试脚本

每个请求都包含：

1. **预请求脚本**：
   - 登录状态检查
   - 参数验证
   - 环境变量设置

2. **测试脚本**：
   - HTTP状态码验证
   - 响应时间检查
   - 数据格式验证
   - 业务逻辑测试

### 错误处理

统一的错误响应格式：

```json
{
  "message": "错误描述",
  "errorCode": "ERROR_CODE",
  "details": "详细信息"
}
```

## 📊 测试报告

### 运行所有测试

1. 选择整个 Collection
2. 点击 "Run" 按钮
3. 配置测试环境和参数
4. 查看测试报告

### 测试覆盖范围

- ✅ HTTP状态码验证
- ✅ 响应时间检查
- ✅ 数据格式验证
- ✅ 业务逻辑测试
- ✅ 权限控制验证
- ✅ 错误处理测试

## 🛠️ 开发和维护

### 添加新模块

1. 创建新的模块JSON文件（如 `05-new-module.json`）
2. 按照现有格式定义接口
3. 运行合并脚本：`python merge_postman_collections.py`
4. 重新导入更新的Collection

### 模块文件格式

```json
{
  "module_info": {
    "name": "模块名称",
    "description": "模块描述",
    "route_prefix": "/api/prefix",
    "dependencies": ["依赖模块"]
  },
  "folder": {
    "name": "模块名称",
    "description": "详细描述",
    "item": [
      // API接口定义
    ]
  }
}
```

### 合并脚本使用

```bash
# 基本使用
python merge_postman_collections.py

# 指定目录
python merge_postman_collections.py --dir custom-collections

# 指定输出文件
python merge_postman_collections.py --output MyAPI-Collection.json
```

## 🔍 故障排除

### 常见问题

1. **认证失败**
   - 检查用户名密码是否正确
   - 确认服务器是否运行
   - 验证会话Cookie设置

2. **权限不足**
   - 确认用户已登录
   - 检查管理员权限
   - 验证资源所有权

3. **外部API错误**
   - 检查网络连接
   - 验证外部服务状态
   - 查看限流设置

### 调试技巧

1. **查看Console日志**：
   - 打开Postman Console
   - 查看详细的请求/响应日志

2. **环境变量检查**：
   - 验证环境变量设置
   - 检查变量作用域

3. **网络问题**：
   - 检查代理设置
   - 验证SSL证书

## 📞 支持和反馈

- **技术支持**: support@characternetwork.com
- **Bug报告**: 请在项目仓库提交Issue
- **功能建议**: 欢迎提交Pull Request

## 📄 许可证

本项目采用 MIT 许可证，详见 LICENSE 文件。

---

**最后更新**: 2024-01-15
**版本**: v1.0.0
**维护者**: CharacterNetwork开发团队
