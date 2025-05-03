import { Router } from "express";
import { proxyWereadSearch } from "../controllers/wereadController";

const router = Router();

// 微信读书搜索API代理
router.get("/search", proxyWereadSearch);

export default router;
