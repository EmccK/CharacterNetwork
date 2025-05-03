import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { insertBookInfoSchema } from "@shared/schema";
import { getOrFetchBookInfo } from "../services/bookService";

/**
 * 获取书籍信息
 */
export const getBookInfo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bookInfo = await storage.getBookInfo(parseInt(req.params.id));
    
    if (!bookInfo) {
      return res.status(404).json({ message: "Book info not found" });
    }
    
    res.json(bookInfo);
  } catch (error) {
    next(error);
  }
};

/**
 * 通过外部ID获取书籍信息
 */
export const getBookInfoByExternalId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const externalId = req.params.externalId;
    
    // 先从数据库查询
    let bookInfo = await storage.getBookInfoByExternalId(externalId);
    
    if (!bookInfo) {
      // 尝试从外部API获取
      try {
        const fetchedBookInfo = await getOrFetchBookInfo(externalId);
        
        if (!fetchedBookInfo) {
          return res.status(404).json({ message: "Book info not found" });
        }
        
        bookInfo = fetchedBookInfo;
      } catch (fetchError) {
        console.error("获取外部书籍信息失败:", fetchError);
        return res.status(500).json({ message: "Failed to fetch book info from external API" });
      }
    }
    
    res.json(bookInfo);
  } catch (error) {
    next(error);
  }
};

/**
 * 搜索书籍信息
 */
export const searchBooks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = req.params.query;
    
    if (!query || query.trim() === "") {
      return res.status(400).json({ message: "Search query is required" });
    }
    
    const bookInfos = await storage.searchBookInfos(query);
    res.json(bookInfos);
  } catch (error) {
    next(error);
  }
};

/**
 * 创建书籍信息
 */
export const createBookInfo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bookInfoData = {
      ...req.body,
      externalId: String(req.body.externalId), // 确保externalId是字符串类型
    };
    
    // 检查是否已存在相同外部ID的书籍信息
    const existingBookInfo = await storage.getBookInfoByExternalId(bookInfoData.externalId);
    
    if (existingBookInfo) {
      return res.status(400).json({ 
        message: "Book info with this external ID already exists",
        existingBookInfo
      });
    }
    
    const validationResult = insertBookInfoSchema.safeParse(bookInfoData);
    if (!validationResult.success) {
      return res.status(400).json({
        message: "Invalid book info data",
        errors: validationResult.error.format(),
      });
    }
    
    const bookInfo = await storage.createBookInfo(validationResult.data);
    res.status(201).json(bookInfo);
  } catch (error) {
    next(error);
  }
};

/**
 * 更新书籍信息
 */
export const updateBookInfo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bookInfoId = parseInt(req.params.id);
    const bookInfo = await storage.getBookInfo(bookInfoId);
    
    if (!bookInfo) {
      return res.status(404).json({ message: "Book info not found" });
    }
    
    const bookInfoData = { ...req.body };
    
    // 如果更改了externalId，确保它是字符串类型并且不与其他书籍信息冲突
    if (bookInfoData.externalId && bookInfoData.externalId !== bookInfo.externalId) {
      bookInfoData.externalId = String(bookInfoData.externalId);
      
      const existingBookInfo = await storage.getBookInfoByExternalId(bookInfoData.externalId);
      
      if (existingBookInfo && existingBookInfo.id !== bookInfoId) {
        return res.status(400).json({ 
          message: "Book info with this external ID already exists",
          existingBookInfo
        });
      }
    }
    
    const updatedBookInfo = await storage.updateBookInfo(bookInfoId, bookInfoData);
    res.json(updatedBookInfo);
  } catch (error) {
    next(error);
  }
};

/**
 * 删除书籍信息（仅管理员可用）
 */
export const deleteBookInfo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bookInfoId = parseInt(req.params.id);
    const bookInfo = await storage.getBookInfo(bookInfoId);
    
    if (!bookInfo) {
      return res.status(404).json({ message: "Book info not found" });
    }
    
    // 检查是否有小说使用此书籍信息
    const novels = await storage.getNovelsByBookInfoId(bookInfoId);
    
    if (novels.length > 0) {
      return res.status(400).json({ 
        message: "Cannot delete book info that is being used by novels",
        novels
      });
    }
    
    await storage.deleteBookInfo(bookInfoId);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};

/**
 * 获取使用特定书籍信息的所有小说
 */
export const getNovelsByBookInfo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bookInfoId = parseInt(req.params.id);
    const bookInfo = await storage.getBookInfo(bookInfoId);
    
    if (!bookInfo) {
      return res.status(404).json({ message: "Book info not found" });
    }
    
    const novels = await storage.getNovelsByBookInfoId(bookInfoId);
    res.json(novels);
  } catch (error) {
    next(error);
  }
};
