import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { User as SelectUser } from "@shared/schema";
import passport from "passport";

const scryptAsync = promisify(scrypt);

// 密码哈希函数
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// 密码比较函数
export async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

/**
 * 注册新用户
 */
export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password, email } = req.body;

    if (!username || !password || !email) {
      return res.status(400).json({ message: "所有字段都是必需的" });
    }

    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ message: "用户名已存在" });
    }

    // 第一个用户自动成为管理员
    const users = await storage.getUsers();
    const isAdmin = users.length === 0 ? true : false;

    const hashedPassword = await hashPassword(password);
    const user = await storage.createUser({
      username,
      password: hashedPassword,
      email,
      isAdmin
    });

    // 从响应中移除密码
    const userResponse = { ...user } as Partial<SelectUser>;
    delete userResponse.password;

    req.login(user, (err) => {
      if (err) return next(err);
      res.status(201).json(userResponse);
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 用户登录
 */
export const loginUser = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate("local", (err: any, user: SelectUser | false, info: { message: string } | undefined) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({ message: info?.message || "身份验证失败" });
    }

    req.login(user, (loginErr) => {
      if (loginErr) return next(loginErr);

      // 从响应中移除密码
      const userResponse = { ...user } as Partial<SelectUser>;
      delete userResponse.password;

      return res.status(200).json(userResponse);
    });
  })(req, res, next);
};

/**
 * 用户登出
 */
export const logoutUser = (req: Request, res: Response, next: NextFunction) => {
  req.logout((err) => {
    if (err) return next(err);
    res.sendStatus(200);
  });
};

/**
 * 获取当前用户信息
 */
export const getCurrentUser = (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "未登录" });
  }

  // 从响应中移除密码
  const userResponse = { ...req.user } as Partial<SelectUser>;
  delete userResponse.password;

  res.json(userResponse);
};

/**
 * 修改密码
 */
export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "未登录" });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "当前密码和新密码都是必需的" });
    }

    const user = await storage.getUser(req.user!.id);
    if (!user) {
      return res.status(404).json({ message: "用户未找到" });
    }

    const isValidPassword = await comparePasswords(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: "当前密码不正确" });
    }

    const hashedPassword = await hashPassword(newPassword);
    await storage.updateUser(user.id, { password: hashedPassword });

    res.status(200).json({ message: "密码已成功更新" });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取所有用户（管理员专用）
 */
export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await storage.getUsers();
    
    // 从响应中移除密码
    const usersResponse = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    
    res.json(usersResponse);
  } catch (error) {
    next(error);
  }
};

/**
 * 获取特定用户（管理员专用）
 */
export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await storage.getUser(parseInt(req.params.id));
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // 从响应中移除密码
    const { password, ...userWithoutPassword } = user;
    
    res.json(userWithoutPassword);
  } catch (error) {
    next(error);
  }
};

/**
 * 更新用户（不包括密码，管理员专用）
 */
export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = parseInt(req.params.id);
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const userData = { ...req.body };
    
    // 不允许通过此路由更改密码
    delete userData.password;
    
    // 如果更改了用户名，检查是否已存在同名用户
    if (userData.username && userData.username !== user.username) {
      const existingUser = await storage.getUserByUsername(userData.username);
      
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
    }
    
    const updatedUser = await storage.updateUser(userId, userData);
    
    // 从响应中移除密码
    const { password, ...userWithoutPassword } = updatedUser!;
    
    res.json(userWithoutPassword);
  } catch (error) {
    next(error);
  }
};

/**
 * 删除用户（管理员专用）
 */
export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = parseInt(req.params.id);
    
    // 不允许删除自己
    if (userId === req.user!.id) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }
    
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    await storage.deleteUser(userId);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};

/**
 * 设置用户为管理员（管理员专用）
 */
export const makeUserAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = parseInt(req.params.id);
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    if (user.isAdmin) {
      return res.status(400).json({ message: "User is already an admin" });
    }
    
    const updatedUser = await storage.updateUser(userId, { isAdmin: true });
    
    // 从响应中移除密码
    const { password, ...userWithoutPassword } = updatedUser!;
    
    res.json(userWithoutPassword);
  } catch (error) {
    next(error);
  }
};

/**
 * 撤销用户的管理员权限（管理员专用）
 */
export const revokeUserAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = parseInt(req.params.id);
    
    // 不允许撤销自己的管理员权限
    if (userId === req.user!.id) {
      return res.status(400).json({ message: "Cannot revoke your own admin privileges" });
    }
    
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    if (!user.isAdmin) {
      return res.status(400).json({ message: "User is not an admin" });
    }
    
    const updatedUser = await storage.updateUser(userId, { isAdmin: false });
    
    // 从响应中移除密码
    const { password, ...userWithoutPassword } = updatedUser!;
    
    res.json(userWithoutPassword);
  } catch (error) {
    next(error);
  }
};

/**
 * 获取系统统计信息（管理员专用）
 */
export const getSystemStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await storage.getUsers();
    
    // 获取所有小说
    const allNovels = [];
    for (const user of users) {
      const userNovels = await storage.getNovels(user.id);
      allNovels.push(...userNovels);
    }
    
    // 获取所有角色
    const allCharacters = [];
    for (const novel of allNovels) {
      const novelCharacters = await storage.getCharacters(novel.id);
      allCharacters.push(...novelCharacters);
    }
    
    // 获取所有关系
    const allRelationships = [];
    for (const novel of allNovels) {
      const novelRelationships = await storage.getRelationships(novel.id);
      allRelationships.push(...novelRelationships);
    }
    
    // 获取所有小说类型
    const allGenres = [];
    for (const user of users) {
      const userGenres = await storage.getNovelGenres(user.id);
      allGenres.push(...userGenres);
    }
    
    const stats = {
      userCount: users.length,
      novelCount: allNovels.length,
      characterCount: allCharacters.length,
      relationshipCount: allRelationships.length,
      genreCount: allGenres.length,
    };
    
    res.json(stats);
  } catch (error) {
    next(error);
  }
};
