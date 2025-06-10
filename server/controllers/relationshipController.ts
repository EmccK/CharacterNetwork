import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { insertRelationshipSchema, insertRelationshipTypeSchema } from "@shared/schema";

/**
 * 获取小说的所有关系
 */
export const getNovelRelationships = async (req: Request, res: Response, next: NextFunction) => {
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
    
    const relationships = await storage.getRelationships(novelId);
    res.json(relationships);
  } catch (error) {
    next(error);
  }
};

/**
 * 获取特定关系
 */
export const getRelationship = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const relationship = await storage.getRelationship(parseInt(req.params.id));
    
    if (!relationship) {
      return res.status(404).json({ message: "Relationship not found" });
    }
    
    // 获取关系所属的小说
    const novel = await storage.getNovel(relationship.novelId);
    
    // 检查用户是否拥有此小说
    if (novel?.userId !== req.user!.id && !req.user!.isAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    res.json(relationship);
  } catch (error) {
    next(error);
  }
};

/**
 * 创建关系
 */
export const createRelationship = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const relationshipData = {
      ...req.body,
      sourceId: parseInt(req.body.sourceId),
      targetId: parseInt(req.body.targetId),
      typeId: parseInt(req.body.typeId),
      novelId: parseInt(req.body.novelId),
    };
    
    // 检查小说是否存在
    const novel = await storage.getNovel(relationshipData.novelId);
    if (!novel) {
      return res.status(404).json({ message: "Novel not found" });
    }
    
    // 检查用户是否拥有此小说
    if (novel.userId !== req.user!.id && !req.user!.isAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    // 检查源角色是否存在且属于此小说
    const sourceCharacter = await storage.getCharacter(relationshipData.sourceId);
    if (!sourceCharacter || sourceCharacter.novelId !== relationshipData.novelId) {
      return res.status(400).json({ message: "Source character not found or does not belong to this novel" });
    }
    
    // 检查目标角色是否存在且属于此小说
    const targetCharacter = await storage.getCharacter(relationshipData.targetId);
    if (!targetCharacter || targetCharacter.novelId !== relationshipData.novelId) {
      return res.status(400).json({ message: "Target character not found or does not belong to this novel" });
    }
    
    // 检查关系类型是否存在
    const relationshipType = await storage.getRelationshipType(relationshipData.typeId);
    if (!relationshipType) {
      return res.status(400).json({ message: "Relationship type not found" });
    }

    // 检查关系类型是否属于此用户或是系统默认类型
    if (relationshipType.userId !== req.user!.id && relationshipType.userId !== 0) {
      return res.status(403).json({ message: "Forbidden: You don't own this relationship type" });
    }
    
    const validationResult = insertRelationshipSchema.safeParse(relationshipData);
    if (!validationResult.success) {
      return res.status(400).json({
        message: "Invalid relationship data",
        errors: validationResult.error.format(),
      });
    }
    
    const relationship = await storage.createRelationship(validationResult.data);
    res.status(201).json(relationship);
  } catch (error) {
    next(error);
  }
};

/**
 * 更新关系
 */
export const updateRelationship = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const relationship = await storage.getRelationship(parseInt(req.params.id));
    
    if (!relationship) {
      return res.status(404).json({ message: "Relationship not found" });
    }
    
    // 获取关系所属的小说
    const novel = await storage.getNovel(relationship.novelId);
    
    // 检查用户是否拥有此小说
    if (novel?.userId !== req.user!.id && !req.user!.isAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    const relationshipData: any = { ...req.body };
    
    // 如果提供了sourceId，确保它是数字类型并且角色存在
    if (relationshipData.sourceId !== undefined) {
      relationshipData.sourceId = parseInt(relationshipData.sourceId);
      const sourceCharacter = await storage.getCharacter(relationshipData.sourceId);
      if (!sourceCharacter || sourceCharacter.novelId !== relationship.novelId) {
        return res.status(400).json({ message: "Source character not found or does not belong to this novel" });
      }
    }
    
    // 如果提供了targetId，确保它是数字类型并且角色存在
    if (relationshipData.targetId !== undefined) {
      relationshipData.targetId = parseInt(relationshipData.targetId);
      const targetCharacter = await storage.getCharacter(relationshipData.targetId);
      if (!targetCharacter || targetCharacter.novelId !== relationship.novelId) {
        return res.status(400).json({ message: "Target character not found or does not belong to this novel" });
      }
    }
    
    // 如果提供了typeId，确保它是数字类型并且关系类型存在
    if (relationshipData.typeId !== undefined) {
      relationshipData.typeId = parseInt(relationshipData.typeId);
      const relationshipType = await storage.getRelationshipType(relationshipData.typeId);
      if (!relationshipType) {
        return res.status(400).json({ message: "Relationship type not found" });
      }

      // 检查关系类型是否属于此用户或是系统默认类型
      if (relationshipType.userId !== req.user!.id && relationshipType.userId !== 0) {
        return res.status(403).json({ message: "Forbidden: You don't own this relationship type" });
      }
    }
    
    // 不允许更改novelId
    if (relationshipData.novelId !== undefined && parseInt(relationshipData.novelId) !== relationship.novelId) {
      return res.status(400).json({ message: "Cannot change the novel of a relationship" });
    }
    
    const updatedRelationship = await storage.updateRelationship(parseInt(req.params.id), relationshipData);
    res.json(updatedRelationship);
  } catch (error) {
    next(error);
  }
};

/**
 * 删除关系
 */
export const deleteRelationship = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const relationshipId = parseInt(req.params.id);
    const relationship = await storage.getRelationship(relationshipId);
    
    if (!relationship) {
      return res.status(404).json({ message: "Relationship not found" });
    }
    
    // 获取关系所属的小说
    const novel = await storage.getNovel(relationship.novelId);
    
    // 检查用户是否拥有此小说
    if (novel?.userId !== req.user!.id && !req.user!.isAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    await storage.deleteRelationship(relationshipId);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};

/**
 * 获取关系类型（包括默认类型和用户自定义类型）
 */
export const getRelationshipTypes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 如果没有提供 userId 参数，则使用当前用户的 ID
    let userId: number;

    if (req.params.userId) {
      userId = parseInt(req.params.userId);
      // 只允许获取自己的关系类型或系统默认类型
      if (userId !== req.user!.id && !req.user!.isAdmin) {
        return res.status(403).json({ message: "Forbidden" });
      }
    } else {
      // 如果是从 relationship-types 路由访问，直接使用当前用户 ID
      userId = req.user!.id;
    }

    const relationshipTypes = await storage.getAllAvailableRelationshipTypes(userId);
    res.json(relationshipTypes);
  } catch (error) {
    next(error);
  }
};

/**
 * 获取用户自定义关系类型
 */
export const getUserCustomRelationshipTypes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const relationshipTypes = await storage.getRelationshipTypes(userId);
    res.json(relationshipTypes);
  } catch (error) {
    next(error);
  }
};

/**
 * 获取默认关系类型
 */
export const getDefaultRelationshipTypes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const defaultTypes = await storage.getSystemDefaultRelationshipTypes();
    res.json(defaultTypes);
  } catch (error) {
    next(error);
  }
};

// 移除了隐藏/取消隐藏默认关系类型的功能，现在所有关系类型都在同一个表中

/**
 * 创建关系类型
 */
export const createRelationshipType = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const relationshipTypeData = {
      ...req.body,
      userId: req.user!.id, // 确保关系类型属于当前用户
    };
    
    const validationResult = insertRelationshipTypeSchema.safeParse(relationshipTypeData);
    if (!validationResult.success) {
      return res.status(400).json({
        message: "Invalid relationship type data",
        errors: validationResult.error.format(),
      });
    }
    
    const relationshipType = await storage.createRelationshipType(validationResult.data);
    res.status(201).json(relationshipType);
  } catch (error) {
    next(error);
  }
};

/**
 * 更新关系类型
 */
export const updateRelationshipType = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const relationshipTypeId = parseInt(req.params.id);
    const relationshipType = await storage.getRelationshipType(relationshipTypeId);
    
    if (!relationshipType) {
      return res.status(404).json({ message: "Relationship type not found" });
    }
    
    // 不允许更新系统默认类型
    if (relationshipType.userId === 0) {
      return res.status(403).json({ message: "Cannot update system default relationship types" });
    }
    
    // 检查用户是否拥有此关系类型
    if (relationshipType.userId !== req.user!.id && !req.user!.isAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    const relationshipTypeData = { ...req.body };
    
    // 不允许更改userId
    delete relationshipTypeData.userId;
    
    const updatedRelationshipType = await storage.updateRelationshipType(relationshipTypeId, relationshipTypeData);
    res.json(updatedRelationshipType);
  } catch (error) {
    next(error);
  }
};

/**
 * 删除关系类型
 */
export const deleteRelationshipType = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const relationshipTypeId = parseInt(req.params.id);
    const relationshipType = await storage.getRelationshipType(relationshipTypeId);
    
    if (!relationshipType) {
      return res.status(404).json({ message: "Relationship type not found" });
    }
    
    // 不允许删除系统默认类型
    if (relationshipType.userId === 0) {
      return res.status(403).json({ message: "Cannot delete system default relationship types" });
    }
    
    // 检查用户是否拥有此关系类型
    if (relationshipType.userId !== req.user!.id && !req.user!.isAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    await storage.deleteRelationshipType(relationshipTypeId);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};
