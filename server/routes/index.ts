import { Express } from "express";
import authRoutes from "./auth";
import novelsRoutes from "./novels";
import charactersRoutes from "./characters";
import relationshipsRoutes from "./relationships";
import genresRoutes from "./genres";
import booksRoutes from "./books";
import adminRoutes from "./admin";

/**
 * 注册所有API路由
 * @param app Express应用实例
 */
export function registerRoutes(app: Express): void {
  // 认证相关路由
  app.use("/api/auth", authRoutes);
  
  // 小说相关路由
  app.use("/api/novels", novelsRoutes);
  
  // 角色相关路由
  app.use("/api/characters", charactersRoutes);
  
  // 关系相关路由
  app.use("/api/relationships", relationshipsRoutes);
  
  // 小说类型相关路由
  app.use("/api/genres", genresRoutes);
  
  // 书籍信息相关路由
  app.use("/api/books", booksRoutes);
  
  // 管理员相关路由
  app.use("/api/admin", adminRoutes);
}