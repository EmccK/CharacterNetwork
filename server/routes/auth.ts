import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  changePassword
} from "../controllers/userController";

const router = Router();

// 注册路由
router.post("/register", registerUser);

// 登录路由
router.post("/login", loginUser);

// 登出路由
router.post("/logout", logoutUser);

// 获取当前用户信息
router.get("/user", getCurrentUser);

// 修改密码
router.post("/change-password", changePassword);

export default router;