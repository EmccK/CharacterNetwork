import { Router } from "express";
import { isAuthenticated, isAdmin } from "../middleware/authMiddleware";
import {
  getBookInfo,
  getBookInfoByExternalId,
  searchBooks,
  createBookInfo,
  updateBookInfo,
  deleteBookInfo,
  getNovelsByBookInfo
} from "../controllers/bookController";

const router = Router();

// 获取书籍信息
router.get("/:id", isAuthenticated, getBookInfo);

// 通过外部ID获取书籍信息
router.get("/external/:externalId", isAuthenticated, getBookInfoByExternalId);

// 搜索书籍信息
router.get("/search/:query", isAuthenticated, searchBooks);

// 创建书籍信息
router.post("/", isAuthenticated, createBookInfo);

// 更新书籍信息
router.put("/:id", isAuthenticated, isAdmin, updateBookInfo);

// 删除书籍信息（仅管理员可用）
router.delete("/:id", isAuthenticated, isAdmin, deleteBookInfo);

// 获取使用特定书籍信息的所有小说
router.get("/:id/novels", isAuthenticated, isAdmin, getNovelsByBookInfo);

export default router;