import { Express } from "express";
import express from "express";
import path from "path";
import authRoutes from "./auth";
import novelsRoutes from "./novels";
import charactersRoutes from "./characters";
import relationshipsRoutes from "./relationships";
import relationshipTypesRoutes from "./relationship-types";
import genresRoutes from "./genres";
import booksRoutes from "./books";
import adminRoutes from "./admin";
import wereadRoutes from "./weread";
import timelineEventsRoutes from "./timeline-events";
import notesRoutes from "./notes";

/**
 * 注册所有API路由
 * @param app Express应用实例
 */
export function registerRoutes(app: Express): void {
  // 静态文件服务
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  // 认证相关路由 - 直接挂载到 /api 路径
  app.use("/api", authRoutes);

  // 小说相关路由
  app.use("/api/novels", novelsRoutes);

  // 角色相关路由
  app.use("/api/characters", charactersRoutes);

  // 关系相关路由
  app.use("/api/relationships", relationshipsRoutes);

  // 关系类型相关路由
  app.use("/api/relationship-types", relationshipTypesRoutes);

  // 小说类型相关路由
  app.use("/api/genres", genresRoutes);

  // 书籍信息相关路由
  app.use("/api/books", booksRoutes);

  // 管理员相关路由
  app.use("/api/admin", adminRoutes);

  // 微信读书API代理路由 - 不需要登录即可访问
  app.use("/api/weread", wereadRoutes);

  // 时间线事件相关路由
  app.use("/api", timelineEventsRoutes);
  
  // 笔记相关路由
  app.use("/api", notesRoutes);
}