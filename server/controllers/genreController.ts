import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { insertNovelGenreSchema } from "@shared/schema";

/**
 * 获取用户的所有小说类型（包括公共类型）
 */
export const getUserGenres = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const genres = await storage.getNovelGenres(req.user!.id);
    res.json(genres);
  } catch (error) {
    next(error);
  }
};

/**
 * 获取所有公共小说类型
 */
export const getPublicGenres = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const genres = await storage.getPublicNovelGenres();
    res.json(genres);
  } catch (error) {
    next(error);
  }
};

/**
 * 获取特定小说类型
 */
export const getGenre = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const genre = await storage.getNovelGenre(parseInt(req.params.id));
    
    if (!genre) {
      return res.status(404).json({ message: "Novel genre not found" });
    }
    
    // 检查用户是否拥有此小说类型或类型是否为公共
    if (genre.userId !== req.user!.id && !genre.isPublic && !req.user!.isAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    res.json(genre);
  } catch (error) {
    next(error);
  }
};

/**
 * 创建小说类型
 */
export const createGenre = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const genreData = {
      ...req.body,
      userId: req.user!.id,
    };
    
    // 检查是否已存在同名类型
    const existingGenres = await storage.getNovelGenres(req.user!.id);
    const nameExists = existingGenres.some(
      genre => genre.name.toLowerCase() === genreData.name.toLowerCase() && genre.userId === req.user!.id
    );
    
    if (nameExists) {
      return res.status(400).json({ message: "A genre with this name already exists" });
    }
    
    const validationResult = insertNovelGenreSchema.safeParse(genreData);
    if (!validationResult.success) {
      return res.status(400).json({
        message: "Invalid novel genre data",
        errors: validationResult.error.format(),
      });
    }
    
    const genre = await storage.createNovelGenre(validationResult.data);
    res.status(201).json(genre);
  } catch (error) {
    next(error);
  }
};

/**
 * 更新小说类型
 */
export const updateGenre = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const genreId = parseInt(req.params.id);
    const genre = await storage.getNovelGenre(genreId);
    
    if (!genre) {
      return res.status(404).json({ message: "Novel genre not found" });
    }
    
    // 检查用户是否拥有此小说类型
    if (genre.userId !== req.user!.id && !req.user!.isAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    const genreData = { ...req.body };
    
    // 不允许更改userId
    delete genreData.userId;
    
    // 如果更改了名称，检查是否已存在同名类型
    if (genreData.name && genreData.name.toLowerCase() !== genre.name.toLowerCase()) {
      const existingGenres = await storage.getNovelGenres(req.user!.id);
      const nameExists = existingGenres.some(
        g => g.name.toLowerCase() === genreData.name.toLowerCase() && g.userId === req.user!.id && g.id !== genreId
      );
      
      if (nameExists) {
        return res.status(400).json({ message: "A genre with this name already exists" });
      }
    }
    
    const updatedGenre = await storage.updateNovelGenre(genreId, genreData);
    res.json(updatedGenre);
  } catch (error) {
    next(error);
  }
};

/**
 * 删除小说类型
 */
export const deleteGenre = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const genreId = parseInt(req.params.id);
    const genre = await storage.getNovelGenre(genreId);
    
    if (!genre) {
      return res.status(404).json({ message: "Novel genre not found" });
    }
    
    // 检查用户是否拥有此小说类型
    if (genre.userId !== req.user!.id && !req.user!.isAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    await storage.deleteNovelGenre(genreId);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};

/**
 * 管理员路由：获取所有小说类型
 */
export const getAllGenres = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 获取所有用户的小说类型
    const allGenres = [];
    const users = await storage.getUsers();
    
    for (const user of users) {
      const userGenres = await storage.getNovelGenres(user.id);
      allGenres.push(...userGenres);
    }
    
    res.json(allGenres);
  } catch (error) {
    next(error);
  }
};
