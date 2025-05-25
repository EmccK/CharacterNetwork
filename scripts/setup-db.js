import { db } from '../server/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupDatabase() {
  console.log('开始设置数据库...');
  
  try {
    // 读取并执行初始架构SQL文件
    const schemaPath = path.join(__dirname, '../supabase/migrations/create_initial_schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('执行初始架构SQL...');
    await db.execute(schemaSql);
    
    // 读取并执行默认关系类型SQL文件
    const typesPath = path.join(__dirname, '../supabase/migrations/create_default_relationship_types.sql');
    const typesSql = fs.readFileSync(typesPath, 'utf8');
    
    console.log('执行默认关系类型SQL...');
    await db.execute(typesSql);
    
    console.log('数据库设置完成！');
  } catch (error) {
    console.error('设置数据库时出错:', error);
  } finally {
    process.exit(0);
  }
}

setupDatabase();