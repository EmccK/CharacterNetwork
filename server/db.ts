import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from '@shared/schema';
import 'dotenv/config';

const { Pool } = pg;

console.log('连接到数据库:', process.env.DATABASE_URL);

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // 只有在生产环境或明确指定时才启用 SSL
  ssl: { rejectUnauthorized: false },
  max: 20,
  password: process.env.PGPASSWORD // Explicitly set password
});

// Create a Drizzle instance
export const db = drizzle(pool, { schema });