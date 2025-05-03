import { Router } from "express";
import { isAuthenticated } from "../middleware/authMiddleware";
import {
  getNovelRelationships,
  getRelationship,
  createRelationship,
  updateRelationship,
  deleteRelationship,
  getRelationshipTypes,
  createRelationshipType,
  updateRelationshipType,
  deleteRelationshipType
} from "../controllers/relationshipController";

const router = Router();

// 获取小说的所有关系
router.get("/:novelId", isAuthenticated, getNovelRelationships);

// 获取特定关系
router.get("/single/:id", isAuthenticated, getRelationship);

// 创建关系
router.post("/", isAuthenticated, createRelationship);

// 更新关系
router.put("/:id", isAuthenticated, updateRelationship);

// 删除关系
router.delete("/:id", isAuthenticated, deleteRelationship);

// 获取关系类型
router.get("/types/:userId", isAuthenticated, getRelationshipTypes);

// 创建关系类型
router.post("/types", isAuthenticated, createRelationshipType);

// 更新关系类型
router.put("/types/:id", isAuthenticated, updateRelationshipType);

// 删除关系类型
router.delete("/types/:id", isAuthenticated, deleteRelationshipType);

export default router;