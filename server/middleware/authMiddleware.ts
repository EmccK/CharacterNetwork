import { Request, Response, NextFunction } from "express";
import { User as SelectUser } from "@shared/schema";

// 扩展Request类型，确保TypeScript知道req.user的类型
declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

/**
 * 检查用户是否已认证
 */
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

/**
 * 检查用户是否为管理员
 */
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && req.user?.isAdmin) {
    return next();
  }
  res.status(403).json({ message: "Forbidden" });
}

/**
 * 检查用户是否拥有特定资源
 * @param resourceGetter 获取资源的函数
 * @param userIdField 资源中用户ID的字段名
 */
export function isResourceOwner(
  resourceGetter: (req: Request) => Promise<any>,
  userIdField: string = "userId"
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const resource = await resourceGetter(req);
      
      if (!resource) {
        return res.status(404).json({ message: "Resource not found" });
      }
      
      // 检查资源是否属于当前用户或用户是管理员
      if (resource[userIdField] === req.user?.id || req.user?.isAdmin) {
        return next();
      }
      
      res.status(403).json({ message: "Forbidden: You don't own this resource" });
    } catch (error) {
      next(error);
    }
  };
}