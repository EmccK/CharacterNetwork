import { Router } from "express";
import { isAuthenticated } from "../middleware/authMiddleware";
import { upload } from "../utils/fileUpload";
import {
  getNovelCharacters,
  getCharacter,
  createCharacter,
  updateCharacter,
  deleteCharacter
} from "../controllers/characterController";

const router = Router();

// 获取小说的所有角色
router.get("/:novelId", isAuthenticated, getNovelCharacters);

// 获取特定角色
router.get("/single/:id", isAuthenticated, getCharacter);

// 创建角色
router.post("/", isAuthenticated, upload.single("avatar"), createCharacter);

// 更新角色
router.put("/:id", isAuthenticated, upload.single("avatar"), updateCharacter);

// 删除角色
router.delete("/:id", isAuthenticated, deleteCharacter);

export default router;