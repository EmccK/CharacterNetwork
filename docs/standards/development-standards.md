# 角色关系网络应用开发规范

本文档定义了角色关系网络应用的开发规范，旨在确保代码质量、一致性和可维护性。

## 目录

1. [项目结构规范](#1-项目结构规范)
2. [命名规范](#2-命名规范)
3. [代码风格规范](#3-代码风格规范)
4. [API设计规范](#4-api设计规范)
5. [数据库操作规范](#5-数据库操作规范)
6. [文档规范](#6-文档规范)
7. [测试规范](#7-测试规范)
8. [版本控制规范](#8-版本控制规范)
9. [部署规范](#9-部署规范)
10. [安全规范](#10-安全规范)

## 1. 项目结构规范

```
CharacterNetwork/
├── client/                  # 前端代码
│   ├── public/              # 静态资源
│   └── src/                 # 源代码
│       ├── assets/          # 图片、字体等资源
│       ├── components/      # 组件
│       │   ├── admin/       # 管理员相关组件
│       │   ├── books/       # 书籍相关组件
│       │   ├── character/   # 角色相关组件
│       │   ├── layout/      # 布局组件
│       │   ├── novel/       # 小说相关组件
│       │   ├── relationship/ # 关系相关组件
│       │   └── ui/          # UI基础组件
│       ├── hooks/           # 自定义钩子
│       ├── lib/             # 工具函数和库
│       ├── pages/           # 页面组件
│       ├── store/           # 状态管理
│       └── types/           # 类型定义
├── server/                  # 后端代码
│   ├── controllers/         # 控制器
│   ├── db/                  # 数据库配置
│   ├── middleware/          # 中间件
│   ├── routes/              # 路由
│   ├── services/            # 服务
│   └── utils/               # 工具函数
└── shared/                  # 前后端共享代码
    ├── api-types.ts         # API类型定义
    └── schema.ts            # 数据库模式
```

### 1.1 文件组织原则

- 相关功能应放在同一目录下
- 共享代码应放在`shared`目录下
- 组件应按功能或页面分组
- 工具函数应放在`utils`或`lib`目录下

## 2. 命名规范

### 2.1 文件命名

- **组件文件**: 使用kebab-case (如: `character-form.tsx`)
- **类型定义文件**: 使用kebab-case (如: `api-types.ts`)
- **工具函数文件**: 使用kebab-case (如: `query-client.ts`)

### 2.2 组件命名

- **React组件**: 使用PascalCase (如: `CharacterForm`)
- **自定义钩子**: 使用camelCase并以`use`开头 (如: `useCharacterForm`)

### 2.3 变量和函数命名

- **变量和函数**: 使用camelCase (如: `getCharacter`)
- **常量**: 使用UPPER_SNAKE_CASE (如: `MAX_CHARACTERS`)
- **类型和接口**: 使用PascalCase (如: `Character`, `ApiResponse`)

### 2.4 CSS类命名

- 使用kebab-case (如: `character-card`)
- 考虑使用BEM命名约定 (如: `character-card__title`, `character-card--active`)

## 3. 代码风格规范

### 3.1 TypeScript

- 尽可能使用类型注解
- 避免使用`any`类型
- 使用接口定义对象结构
- 使用枚举定义常量集合

```typescript
// 推荐
interface Character {
  id: number;
  name: string;
  description?: string;
}

// 不推荐
type Character = any;
```

### 3.2 React

- 使用函数组件和钩子
- 将复杂逻辑提取到自定义钩子中
- 使用React Query进行数据获取
- 使用Context API和Zustand进行状态管理

```tsx
// 推荐
function CharacterCard({ character }: { character: Character }) {
  return (
    <div className="character-card">
      <h3>{character.name}</h3>
      {character.description && <p>{character.description}</p>}
    </div>
  );
}

// 不推荐
class CharacterCard extends React.Component {
  render() {
    const { character } = this.props;
    return (
      <div className="character-card">
        <h3>{character.name}</h3>
        {character.description && <p>{character.description}</p>}
      </div>
    );
  }
}
```

### 3.3 CSS

- 使用Tailwind CSS进行样式设计
- 对于复杂组件，考虑使用CSS模块或styled-components
- 保持一致的颜色和间距系统

```tsx
// 推荐
<div className="bg-white rounded-lg shadow-md p-4">
  <h3 className="text-lg font-semibold">{character.name}</h3>
</div>
```

## 4. API设计规范

### 4.1 端点命名

- 使用RESTful风格的API设计
- 使用复数名词表示资源集合 (如: `/api/novels`, `/api/characters`)
- 使用HTTP方法表示操作 (GET, POST, PUT, DELETE)

### 4.2 请求和响应格式

- 请求体使用JSON格式
- 响应体使用统一的格式，包含`success`, `data`, `message`字段
- 使用适当的HTTP状态码表示请求结果

```typescript
// 响应格式
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errorCode?: string;
}
```

### 4.3 错误处理

- 使用统一的错误响应格式
- 包含详细的错误信息和错误码
- 记录所有API错误

```typescript
// 错误响应
interface ApiError {
  success: false;
  message: string;
  errorCode: string;
  details?: any;
}
```

## 5. 数据库操作规范

### 5.1 模式定义

- 使用Drizzle ORM定义数据库模式
- 为所有表定义明确的关系
- 使用适当的索引优化查询性能

```typescript
// 推荐
export const novels = pgTable("novels", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
});
```

### 5.2 查询操作

- 使用Drizzle ORM的查询构建器
- 避免直接使用原始SQL查询
- 使用事务处理多步操作

```typescript
// 推荐
const novels = await db.select().from(novels).where(eq(novels.userId, userId));

// 不推荐
const { rows } = await pool.query('SELECT * FROM novels WHERE user_id = $1', [userId]);
```

### 5.3 数据验证

- 使用Zod进行数据验证
- 在插入和更新操作前验证数据
- 处理所有可能的错误情况

```typescript
// 推荐
const insertNovelSchema = createInsertSchema(novels);
const validatedData = insertNovelSchema.parse(requestData);
```

## 6. 文档规范

### 6.1 代码注释

- 为所有公共函数和组件添加JSDoc注释
- 解释复杂的业务逻辑
- 标记TODO和FIXME项

```typescript
/**
 * 获取小说的所有角色
 * @param novelId 小说ID
 * @returns 角色列表
 */
async function getCharacters(novelId: number): Promise<Character[]> {
  // TODO: 添加缓存机制
  return await db.select().from(characters).where(eq(characters.novelId, novelId));
}
```

### 6.2 README文档

- 包含项目概述
- 安装和运行说明
- API文档链接
- 贡献指南

### 6.3 变更日志

- 记录所有重要的变更
- 使用语义化版本控制

## 7. 测试规范

### 7.1 单元测试

- 为所有关键功能编写单元测试
- 使用Jest和React Testing Library
- 模拟外部依赖

```typescript
// 推荐
test('should render character name', () => {
  render(<CharacterCard character={{ id: 1, name: 'John' }} />);
  expect(screen.getByText('John')).toBeInTheDocument();
});
```

### 7.2 集成测试

- 测试关键用户流程
- 验证组件之间的交互
- 测试API端点

### 7.3 端到端测试

- 使用Cypress或Playwright进行端到端测试
- 测试关键用户场景
- 验证整个应用的功能

## 8. 版本控制规范

### 8.1 分支管理

- 使用Git Flow或类似的分支策略
- 主分支: `main` 或 `master`
- 开发分支: `develop`
- 功能分支: `feature/feature-name`
- 修复分支: `bugfix/bug-description`
- 发布分支: `release/version`

### 8.2 提交信息

- 使用语义化的提交信息
- 格式: `type(scope): message`
- 类型: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

```
feat(character): 添加角色关系图表
fix(api): 修复角色创建API的验证错误
docs(readme): 更新安装说明
```

### 8.3 代码审查

- 所有代码变更都需要经过代码审查
- 使用拉取请求进行代码审查
- 确保代码符合项目规范

## 9. 部署规范

### 9.1 环境配置

- 开发环境: 用于开发和测试
- 预发布环境: 用于最终测试
- 生产环境: 用于最终用户

### 9.2 环境变量

- 使用`.env`文件管理环境变量
- 不同环境使用不同的环境变量文件
- 敏感信息不应该提交到版本控制系统

```
# .env.example
DATABASE_URL=postgres://user:password@localhost:5432/database
SESSION_SECRET=your-session-secret
```

### 9.3 构建和部署

- 使用自动化构建和部署流程
- 在部署前运行所有测试
- 使用Docker容器化应用

## 10. 安全规范

### 10.1 认证和授权

- 使用安全的认证机制
- 实现细粒度的权限控制
- 定期轮换密钥和令牌

### 10.2 数据保护

- 加密敏感数据
- 实现数据备份和恢复策略
- 遵循数据保护法规

### 10.3 安全审计

- 记录所有安全相关事件
- 定期进行安全审计
- 及时修复安全漏洞
