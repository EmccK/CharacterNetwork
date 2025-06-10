import { Router } from "express";
import { isAuthenticated } from "../middleware/authMiddleware";
import {
  getRelationshipTypes,
  getUserCustomRelationshipTypes,
  getDefaultRelationshipTypes,
  createRelationshipType,
  updateRelationshipType,
  deleteRelationshipType
} from "../controllers/relationshipController";

const router = Router();

// 获取当前用户的所有关系类型（包括默认类型和自定义类型）
router.get("/", isAuthenticated, (req, res, next) => {
  const userId = req.user!.id;
  return getRelationshipTypes(req, res, next);
});

// 获取用户自定义关系类型
router.get("/custom", isAuthenticated, getUserCustomRelationshipTypes);

// 获取系统默认关系类型
router.get("/default", isAuthenticated, getDefaultRelationshipTypes);

// 创建关系类型
router.post("/", isAuthenticated, createRelationshipType);

// 更新关系类型
router.put("/:id", isAuthenticated, updateRelationshipType);

// 删除关系类型
router.delete("/:id", isAuthenticated, deleteRelationshipType);

export default router;