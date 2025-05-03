import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { insertCharacterSchema } from "@shared/schema";

/**
 * 获取小说的所有角色
 */
export const getNovelCharacters = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const novelId = parseInt(req.params.novelId);
    
    // 检查小说是否存在
    const novel = await storage.getNovel(novelId);
    if (!novel) {
      return res.status(404).json({ message: "Novel not found" });
    }
    
    // 检查用户是否拥有此小说
    if (novel.userId !== req.user!.id && !req.user!.isAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    const characters = await storage.getCharacters(novelId);
    res.json(characters);
  } catch (error) {
    next(error);
  }
};

/**
 * 获取特定角色
 */
export const getCharacter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const character = await storage.getCharacter(parseInt(req.params.id));
    
    if (!character) {
      return res.status(404).json({ message: "Character not found" });
    }
    
    // 获取角色所属的小说
    const novel = await storage.getNovel(character.novelId);
    
    // 检查用户是否拥有此小说
    if (novel?.userId !== req.user!.id && !req.user!.isAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    res.json(character);
  } catch (error) {
    next(error);
  }
};

/**
 * 创建角色
 */
export const createCharacter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let avatar = null;
    if (req.file) {
      avatar = `/uploads/${req.file.filename}`;
    } else if (req.body.avatarUrl) {
      // 直接使用提供的URL
      avatar = req.body.avatarUrl;
    }
    
    const characterData = {
      ...req.body,
      avatar,
      novelId: parseInt(req.body.novelId),
    };
    
    // 移除avatarUrl字段，因为它不在我们的schema中
    delete characterData.avatarUrl;
    
    // 检查小说是否存在
    const novel = await storage.getNovel(characterData.novelId);
    if (!novel) {
      return res.status(404).json({ message: "Novel not found" });
    }
    
    // 检查用户是否拥有此小说
    if (novel.userId !== req.user!.id && !req.user!.isAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    const validationResult = insertCharacterSchema.safeParse(characterData);
    if (!validationResult.success) {
      return res.status(400).json({
        message: "Invalid character data",
        errors: validationResult.error.format(),
      });
    }
    
    const character = await storage.createCharacter(validationResult.data);
    res.status(201).json(character);
  } catch (error) {
    next(error);
  }
};

/**
 * 更新角色
 */
export const updateCharacter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const character = await storage.getCharacter(parseInt(req.params.id));
    
    if (!character) {
      return res.status(404).json({ message: "Character not found" });
    }
    
    // 获取角色所属的小说
    const novel = await storage.getNovel(character.novelId);
    
    // 检查用户是否拥有此小说
    if (novel?.userId !== req.user!.id && !req.user!.isAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    let avatar = character.avatar;
    if (req.file) {
      avatar = `/uploads/${req.file.filename}`;
    } else if (req.body.avatarUrl) {
      // 直接使用提供的URL
      avatar = req.body.avatarUrl;
    }
    
    const characterData = {
      ...req.body,
      avatar,
    };
    
    // 移除avatarUrl字段，因为它不在我们的schema中
    delete characterData.avatarUrl;
    
    // 如果提供了novelId，确保它是数字类型
    if (characterData.novelId) {
      characterData.novelId = parseInt(characterData.novelId);
      
      // 如果更改了小说，检查用户是否拥有新小说
      if (characterData.novelId !== character.novelId) {
        const newNovel = await storage.getNovel(characterData.novelId);
        if (!newNovel) {
          return res.status(404).json({ message: "New novel not found" });
        }
        
        if (newNovel.userId !== req.user!.id && !req.user!.isAdmin) {
          return res.status(403).json({ message: "Forbidden: You don't own the target novel" });
        }
      }
    }
    
    const updatedCharacter = await storage.updateCharacter(parseInt(req.params.id), characterData);
    res.json(updatedCharacter);
  } catch (error) {
    next(error);
  }
};

/**
 * 删除角色
 */
export const deleteCharacter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const characterId = parseInt(req.params.id);
    const character = await storage.getCharacter(characterId);
    
    if (!character) {
      return res.status(404).json({ message: "Character not found" });
    }
    
    // 获取角色所属的小说
    const novel = await storage.getNovel(character.novelId);
    
    // 检查用户是否拥有此小说
    if (novel?.userId !== req.user!.id && !req.user!.isAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    // 删除角色（storage.deleteCharacter会自动删除与此角色相关的所有关系）
    await storage.deleteCharacter(characterId);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};
