/*
  # 初始数据库架构

  1. 新表
    - `users` - 用户表
    - `novels` - 小说表
    - `characters` - 角色表
    - `relationship_types` - 关系类型表
    - `relationships` - 关系表
    - `novel_genres` - 小说类型表
    - `book_infos` - 书籍信息表
    - `timeline_events` - 时间线事件表
    - `notes` - 笔记表
  
  2. 安全
    - 添加了必要的外键约束
    - 设置了默认值和非空约束
*/

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 创建小说类型表
CREATE TABLE IF NOT EXISTS novel_genres (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name, user_id)
);

-- 创建书籍信息表
CREATE TABLE IF NOT EXISTS book_infos (
  id SERIAL PRIMARY KEY,
  external_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  author TEXT,
  description TEXT,
  cover_image TEXT,
  published_date TEXT,
  publisher TEXT,
  isbn TEXT,
  page_count INTEGER,
  categories JSONB,
  language TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 创建小说表
CREATE TABLE IF NOT EXISTS novels (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  cover_image TEXT,
  genre TEXT,
  status TEXT DEFAULT 'In Progress',
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_info_id INTEGER REFERENCES book_infos(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 创建角色表
CREATE TABLE IF NOT EXISTS characters (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  avatar TEXT,
  novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 创建关系类型表
CREATE TABLE IF NOT EXISTS relationship_types (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- 创建关系表
CREATE TABLE IF NOT EXISTS relationships (
  id SERIAL PRIMARY KEY,
  source_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  target_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  type_id INTEGER NOT NULL REFERENCES relationship_types(id) ON DELETE CASCADE,
  description TEXT,
  novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE
);

-- 创建时间线事件表
CREATE TABLE IF NOT EXISTS timeline_events (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  date TEXT NOT NULL,
  importance TEXT NOT NULL DEFAULT 'normal',
  character_ids INTEGER[],
  novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 创建笔记表
CREATE TABLE IF NOT EXISTS notes (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
  character_ids INTEGER[],
  labels TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 创建会话表
CREATE TABLE IF NOT EXISTS "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL,
  CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);

-- 创建索引
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
CREATE INDEX IF NOT EXISTS "novels_user_id_idx" ON novels(user_id);
CREATE INDEX IF NOT EXISTS "characters_novel_id_idx" ON characters(novel_id);
CREATE INDEX IF NOT EXISTS "relationships_novel_id_idx" ON relationships(novel_id);
CREATE INDEX IF NOT EXISTS "timeline_events_novel_id_idx" ON timeline_events(novel_id);
CREATE INDEX IF NOT EXISTS "notes_novel_id_idx" ON notes(novel_id);

-- 添加更新时间戳触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_novels_updated_at
BEFORE UPDATE ON novels
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_book_infos_updated_at
BEFORE UPDATE ON book_infos
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at
BEFORE UPDATE ON notes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 创建默认关系类型
INSERT INTO users (id, username, password, email, is_admin) 
VALUES (0, 'system', 'system', 'system@example.com', true)
ON CONFLICT DO NOTHING;

INSERT INTO relationship_types (name, color, user_id) 
VALUES 
  ('Family', '#3B82F6', 0),
  ('Friends', '#10B981', 0),
  ('Enemies', '#EF4444', 0),
  ('Romantic', '#8B5CF6', 0),
  ('Mentorship', '#F59E0B', 0)
ON CONFLICT DO NOTHING;