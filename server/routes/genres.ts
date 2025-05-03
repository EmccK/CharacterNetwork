import { Router } from "express";
import { isAuthenticated, isAdmin } from "../middleware/authMiddleware";
import {
  getUserGenres,
  getPublicGenres,
  getGenre,
  createGenre,
  updateGenre,
  deleteGenre,
  getAllGenres
} from "../controllers/genreController";

const router = Router();

// 获取用户的所有小说类型（包括公共类型）
router.get("/", isAuthenticated, getUserGenres);

// 获取所有公共小说类型
router.get("/public", getPublicGenres);

// 获取特定小说类型
router.get("/:id", isAuthenticated, getGenre);

// 创建小说类型
router.post("/", isAuthenticated, createGenre);

// 更新小说类型
router.put("/:id", isAuthenticated, updateGenre);

// 删除小说类型
router.delete("/:id", isAuthenticated, deleteGenre);

// 管理员路由：获取所有小说类型
router.get("/admin/all", isAuthenticated, isAdmin, getAllGenres);

export default router;