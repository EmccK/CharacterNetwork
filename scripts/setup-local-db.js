import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupLocalDatabase() {
  console.log('开始设置本地数据库...');
  
  try {
    // 检查环境变量
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('环境变量 DATABASE_URL 未设置，请检查 .env 文件');
    }
    
    // 创建uploads目录（如果不存在）
    if (!fs.existsSync(path.join(__dirname, '../uploads'))) {
      fs.mkdirSync(path.join(__dirname, '../uploads'), { recursive: true });
      console.log('创建uploads目录成功');
    }
    
    // 读取SQL文件
    const schemaPath = path.join(__dirname, '../supabase/migrations/create_initial_schema.sql');
    const typesPath = path.join(__dirname, '../supabase/migrations/create_default_relationship_types.sql');
    
    // 执行SQL文件
    console.log('执行数据库架构SQL...');
    await execAsync(`psql "${dbUrl}" -f "${schemaPath}"`);
    
    console.log('执行默认关系类型SQL...');
    await execAsync(`psql "${dbUrl}" -f "${typesPath}"`);
    
    console.log('数据库设置完成！');
  } catch (error) {
    console.error('设置数据库时出错:', error);
    process.exit(1);
  }
}

setupLocalDatabase();