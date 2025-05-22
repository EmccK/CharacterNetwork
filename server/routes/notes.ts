import express from "express";
import { isAuthenticated } from "../middleware/authMiddleware";
import {
  getNovelNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote
} from "../controllers/noteController";

const router = express.Router();

// 获取小说的所有笔记
router.get("/novels/:novelId/notes", isAuthenticated, getNovelNotes);

// 获取单个笔记
router.get("/notes/:id", isAuthenticated, getNoteById);

// 创建笔记
router.post("/notes", isAuthenticated, createNote);

// 更新笔记
router.put("/notes/:id", isAuthenticated, updateNote);

// 删除笔记
router.delete("/notes/:id", isAuthenticated, deleteNote);

export default router; 