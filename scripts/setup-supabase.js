import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupSupabase() {
  console.log('开始设置 Supabase 数据库...');
  
  try {
    // 检查环境变量
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('环境变量 SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY 未设置，请检查 .env 文件');
    }
    
    // 创建 Supabase 客户端（使用 service role key 以获得完全权限）
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    // 读取 SQL 文件
    const migrationsDir = path.join(__dirname, '../supabase/migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // 确保按字母顺序执行
    
    // 执行每个迁移文件
    for (const file of migrationFiles) {
      console.log(`执行迁移文件: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      
      // 使用 Supabase 的 SQL 执行功能
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
      
      if (error) {
        console.error(`执行迁移文件 ${file} 时出错:`, error);
        throw error;
      }
    }
    
    console.log('Supabase 数据库设置完成！');
  } catch (error) {
    console.error('设置 Supabase 数据库时出错:', error);
    process.exit(1);
  }
}

setupSupabase();