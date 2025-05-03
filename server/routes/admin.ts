import { Router } from "express";
import { isAuthenticated, isAdmin } from "../middleware/authMiddleware";
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  makeUserAdmin,
  revokeUserAdmin,
  getSystemStats
} from "../controllers/userController";

const router = Router();

// 所有管理员路由都需要认证和管理员权限
router.use(isAuthenticated, isAdmin);

// 获取所有用户
router.get("/users", getAllUsers);

// 获取特定用户
router.get("/users/:id", getUserById);

// 更新用户（不包括密码）
router.put("/users/:id", updateUser);

// 删除用户
router.delete("/users/:id", deleteUser);

// 设置用户为管理员
router.post("/users/:id/make-admin", makeUserAdmin);

// 撤销用户的管理员权限
router.post("/users/:id/revoke-admin", revokeUserAdmin);

// 获取系统统计信息
router.get("/stats", getSystemStats);

export default router;