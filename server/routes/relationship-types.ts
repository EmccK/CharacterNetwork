import { Router } from "express";
import { isAuthenticated } from "../middleware/authMiddleware";
import {
  getRelationshipTypes,
  getUserCustomRelationshipTypes,
  getDefaultRelationshipTypes,
  hideDefaultRelationshipType,
  unhideDefaultRelationshipType,
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

// 获取默认关系类型
router.get("/default", isAuthenticated, getDefaultRelationshipTypes);

// 隐藏默认关系类型
router.post("/default/:id/hide", isAuthenticated, hideDefaultRelationshipType);

// 取消隐藏默认关系类型
router.delete("/default/:id/hide", isAuthenticated, unhideDefaultRelationshipType);

// 创建关系类型
router.post("/", isAuthenticated, createRelationshipType);

// 更新关系类型
router.put("/:id", isAuthenticated, updateRelationshipType);

// 删除关系类型
router.delete("/:id", isAuthenticated, deleteRelationshipType);

export default router;