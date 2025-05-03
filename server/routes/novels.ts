import { Router } from "express";
import { isAuthenticated } from "../middleware/authMiddleware";
import { upload } from "../utils/fileUpload";
import {
  getUserNovels,
  getNovel,
  createNovel,
  updateNovel,
  deleteNovel,
  createNovelFromBook,
  createNovelFromSearchBook
} from "../controllers/novelController";

const router = Router();

// 获取用户的所有小说
router.get("/", isAuthenticated, getUserNovels);

// 获取特定小说
router.get("/:id", isAuthenticated, getNovel);

// 创建小说
router.post("/", isAuthenticated, upload.single("coverImage"), createNovel);

// 更新小说
router.put("/:id", isAuthenticated, upload.single("coverImage"), updateNovel);

// 删除小说
router.delete("/:id", isAuthenticated, deleteNovel);

// 从外部书籍创建小说
router.post("/from-book/:externalId", isAuthenticated, createNovelFromBook);

// 从搜索结果创建小说
router.post("/from-search-book", isAuthenticated, createNovelFromSearchBook);

export default router;