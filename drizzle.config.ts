import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// 加载 .env 文件
dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL not found, ensure the database is provisioned");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
