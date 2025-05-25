/*
  # 创建默认关系类型

  1. 新内容
    - 添加系统默认关系类型
  
  2. 说明
    - 这些关系类型将作为系统默认值提供给所有用户
    - 用户ID 0 表示系统用户
*/

-- 确保系统用户存在
INSERT INTO users (id, username, password, email, is_admin) 
VALUES (0, 'system', 'system', 'system@example.com', true)
ON CONFLICT (id) DO NOTHING;

-- 添加默认关系类型
INSERT INTO relationship_types (name, color, user_id) 
VALUES 
  ('Family', '#3B82F6', 0),
  ('Friends', '#10B981', 0),
  ('Enemies', '#EF4444', 0),
  ('Romantic', '#8B5CF6', 0),
  ('Mentorship', '#F59E0B', 0)
ON CONFLICT DO NOTHING;