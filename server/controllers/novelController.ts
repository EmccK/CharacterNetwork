import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { insertNovelSchema } from "@shared/schema";
import { getOrFetchBookInfo } from "../services/bookService";
import type { InsertBookInfo } from "@shared/schema";
import { ApiError, NotFoundError, ForbiddenError, BadRequestError, ValidationError, InternalServerError } from "../middleware/errorHandler";
import { createResource, getResource, updateResource, deleteResource, listResources } from "../utils/crudHelpers";

/**
 * 获取用户的所有小说
 */
export const getUserNovels = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const novels = await listResources(storage, "getNovels", userId, {
      currentUserId: userId,
      isAdmin: req.user!.isAdmin
    });
    res.json(novels);
  } catch (error) {
    next(error);
  }
};

/**
 * 获取特定小说
 */
export const getNovel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const novel = await getResource(storage, "getNovel", parseInt(req.params.id), {
      currentUserId: req.user!.id,
      isAdmin: req.user!.isAdmin,
      checkOwnership: true
    });
    
    res.json(novel);
  } catch (error) {
    next(error);
  }
};

/**
 * 创建小说
 */
export const createNovel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let coverImage = null;
    if (req.file) {
      coverImage = `/uploads/${req.file.filename}`;
    } else if (req.body.coverImageUrl) {
      // 直接使用提供的URL
      coverImage = req.body.coverImageUrl;
    }

    const novelData = {
      ...req.body,
      coverImage,
      userId: req.user!.id,
    };

    // 移除coverImageUrl字段，因为它不在我们的schema中
    if ('coverImageUrl' in novelData) {
      delete (novelData as any).coverImageUrl;
    }

    const novel = await createResource(storage, "createNovel", novelData, {
      currentUserId: req.user!.id,
      validateSchema: insertNovelSchema,
      transformData: true
    });
    
    res.status(201).json(novel);
  } catch (error) {
    next(error);
  }
};

/**
 * 更新小说
 */
export const updateNovel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const novelId = parseInt(req.params.id);
    
    // 先获取小说，以获取当前的封面图片
    const novel = await getResource(storage, "getNovel", novelId, {
      currentUserId: req.user!.id,
      isAdmin: req.user!.isAdmin,
      checkOwnership: true
    });
    
    console.log('[updateNovel] 原小说数据:', {
      id: novel.id,
      title: novel.title,
      description: novel.description,
      genre: novel.genre,
      status: novel.status,
      coverImage: novel.coverImage
    });
    
    console.log('[updateNovel] 提交的更新数据:', req.body);
    
    let coverImage = novel.coverImage;
    if (req.file) {
      coverImage = `/uploads/${req.file.filename}`;
      console.log('[updateNovel] 使用上传的文件作为封面:', coverImage);
    } else if (req.body.coverImageUrl) {
      // 直接使用提供的URL
      coverImage = req.body.coverImageUrl;
      console.log('[updateNovel] 使用URL作为封面:', coverImage);
    }

    // 构建更新数据，确保所有字段都被正确更新
    const novelData = {
      title: req.body.title || novel.title,
      description: req.body.description !== undefined ? req.body.description : novel.description,
      genre: req.body.genre !== undefined ? req.body.genre : novel.genre,
      status: req.body.status || novel.status,
      coverImage,
    };

    console.log('[updateNovel] 最终更新数据:', novelData);
    
    // 移除coverImageUrl字段，因为它不在我们的schema中
    if ('coverImageUrl' in novelData) {
      delete (novelData as any).coverImageUrl;
    }

    const updatedNovel = await updateResource(
      storage, 
      "updateNovel", 
      "getNovel", 
      novelId, 
      novelData, 
      {
        currentUserId: req.user!.id,
        isAdmin: req.user!.isAdmin,
        checkOwnership: true
      }
    );
    
    res.json(updatedNovel);
  } catch (error) {
    next(error);
  }
};

/**
 * 删除小说
 */
export const deleteNovel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const novelId = parseInt(req.params.id);
    
    // 定义删除前的钩子函数，删除所有相关资源
    const beforeDeleteHook = async (id: number) => {
      // 获取此小说的所有角色
      const characters = await storage.getCharacters(id);

      // 删除此小说的所有关系
      const relationships = await storage.getRelationships(id);
      for (const relationship of relationships) {
        await storage.deleteRelationship(relationship.id);
      }

      // 删除此小说的所有角色
      for (const character of characters) {
        await storage.deleteCharacter(character.id);
      }
    };
    
    await deleteResource(storage, "deleteNovel", "getNovel", novelId, {
      currentUserId: req.user!.id,
      isAdmin: req.user!.isAdmin,
      checkOwnership: true,
      beforeDelete: beforeDeleteHook
    });
    
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};

/**
 * 从外部书籍创建小说
 */
export const createNovelFromBook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const externalId = req.params.externalId;
    console.log(
      "从外部书籍创建小说，外部ID:",
      externalId,
      "类型:",
      typeof externalId
    );

    if (!externalId || String(externalId).trim() === "") {
      return res.status(400).json({
        message: "无效的外部书籍ID",
        details: "外部书籍ID不能为空",
      });
    }

    // 先获取书籍信息，函数内部会处理类型转换
    let bookInfo = await storage.getBookInfoByExternalId(externalId);
    console.log(
      "查询书籍信息结果:",
      bookInfo
        ? `已找到ID=${bookInfo.id}, 外部ID=${bookInfo.externalId}`
        : "未找到"
    );

    if (!bookInfo) {
      // 尝试从外部API获取并保存
      try {
        console.log("尝试从外部API获取书籍信息");
        // 直接传递 externalId，getOrFetchBookInfo 函数会处理类型转换
        const fetchedBookInfo = await getOrFetchBookInfo(externalId);
        if (fetchedBookInfo) {
          bookInfo = fetchedBookInfo;
          console.log(
            "成功从外部API获取书籍信息:",
            fetchedBookInfo.id,
            "外部ID:",
            fetchedBookInfo.externalId
          );
        } else {
          console.error("外部API未找到此书籍信息");
          return res.status(404).json({ message: "未找到书籍信息" });
        }
      } catch (fetchError) {
        console.error("获取外部书籍信息失败:", fetchError);
        return res.status(500).json({ message: "获取外部书籍信息失败" });
      }
    }

    // 检查当前用户是否已经使用此书创建过小说
    try {
      // 确保bookInfo.id是数字类型
      const bookInfoIdNumeric = Number(bookInfo.id);
      if (isNaN(bookInfoIdNumeric)) {
        console.error(`[控制器] 错误: bookInfoId "${bookInfo.id}" 无法转换为数字`);
        return res.status(500).json({ message: "书籍信息ID格式错误" });
      }

      // 查询已存在的小说
      const existingNovels = await storage.getNovelsByBookInfoId(bookInfoIdNumeric);
      console.log(`[控制器] 查询到 ${existingNovels.length} 部书籍ID = ${bookInfoIdNumeric} 的小说`);

      // 过滤是否存在当前用户创建的小说
      const currentUserId = req.user!.id;
      console.log(`[控制器] 当前用户ID: ${currentUserId}`);

      const userExistingNovel = existingNovels.find((novel) => {
        console.log(`[控制器] 比较小说 userId: ${novel.userId} vs 当前用户ID: ${currentUserId}`);
        return novel.userId === currentUserId;
      });

      if (userExistingNovel) {
        console.log(`[控制器] 用户已经用此书创建过小说，ID: ${userExistingNovel.id}`);
        return res.status(400).json({
          message: "您已经用《" + bookInfo.title + "》创建过小说",
          existingNovelId: userExistingNovel.id,
        });
      } else {
        console.log(`[控制器] 未找到用户 ${currentUserId} 用此书创建的小说，可以继续创建`);
      }
    } catch (error) {
      console.error("查询已有小说时出错:", error);
      // 如果查询失败，我们就不做此检查，继续创建小说
    }

    // 统一将bookInfoId转换为数字类型
    const bookInfoIdNumeric = Number(bookInfo.id);
    if (isNaN(bookInfoIdNumeric)) {
      console.error(`[控制器] 错误: bookInfoId "${bookInfo.id}" 无法转换为数字`);
      return res.status(500).json({ message: "书籍信息ID格式错误" });
    }

    const novelData = {
      title: bookInfo.title,
      description: bookInfo.description || "",
      coverImage: bookInfo.coverImage || "",
      genre:
        Array.isArray(bookInfo.categories) && bookInfo.categories.length > 0
          ? bookInfo.categories[0]
          : "",
      status: req.body.status || "In Progress",
      userId: req.user!.id,
      bookInfoId: bookInfoIdNumeric, // 使用转换后的数字类型
    };

    console.log(`[控制器] 创建小说前确认bookInfoId: ${bookInfoIdNumeric}, 类型: ${typeof bookInfoIdNumeric}`);

    console.log("[控制器] 使用书籍信息创建小说:", {
      bookInfoId: novelData.bookInfoId,
      bookInfoIdType: typeof novelData.bookInfoId,
      title: novelData.title,
      userId: novelData.userId,
    });

    const validationResult = insertNovelSchema.safeParse(novelData);
    if (!validationResult.success) {
      console.error("小说数据验证失败:", validationResult.error.format());
      return res.status(400).json({
        message: "Invalid novel data",
        errors: validationResult.error.format(),
      });
    }

    // 创建最终确定的数据对象，强制确保 bookInfoId 存在且为数字类型
    const finalNovelData = {
      ...validationResult.data,
      bookInfoId: bookInfoIdNumeric,
    };

    console.log(`[控制器] 最终数据确认 bookInfoId=${finalNovelData.bookInfoId}, 类型=${typeof finalNovelData.bookInfoId}`);

    const novel = await storage.createNovel(finalNovelData);
    console.log(`小说创建成功: ID=${novel.id}, bookInfoId=${novel.bookInfoId}`);
    res.status(201).json(novel);
  } catch (error) {
    next(error);
  }
};

/**
 * 从搜索结果创建小说
 */
export const createNovelFromSearchBook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bookData = req.body.bookData;
    console.log("从搜索结果中创建小说:", bookData ? bookData.title : "undefined");

    if (!bookData || !bookData.title || !bookData.externalId) {
      return res.status(400).json({
        message: "无效的书籍数据",
        details: "缺少必要的标题或外部ID",
      });
    }

    // 先保存书籍信息
    console.log("准备保存书籍信息到数据库:", bookData.externalId);

    // 预处理数据，确保externalId是字符串类型
    const insertBookData: InsertBookInfo = {
      externalId: String(bookData.externalId),
      title: bookData.title,
      author: bookData.author || "",
      description: bookData.description || "",
      coverImage: bookData.coverImage || "",
      publishedDate: bookData.publishedDate || "",
      publisher: bookData.publisher || "",
      isbn: bookData.isbn || "",
      pageCount: bookData.pageCount || 0,
      categories: bookData.categories || [],
      language: bookData.language || "zh",
    };

    // 保存或获取已存在的书籍信息
    const existingBook = await storage.getBookInfoByExternalId(insertBookData.externalId);
    let bookInfo;

    if (existingBook) {
      console.log("书籍信息已存在，使用现有数据:", existingBook.id, "外部ID:", existingBook.externalId);
      bookInfo = existingBook;

      // 检查当前用户是否已经使用此书创建过小说
      try {
        // 确保bookInfo.id是数字类型
        const bookInfoIdNumeric = Number(bookInfo.id);
        if (isNaN(bookInfoIdNumeric)) {
          console.error(`[控制器] 错误: bookInfoId "${bookInfo.id}" 无法转换为数字`);
          return res.status(500).json({ message: "书籍信息ID格式错误" });
        }

        // 查询已存在的小说
        const existingNovels = await storage.getNovelsByBookInfoId(bookInfoIdNumeric);
        console.log(`[控制器] 查询到 ${existingNovels.length} 部书籍ID = ${bookInfoIdNumeric} 的小说`);

        // 过滤是否存在当前用户创建的小说
        const currentUserId = req.user!.id;
        console.log(`[控制器] 当前用户ID: ${currentUserId}`);

        const userExistingNovel = existingNovels.find((novel) => {
          console.log(`[控制器] 比较小说 userId: ${novel.userId} vs 当前用户ID: ${currentUserId}`);
          return novel.userId === currentUserId;
        });

        if (userExistingNovel) {
          console.log(`[控制器] 用户已经用此书创建过小说，ID: ${userExistingNovel.id}`);
          return res.status(400).json({
            message: "您已经用《" + bookInfo.title + "》创建过小说",
            existingNovelId: userExistingNovel.id,
          });
        } else {
          console.log(`[控制器] 未找到用户 ${currentUserId} 用此书创建的小说，可以继续创建`);
        }
      } catch (error) {
        console.error("查询已有小说时出错:", error);
        // 如果查询失败，我们就不做此检查，继续创建小说
      }
    } else {
      console.log("创建新的书籍信息");
      bookInfo = await storage.createBookInfo(insertBookData);
      console.log("新书籍信息创建成功:", bookInfo.id, "外部ID:", bookInfo.externalId);
    }

    // 统一将bookInfoId转换为数字类型
    const bookInfoIdNumeric = Number(bookInfo.id);
    if (isNaN(bookInfoIdNumeric)) {
      console.error(`[控制器] 错误: bookInfoId "${bookInfo.id}" 无法转换为数字`);
      return res.status(500).json({ message: "书籍信息ID格式错误" });
    }

    const novelData = {
      title: bookInfo.title,
      description: bookInfo.description || "",
      coverImage: bookInfo.coverImage || "",
      genre:
        Array.isArray(bookInfo.categories) && bookInfo.categories.length > 0
          ? bookInfo.categories[0]
          : "",
      status: req.body.status || "In Progress",
      userId: req.user!.id,
      bookInfoId: bookInfoIdNumeric, // 使用转换后的数字类型
    };

    console.log("[控制器] 使用书籍信息创建小说:", {
      bookInfoId: novelData.bookInfoId,
      bookInfoIdType: typeof novelData.bookInfoId,
      title: novelData.title,
      userId: novelData.userId,
    });

    const validationResult = insertNovelSchema.safeParse(novelData);
    if (!validationResult.success) {
      console.error("小说数据验证失败:", validationResult.error.format());
      return res.status(400).json({
        message: "Invalid novel data",
        errors: validationResult.error.format(),
      });
    }

    // 创建最终确定的数据对象，强制确保 bookInfoId 存在且为数字类型
    const finalNovelData = {
      ...validationResult.data,
      bookInfoId: bookInfoIdNumeric,
    };

    console.log(`[控制器] 最终数据确认 bookInfoId=${finalNovelData.bookInfoId}, 类型=${typeof finalNovelData.bookInfoId}`);

    const novel = await storage.createNovel(finalNovelData);
    console.log(`小说创建成功: ID=${novel.id}, bookInfoId=${novel.bookInfoId}`);
    res.status(201).json(novel);
  } catch (error) {
    console.error("从书籍创建小说失败:", error);
    next(error);
  }
};
