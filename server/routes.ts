import express, {
    type Express,
    Request,
    Response,
    NextFunction,
} from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { searchBooks, getOrFetchBookInfo } from "./services/bookService";
import { WEREAD_API_URL } from "./services/bookService";
import { setupAuth } from "./auth";
import {
    insertNovelSchema,
    insertCharacterSchema,
    insertRelationshipTypeSchema,
    insertRelationshipSchema,
    insertNovelGenreSchema,
    insertBookInfoSchema,
    type InsertBookInfo,
} from "@shared/schema";
import multer from "multer";
import path from "path";
import { randomBytes } from "crypto";

// Auth middleware
function isAuthenticated(req: Request, res: Response, next: NextFunction) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ message: "Unauthorized" });
}

function isAdmin(req: Request, res: Response, next: NextFunction) {
    if (req.isAuthenticated() && req.user.isAdmin) {
        return next();
    }
    res.status(403).json({ message: "Forbidden" });
}

export async function registerRoutes(app: Express): Promise<Server> {
    // Set up authentication
    setupAuth(app);

    // Serve static files from the uploads directory
    app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

    // Configure multer for file uploads
    const multerStorage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, path.join(process.cwd(), "uploads"));
        },
        filename: (req, file, cb) => {
            const randomName = randomBytes(16).toString("hex");
            const extension = path.extname(file.originalname);
            cb(null, `${randomName}${extension}`);
        },
    });

    const upload = multer({
        storage: multerStorage,
        limits: {
            fileSize: 10 * 1024 * 1024, // 10MB max file size
        },
        fileFilter: (req, file, cb) => {
            // Accept images only
            if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
                return cb(new Error("Only image files are allowed!"), false);
            }
            cb(null, true);
        },
    });

    // Novel Genre routes
    app.get("/api/novel-genres", isAuthenticated, async (req, res, next) => {
        try {
            const genres = await storage.getNovelGenres(req.user.id);
            res.json(genres);
        } catch (error) {
            next(error);
        }
    });

    app.get("/api/novel-genres/public", async (req, res, next) => {
        try {
            const genres = await storage.getPublicNovelGenres();
            res.json(genres);
        } catch (error) {
            next(error);
        }
    });

    app.get(
        "/api/novel-genres/:id",
        isAuthenticated,
        async (req, res, next) => {
            try {
                const genre = await storage.getNovelGenre(
                    parseInt(req.params.id)
                );

                if (!genre) {
                    return res.status(404).json({ message: "小说类型未找到" });
                }

                // 检查访问权限
                if (
                    !genre.isPublic &&
                    genre.userId !== req.user.id &&
                    !req.user.isAdmin
                ) {
                    return res
                        .status(403)
                        .json({ message: "没有权限访问此小说类型" });
                }

                res.json(genre);
            } catch (error) {
                next(error);
            }
        }
    );

    app.post("/api/novel-genres", isAuthenticated, async (req, res, next) => {
        try {
            const genreData = {
                ...req.body,
                userId: req.user.id,
            };

            const validationResult =
                insertNovelGenreSchema.safeParse(genreData);
            if (!validationResult.success) {
                return res.status(400).json({
                    message: "无效的小说类型数据",
                    errors: validationResult.error.format(),
                });
            }

            // 检查名称是否已被该用户使用
            const existingGenres = await storage.getNovelGenres(req.user.id);
            const nameExists = existingGenres.some(
                (g) =>
                    g.name.toLowerCase() === genreData.name.toLowerCase() &&
                    g.userId === req.user.id
            );

            if (nameExists) {
                return res
                    .status(400)
                    .json({ message: "您已创建过相同名称的小说类型" });
            }

            const genre = await storage.createNovelGenre(validationResult.data);
            res.status(201).json(genre);
        } catch (error) {
            next(error);
        }
    });

    app.put(
        "/api/novel-genres/:id",
        isAuthenticated,
        async (req, res, next) => {
            try {
                const genre = await storage.getNovelGenre(
                    parseInt(req.params.id)
                );

                if (!genre) {
                    return res.status(404).json({ message: "小说类型未找到" });
                }

                // 检查权限
                if (genre.userId !== req.user.id && !req.user.isAdmin) {
                    return res
                        .status(403)
                        .json({ message: "没有权限修改此小说类型" });
                }

                // 检查名称是否与其他类型冲突
                if (req.body.name && req.body.name !== genre.name) {
                    const existingGenres = await storage.getNovelGenres(
                        req.user.id
                    );
                    const nameExists = existingGenres.some(
                        (g) =>
                            g.name.toLowerCase() ===
                                req.body.name.toLowerCase() &&
                            g.userId === req.user.id &&
                            g.id !== genre.id
                    );

                    if (nameExists) {
                        return res
                            .status(400)
                            .json({ message: "您已创建过相同名称的小说类型" });
                    }
                }

                const updatedGenre = await storage.updateNovelGenre(
                    parseInt(req.params.id),
                    req.body
                );
                res.json(updatedGenre);
            } catch (error) {
                next(error);
            }
        }
    );

    app.delete(
        "/api/novel-genres/:id",
        isAuthenticated,
        async (req, res, next) => {
            try {
                const genre = await storage.getNovelGenre(
                    parseInt(req.params.id)
                );

                if (!genre) {
                    return res.status(404).json({ message: "小说类型未找到" });
                }

                // 检查权限
                if (genre.userId !== req.user.id && !req.user.isAdmin) {
                    return res
                        .status(403)
                        .json({ message: "没有权限删除此小说类型" });
                }

                // 此处可以添加检查此类型是否被使用中的逻辑
                // 如果被使用中，可以返回错误或提供警告

                await storage.deleteNovelGenre(parseInt(req.params.id));
                res.status(204).end();
            } catch (error) {
                next(error);
            }
        }
    );

    // Novel routes
    app.get("/api/novels", isAuthenticated, async (req, res, next) => {
        try {
            const novels = await storage.getNovels(req.user.id);
            res.json(novels);
        } catch (error) {
            next(error);
        }
    });

    app.get("/api/novels/:id", isAuthenticated, async (req, res, next) => {
        try {
            const novel = await storage.getNovel(parseInt(req.params.id));

            if (!novel) {
                return res.status(404).json({ message: "Novel not found" });
            }

            // Check if user owns this novel
            if (novel.userId !== req.user.id && !req.user.isAdmin) {
                return res.status(403).json({ message: "Forbidden" });
            }

            res.json(novel);
        } catch (error) {
            next(error);
        }
    });

    // Book Info API routes
    app.get("/api/books/search", isAuthenticated, async (req, res, next) => {
        try {
            const query = req.query.q as string;
            if (!query || query.trim().length === 0) {
                return res.status(400).json({ message: "搜索查询不能为空" });
            }

            const books = await searchBooks(query.trim());
            res.json(books);
        } catch (error) {
            next(error);
        }
    });

    // 新增: 创建或更新书籍信息的API端点
    app.post("/api/books", isAuthenticated, async (req, res, next) => {
        try {
            const bookData = req.body;
            console.log("收到书籍数据:", JSON.stringify(bookData));

            // 检查书籍数据完整性
            if (!bookData.externalId || !bookData.title) {
                return res.status(400).json({
                    message: "无效的书籍数据",
                    details: "缺少必要的外部ID或标题",
                });
            }

            // 检查是否已存在该书
            const existingBook = await storage.getBookInfoByExternalId(
                bookData.externalId.toString()
            );

            if (existingBook) {
                console.log("书籍已存在，返回现有记录:", existingBook.id);
                // 如果书已存在，返回现有记录
                return res.status(200).json(existingBook);
            }

            // 预处理数据
            const processedBookData: InsertBookInfo = {
                externalId: bookData.externalId.toString(), // 确保是字符串
                title: bookData.title || "",
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

            // 创建新书籍信息
            console.log("正在创建新书籍信息:", processedBookData);
            const newBook = await storage.createBookInfo(processedBookData);
            console.log("新书籍信息创建成功:", newBook.id);
            res.status(201).json(newBook);
        } catch (error) {
            console.error("保存书籍信息时出错:", error);
            next(error);
        }
    });

    // 微信读书API代理路由 - 不需要登录即可访问
    app.get("/api/weread/search", async (req, res, next) => {
        try {
            const keyword = req.query.keyword as string;
            if (!keyword || keyword.trim().length === 0) {
                return res.status(400).json({ message: "搜索关键词不能为空" });
            }

            console.log(`代理搜索请求: ${keyword}`);
            const response = await fetch(
                `${WEREAD_API_URL}?keyword=${encodeURIComponent(keyword)}`
            );

            if (!response.ok) {
                console.error(`微信读书API响应错误: ${response.status}`);
                return res
                    .status(response.status)
                    .json({ message: `微信读书API错误: ${response.status}` });
            }

            const data = await response.json();
            console.log(
                `搜索结果: ${data.books ? data.books.length : 0} 本书籍`
            );
            res.json(data);
        } catch (error) {
            console.error("代理搜索出错:", error);
            next(error);
        }
    });

    app.get(
        "/api/books/:externalId",
        isAuthenticated,
        async (req, res, next) => {
            try {
                const externalId = req.params.externalId;
                const bookInfo = await getOrFetchBookInfo(externalId);

                if (!bookInfo) {
                    return res.status(404).json({ message: "未找到书籍信息" });
                }

                res.json(bookInfo);
            } catch (error) {
                next(error);
            }
        }
    );

    app.post(
        "/api/novels",
        isAuthenticated,
        upload.single("coverImage"),
        async (req, res, next) => {
            try {
                let coverImage = null;
                if (req.file) {
                    coverImage = `/uploads/${req.file.filename}`;
                } else if (req.body.coverImageUrl) {
                    // Use provided URL directly
                    coverImage = req.body.coverImageUrl;
                }

                const novelData = {
                    ...req.body,
                    coverImage,
                    userId: req.user!.id,
                };

                // Remove coverImageUrl field as it's not in our schema
                delete novelData.coverImageUrl;

                const validationResult = insertNovelSchema.safeParse(novelData);
                if (!validationResult.success) {
                    return res.status(400).json({
                        message: "Invalid novel data",
                        errors: validationResult.error.format(),
                    });
                }

                const novel = await storage.createNovel(validationResult.data);
                res.status(201).json(novel);
            } catch (error) {
                next(error);
            }
        }
    );

    // 从外部书籍创建小说
    app.post(
        "/api/novels/from-book/:externalId",
        isAuthenticated,
        async (req, res, next) => {
            try {
                const externalId = req.params.externalId;
                console.log("从外部书籍创建小说，外部ID:", externalId);

                if (!externalId || externalId.trim() === "") {
                    return res.status(400).json({
                        message: "无效的外部书籍ID",
                        details: "外部书籍ID不能为空",
                    });
                }

                // 先获取书籍信息，确保外部ID是字符串
                let bookInfo = await storage.getBookInfoByExternalId(
                    externalId.toString()
                );
                console.log(
                    "查询书籍信息结果:",
                    bookInfo ? `已找到ID=${bookInfo.id}` : "未找到"
                );

                if (!bookInfo) {
                    // 尝试从外部API获取并保存
                    try {
                        console.log("尝试从外部API获取书籍信息");
                        const fetchedBookInfo = await getOrFetchBookInfo(
                            externalId.toString()
                        );
                        if (fetchedBookInfo) {
                            bookInfo = fetchedBookInfo;
                            console.log(
                                "成功从外部API获取书籍信息:",
                                fetchedBookInfo.id
                            );
                        } else {
                            console.error("外部API未找到此书籍信息");
                            return res
                                .status(404)
                                .json({ message: "未找到书籍信息" });
                        }
                    } catch (fetchError) {
                        console.error("获取外部书籍信息失败:", fetchError);
                        return res
                            .status(500)
                            .json({ message: "获取外部书籍信息失败" });
                    }
                }
                
                // 检查当前用户是否已经使用此书创建过小说
                try {
                  // 查询已存在的小说
                  const existingNovels = await storage.getNovelsByBookInfoId(bookInfo.id);
                  console.log(`[路由] 查询到 ${existingNovels.length} 部书籍ID = ${bookInfo.id} 的小说`);
                  
                  // 过滤是否存在当前用户创建的小说
                  const currentUserId = req.user!.id;
                  console.log(`[路由] 当前用户ID: ${currentUserId}`);
                  
                  const userExistingNovel = existingNovels.find(novel => {
                    console.log(`[路由] 比较小说 userId: ${novel.userId} vs 当前用户ID: ${currentUserId}`);
                    return novel.userId === currentUserId;
                  });
                  
                  if (userExistingNovel) {
                      console.log(`[路由] 用户已经用此书创建过小说，ID: ${userExistingNovel.id}`);
                      return res.status(400).json({
                          message: "您已经用《" + bookInfo.title + "》创建过小说",
                          existingNovelId: userExistingNovel.id
                      });
                  } else {
                      console.log(`[路由] 未找到用户 ${currentUserId} 用此书创建的小说，可以继续创建`);
                  }
                } catch (error) {
                  console.error("查询已有小说时出错:", error);
                  // 如果查询失败，我们就不做此检查，继续创建小说
                }

                const novelData = {
                    title: bookInfo.title,
                    description: bookInfo.description || "",
                    coverImage: bookInfo.coverImage || "",
                    genre:
                        Array.isArray(bookInfo.categories) &&
                        bookInfo.categories.length > 0
                            ? bookInfo.categories[0]
                            : "",
                    status: req.body.status || "In Progress",
                    userId: req.user!.id,
                    bookInfoId: bookInfo.id // 必须设置 bookInfoId
                };
                
                console.log(`[路由] 创建小说前确认bookInfoId: ${bookInfo.id}, 类型: ${typeof bookInfo.id}`);

                console.log("[路由] 使用书籍信息创建小说:", {
                    bookId: bookInfo.id,
                    bookInfoId: novelData.bookInfoId, // 若干代码中也使用了 bookId 这个名称，这里证实清楚
                    title: novelData.title,
                    userId: novelData.userId,
                });

                const validationResult = insertNovelSchema.safeParse(novelData);
                if (!validationResult.success) {
                    console.error(
                        "小说数据验证失败:",
                        validationResult.error.format()
                    );
                    return res.status(400).json({
                        message: "Invalid novel data",
                        errors: validationResult.error.format(),
                    });
                }

                console.log("[路由] 获取到的验证数据:", validationResult.data);
                // 再次确认 bookInfoId 存在
                if (!validationResult.data.bookInfoId) {
                    console.warn("[路由] 警告: 验证后的 bookInfoId 为空，尝试手动设置");
                    validationResult.data.bookInfoId = bookInfo.id;
                }

                // 避免仅依赖于validationResult，它可能修改了bookInfoId
                // 创建最终确定的数据对象
                const finalNovelData = {
                    ...validationResult.data,
                    bookInfoId: bookInfo.id // 强制确保bookInfoId不会丢失
                };
                
                console.log(`[路由] 最终数据确认 bookInfoId=${finalNovelData.bookInfoId}`);
                
                const novel = await storage.createNovel(finalNovelData);
                console.log(`小说创建成功: ID=${novel.id}, bookInfoId=${novel.bookInfoId}`);
                res.status(201).json(novel);
            } catch (error) {
                console.error("从书籍创建小说失败:", error);
                next(error);
            }
        }
    );

    // 从外部书籍创建小说 - 新增版本
    app.post(
        "/api/novels/from-search-book",
        isAuthenticated,
        async (req, res, next) => {
            try {
                const bookData = req.body.bookData;
                console.log(
                    "从搜索结果中创建小说:",
                    bookData ? bookData.title : "undefined"
                );

                if (!bookData || !bookData.title || !bookData.externalId) {
                    return res.status(400).json({
                        message: "无效的书籍数据",
                        details: "缺少必要的标题或外部ID",
                    });
                }

                // 先保存书籍信息
                console.log("准备保存书籍信息到数据库:", bookData.externalId);

                // 预处理数据
                const insertBookData: InsertBookInfo = {
                    externalId: bookData.externalId.toString(),
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
                const existingBook = await storage.getBookInfoByExternalId(
                    insertBookData.externalId
                );
                let bookInfo;

                if (existingBook) {
                    console.log(
                        "书籍信息已存在，使用现有数据:",
                        existingBook.id
                    );
                    bookInfo = existingBook;
                    
                    // 检查当前用户是否已经使用此书创建过小说
                    try {
                      // 查询已存在的小说
                      const existingNovels = await storage.getNovelsByBookInfoId(bookInfo.id);
                      console.log(`[路由] 查询到 ${existingNovels.length} 部书籍ID = ${bookInfo.id} 的小说`);
                      
                      // 过滤是否存在当前用户创建的小说
                      const currentUserId = req.user!.id;
                      console.log(`[路由] 当前用户ID: ${currentUserId}`);
                      
                      const userExistingNovel = existingNovels.find(novel => {
                      console.log(`[路由] 比较小说 userId: ${novel.userId} vs 当前用户ID: ${currentUserId}`);
                    return novel.userId === currentUserId;
                  });
                  
                  if (userExistingNovel) {
                      console.log(`[路由] 用户已经用此书创建过小说，ID: ${userExistingNovel.id}`);
                      return res.status(400).json({
                          message: "您已经用《" + bookInfo.title + "》创建过小说",
                          existingNovelId: userExistingNovel.id
                      });
                  } else {
                      console.log(`[路由] 未找到用户 ${currentUserId} 用此书创建的小说，可以继续创建`);
                  }
                    } catch (error) {
                      console.error("查询已有小说时出错:", error);
                      // 如果查询失败，我们就不做此检查，继续创建小说
                    }
                } else {
                    console.log("创建新的书籍信息");
                    bookInfo = await storage.createBookInfo(insertBookData);
                    console.log("新书籍信息创建成功:", bookInfo.id);
                }

                const novelData = {
                    title: bookInfo.title,
                    description: bookInfo.description || "",
                    coverImage: bookInfo.coverImage || "",
                    genre:
                        Array.isArray(bookInfo.categories) &&
                        bookInfo.categories.length > 0
                            ? bookInfo.categories[0]
                            : "",
                    status: req.body.status || "In Progress",
                    userId: req.user!.id,
                    bookInfoId: bookInfo.id // 必须设置 bookInfoId
                };

                console.log("[路由] 使用书籍信息创建小说:", {
                    bookId: bookInfo.id,
                    bookInfoId: novelData.bookInfoId, // 若干代码中也使用了 bookId 这个名称，这里证实清楚
                    title: novelData.title,
                    userId: novelData.userId,
                });

                const validationResult = insertNovelSchema.safeParse(novelData);
                if (!validationResult.success) {
                    console.error(
                        "小说数据验证失败:",
                        validationResult.error.format()
                    );
                    return res
                        .status(400)
                        .json({
                            message: "Invalid novel data",
                            errors: validationResult.error.format(),
                        });
                }

                console.log("[路由] 获取到的验证数据:", validationResult.data);
                // 再次确认 bookInfoId 存在
                if (!validationResult.data.bookInfoId) {
                    console.warn("[路由] 警告: 验证后的 bookInfoId 为空，尝试手动设置");
                    validationResult.data.bookInfoId = bookInfo.id;
                }

                // 避免仅依赖于validationResult，它可能修改了bookInfoId
                // 创建最终确定的数据对象
                const finalNovelData = {
                    ...validationResult.data,
                    bookInfoId: bookInfo.id // 强制确保bookInfoId不会丢失
                };
                
                console.log(`[路由-from-search] 最终数据确认 bookInfoId=${finalNovelData.bookInfoId}`);
                
                const novel = await storage.createNovel(finalNovelData);
                console.log(`小说创建成功: ID=${novel.id}, bookInfoId=${novel.bookInfoId}`);
                res.status(201).json(novel);
            } catch (error) {
                console.error("从书籍创建小说失败:", error);
                next(error);
            }
        }
    );

    app.put(
        "/api/novels/:id",
        isAuthenticated,
        upload.single("coverImage"),
        async (req, res, next) => {
            try {
                const novel = await storage.getNovel(parseInt(req.params.id));

                if (!novel) {
                    return res.status(404).json({ message: "Novel not found" });
                }

                // Check if user owns this novel
                if (novel.userId !== req.user!.id && !req.user!.isAdmin) {
                    return res.status(403).json({ message: "Forbidden" });
                }

                let coverImage = novel.coverImage;
                if (req.file) {
                    coverImage = `/uploads/${req.file.filename}`;
                } else if (req.body.coverImageUrl) {
                    // Use provided URL directly
                    coverImage = req.body.coverImageUrl;
                }

                const novelData = {
                    ...req.body,
                    coverImage,
                };

                // Remove coverImageUrl field as it's not in our schema
                delete novelData.coverImageUrl;

                const updatedNovel = await storage.updateNovel(
                    parseInt(req.params.id),
                    novelData
                );
                res.json(updatedNovel);
            } catch (error) {
                next(error);
            }
        }
    );

    app.delete("/api/novels/:id", isAuthenticated, async (req, res, next) => {
        try {
            const novelId = parseInt(req.params.id);
            const novel = await storage.getNovel(novelId);

            if (!novel) {
                return res.status(404).json({ message: "Novel not found" });
            }

            // Check if user owns this novel
            if (novel.userId !== req.user.id && !req.user.isAdmin) {
                return res.status(403).json({ message: "Forbidden" });
            }

            // Get all characters for this novel
            const characters = await storage.getCharacters(novelId);

            // Delete all relationships for this novel
            const relationships = await storage.getRelationships(novelId);
            for (const relationship of relationships) {
                await storage.deleteRelationship(relationship.id);
            }

            // Delete all characters for this novel
            for (const character of characters) {
                await storage.deleteCharacter(character.id);
            }

            // Finally delete the novel
            await storage.deleteNovel(novelId);
            res.status(204).end();
        } catch (error) {
            next(error);
        }
    });

    // Character routes
    app.get(
        "/api/novels/:novelId/characters",
        isAuthenticated,
        async (req, res, next) => {
            try {
                const novel = await storage.getNovel(
                    parseInt(req.params.novelId)
                );

                if (!novel) {
                    return res.status(404).json({ message: "Novel not found" });
                }

                // Check if user owns this novel
                if (novel.userId !== req.user.id && !req.user.isAdmin) {
                    return res.status(403).json({ message: "Forbidden" });
                }

                const characters = await storage.getCharacters(
                    parseInt(req.params.novelId)
                );
                res.json(characters);
            } catch (error) {
                next(error);
            }
        }
    );

    app.post(
        "/api/characters",
        isAuthenticated,
        upload.single("avatar"),
        async (req, res, next) => {
            try {
                const novelId = parseInt(req.body.novelId);
                const novel = await storage.getNovel(novelId);

                if (!novel) {
                    return res.status(404).json({ message: "Novel not found" });
                }

                // Check if user owns this novel
                if (novel.userId !== req.user.id && !req.user.isAdmin) {
                    return res.status(403).json({ message: "Forbidden" });
                }

                let avatar = null;
                if (req.file) {
                    avatar = `/uploads/${req.file.filename}`;
                } else if (req.body.avatarUrl) {
                    // If avatarUrl is provided, use it directly
                    avatar = req.body.avatarUrl;
                } else if (req.body.avatarData) {
                    // 处理 Base64 或 SVG 数据
                    avatar = req.body.avatarData;
                }

                const characterData = {
                    ...req.body,
                    avatar,
                    novelId,
                };

                // 删除临时字段
                delete characterData.avatarUrl;
                delete characterData.avatarData;

                const validationResult =
                    insertCharacterSchema.safeParse(characterData);
                if (!validationResult.success) {
                    return res.status(400).json({
                        message: "Invalid character data",
                        errors: validationResult.error.format(),
                    });
                }

                const character = await storage.createCharacter(
                    validationResult.data
                );
                res.status(201).json(character);
            } catch (error) {
                next(error);
            }
        }
    );

    app.put(
        "/api/characters/:id",
        isAuthenticated,
        upload.single("avatar"),
        async (req, res, next) => {
            try {
                const character = await storage.getCharacter(
                    parseInt(req.params.id)
                );

                if (!character) {
                    return res
                        .status(404)
                        .json({ message: "Character not found" });
                }

                const novel = await storage.getNovel(character.novelId);

                if (!novel) {
                    return res.status(404).json({ message: "Novel not found" });
                }

                // Check if user owns this novel
                if (novel.userId !== req.user.id && !req.user.isAdmin) {
                    return res.status(403).json({ message: "Forbidden" });
                }

                let avatar = character.avatar;
                if (req.file) {
                    avatar = `/uploads/${req.file.filename}`;
                } else if (req.body.avatarUrl) {
                    // If avatarUrl is provided, use it directly
                    avatar = req.body.avatarUrl;
                } else if (req.body.avatarData) {
                    // 处理 Base64 或 SVG 数据
                    avatar = req.body.avatarData;
                }

                const characterData = {
                    ...req.body,
                    avatar,
                };

                // 删除临时字段
                delete characterData.avatarUrl;
                delete characterData.avatarData;

                const updatedCharacter = await storage.updateCharacter(
                    parseInt(req.params.id),
                    characterData
                );
                res.json(updatedCharacter);
            } catch (error) {
                next(error);
            }
        }
    );

    app.delete(
        "/api/characters/:id",
        isAuthenticated,
        async (req, res, next) => {
            try {
                const character = await storage.getCharacter(
                    parseInt(req.params.id)
                );

                if (!character) {
                    return res
                        .status(404)
                        .json({ message: "Character not found" });
                }

                const novel = await storage.getNovel(character.novelId);

                if (!novel) {
                    return res.status(404).json({ message: "Novel not found" });
                }

                // Check if user owns this novel
                if (novel.userId !== req.user.id && !req.user.isAdmin) {
                    return res.status(403).json({ message: "Forbidden" });
                }

                await storage.deleteCharacter(parseInt(req.params.id));
                res.status(204).end();
            } catch (error) {
                next(error);
            }
        }
    );

    // Relationship Type routes
    app.get(
        "/api/relationship-types",
        isAuthenticated,
        async (req, res, next) => {
            try {
                const relationshipTypes = await storage.getRelationshipTypes(
                    req.user.id
                );
                res.json(relationshipTypes);
            } catch (error) {
                next(error);
            }
        }
    );

    app.post(
        "/api/relationship-types",
        isAuthenticated,
        async (req, res, next) => {
            try {
                const relationshipTypeData = {
                    ...req.body,
                    userId: req.user.id,
                };

                const validationResult =
                    insertRelationshipTypeSchema.safeParse(
                        relationshipTypeData
                    );
                if (!validationResult.success) {
                    return res.status(400).json({
                        message: "Invalid relationship type data",
                        errors: validationResult.error.format(),
                    });
                }

                const relationshipType = await storage.createRelationshipType(
                    validationResult.data
                );
                res.status(201).json(relationshipType);
            } catch (error) {
                next(error);
            }
        }
    );

    app.put(
        "/api/relationship-types/:id",
        isAuthenticated,
        async (req, res, next) => {
            try {
                const relationshipType = await storage.getRelationshipType(
                    parseInt(req.params.id)
                );

                if (!relationshipType) {
                    return res
                        .status(404)
                        .json({ message: "Relationship type not found" });
                }

                // 检查用户权限
                if (
                    relationshipType.userId !== req.user.id &&
                    !req.user.isAdmin
                ) {
                    return res.status(403).json({ message: "Forbidden" });
                }

                const updatedRelationshipType =
                    await storage.updateRelationshipType(
                        parseInt(req.params.id),
                        req.body
                    );
                res.json(updatedRelationshipType);
            } catch (error) {
                next(error);
            }
        }
    );

    app.delete(
        "/api/relationship-types/:id",
        isAuthenticated,
        async (req, res, next) => {
            try {
                const relationshipType = await storage.getRelationshipType(
                    parseInt(req.params.id)
                );

                if (!relationshipType) {
                    return res
                        .status(404)
                        .json({ message: "Relationship type not found" });
                }

                // 检查用户权限
                if (
                    relationshipType.userId !== req.user.id &&
                    !req.user.isAdmin
                ) {
                    return res.status(403).json({ message: "Forbidden" });
                }

                await storage.deleteRelationshipType(parseInt(req.params.id));
                res.status(204).end();
            } catch (error) {
                next(error);
            }
        }
    );

    // Relationship routes
    app.get(
        "/api/novels/:novelId/relationships",
        isAuthenticated,
        async (req, res, next) => {
            try {
                const novel = await storage.getNovel(
                    parseInt(req.params.novelId)
                );

                if (!novel) {
                    return res.status(404).json({ message: "Novel not found" });
                }

                // Check if user owns this novel
                if (novel.userId !== req.user.id && !req.user.isAdmin) {
                    return res.status(403).json({ message: "Forbidden" });
                }

                const relationships = await storage.getRelationships(
                    parseInt(req.params.novelId)
                );
                res.json(relationships);
            } catch (error) {
                next(error);
            }
        }
    );

    app.post("/api/relationships", isAuthenticated, async (req, res, next) => {
        try {
            const novelId = parseInt(req.body.novelId);
            const novel = await storage.getNovel(novelId);

            if (!novel) {
                return res.status(404).json({ message: "Novel not found" });
            }

            // Check if user owns this novel
            if (novel.userId !== req.user.id && !req.user.isAdmin) {
                return res.status(403).json({ message: "Forbidden" });
            }

            // Validate characters exist and belong to the same novel
            const sourceId = parseInt(req.body.sourceId);
            const targetId = parseInt(req.body.targetId);

            const sourceCharacter = await storage.getCharacter(sourceId);
            const targetCharacter = await storage.getCharacter(targetId);

            if (!sourceCharacter || !targetCharacter) {
                return res.status(404).json({ message: "Character not found" });
            }

            if (
                sourceCharacter.novelId !== novelId ||
                targetCharacter.novelId !== novelId
            ) {
                return res.status(400).json({
                    message: "Characters must belong to the same novel",
                });
            }

            // Validate relationship type exists
            const typeId = parseInt(req.body.typeId);
            const relationshipType = await storage.getRelationshipType(typeId);

            if (!relationshipType) {
                return res
                    .status(404)
                    .json({ message: "Relationship type not found" });
            }

            const relationshipData = {
                sourceId,
                targetId,
                typeId,
                description: req.body.description,
                novelId,
            };

            const validationResult =
                insertRelationshipSchema.safeParse(relationshipData);
            if (!validationResult.success) {
                return res.status(400).json({
                    message: "Invalid relationship data",
                    errors: validationResult.error.format(),
                });
            }

            const relationship = await storage.createRelationship(
                validationResult.data
            );
            res.status(201).json(relationship);
        } catch (error) {
            next(error);
        }
    });

    app.put(
        "/api/relationships/:id",
        isAuthenticated,
        async (req, res, next) => {
            try {
                const relationship = await storage.getRelationship(
                    parseInt(req.params.id)
                );

                if (!relationship) {
                    return res
                        .status(404)
                        .json({ message: "Relationship not found" });
                }

                const novel = await storage.getNovel(relationship.novelId);

                if (!novel) {
                    return res.status(404).json({ message: "Novel not found" });
                }

                // Check if user owns this novel
                if (novel.userId !== req.user.id && !req.user.isAdmin) {
                    return res.status(403).json({ message: "Forbidden" });
                }

                const updatedRelationship = await storage.updateRelationship(
                    parseInt(req.params.id),
                    req.body
                );
                res.json(updatedRelationship);
            } catch (error) {
                next(error);
            }
        }
    );

    app.delete(
        "/api/relationships/:id",
        isAuthenticated,
        async (req, res, next) => {
            try {
                const relationship = await storage.getRelationship(
                    parseInt(req.params.id)
                );

                if (!relationship) {
                    return res
                        .status(404)
                        .json({ message: "Relationship not found" });
                }

                const novel = await storage.getNovel(relationship.novelId);

                if (!novel) {
                    return res.status(404).json({ message: "Novel not found" });
                }

                // Check if user owns this novel
                if (novel.userId !== req.user.id && !req.user.isAdmin) {
                    return res.status(403).json({ message: "Forbidden" });
                }

                await storage.deleteRelationship(parseInt(req.params.id));
                res.status(204).end();
            } catch (error) {
                next(error);
            }
        }
    );

    // Admin user management
    app.get("/api/admin/users", isAdmin, async (req, res, next) => {
        try {
            const users = await storage.getUsers();
            // Remove passwords from response
            const usersResponse = users.map((user) => {
                const { password, ...userWithoutPassword } = user;
                return userWithoutPassword;
            });

            res.json(usersResponse);
        } catch (error) {
            next(error);
        }
    });

    app.put("/api/admin/users/:id", isAdmin, async (req, res, next) => {
        try {
            const userId = parseInt(req.params.id);
            const user = await storage.getUser(userId);

            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            // Don't allow changing the user's password through this route
            const { password, ...userData } = req.body;

            const updatedUser = await storage.updateUser(userId, userData);

            if (!updatedUser) {
                return res.status(404).json({ message: "User not found" });
            }

            // Remove password from response
            const { password: _, ...userWithoutPassword } = updatedUser;

            res.json(userWithoutPassword);
        } catch (error) {
            next(error);
        }
    });

    app.delete("/api/admin/users/:id", isAdmin, async (req, res, next) => {
        try {
            const userId = parseInt(req.params.id);

            // Don't allow deleting yourself
            if (userId === req.user.id) {
                return res
                    .status(400)
                    .json({ message: "Cannot delete yourself" });
            }

            const deleted = await storage.deleteUser(userId);

            if (!deleted) {
                return res.status(404).json({ message: "User not found" });
            }

            res.status(204).end();
        } catch (error) {
            next(error);
        }
    });

    // User profile update route
    app.patch("/api/users/:id", isAuthenticated, async (req, res, next) => {
        try {
            const userId = parseInt(req.params.id);

            // Only allow users to update their own profile, unless they're an admin
            if (userId !== req.user.id && !req.user.isAdmin) {
                return res.status(403).json({
                    message: "You don't have permission to update this profile",
                });
            }

            const { username, email } = req.body;

            // Check if username is already taken by another user
            if (username) {
                const existingUser = await storage.getUserByUsername(username);
                if (existingUser && existingUser.id !== userId) {
                    return res
                        .status(400)
                        .json({ message: "Username is already taken" });
                }
            }

            const updatedUser = await storage.updateUser(userId, {
                username,
                email,
            });

            if (!updatedUser) {
                return res.status(404).json({ message: "User not found" });
            }

            // Remove password from response
            const { password, ...userWithoutPassword } = updatedUser;

            res.json(userWithoutPassword);
        } catch (error) {
            next(error);
        }
    });

    // Change password route
    app.post(
        "/api/users/:id/change-password",
        isAuthenticated,
        async (req, res, next) => {
            try {
                const userId = parseInt(req.params.id);

                // Only allow users to change their own password, unless they're an admin
                if (userId !== req.user.id && !req.user.isAdmin) {
                    return res.status(403).json({
                        message:
                            "You don't have permission to change this password",
                    });
                }

                const { currentPassword, newPassword } = req.body;

                // Verify current password
                const user = await storage.getUser(userId);
                if (!user) {
                    return res.status(404).json({ message: "User not found" });
                }

                // Skip password verification for admins changing other users' passwords
                if (userId === req.user.id) {
                    // Use the comparePasswords function from auth.ts
                    // Since we can't directly import it here, we'll need to implement a simpler version
                    const { scrypt, timingSafeEqual } = await import("crypto");
                    const { promisify } = await import("util");
                    const scryptAsync = promisify(scrypt);

                    const [hashedPassword, salt] = user.password.split(".");
                    const hashedInputBuffer = Buffer.from(
                        hashedPassword,
                        "hex"
                    );
                    const suppliedInputBuffer = (await scryptAsync(
                        currentPassword,
                        salt,
                        64
                    )) as Buffer;

                    if (
                        !timingSafeEqual(hashedInputBuffer, suppliedInputBuffer)
                    ) {
                        return res
                            .status(401)
                            .json({ message: "Current password is incorrect" });
                    }
                }

                // Hash the new password
                const { scrypt, randomBytes } = await import("crypto");
                const { promisify } = await import("util");
                const scryptAsync = promisify(scrypt);

                const salt = randomBytes(16).toString("hex");
                const hashBuffer = (await scryptAsync(
                    newPassword,
                    salt,
                    64
                )) as Buffer;
                const hashedPassword = `${hashBuffer.toString("hex")}.${salt}`;

                // Update the password
                const updatedUser = await storage.updateUser(userId, {
                    password: hashedPassword,
                });

                if (!updatedUser) {
                    return res.status(404).json({ message: "User not found" });
                }

                res.json({ message: "Password updated successfully" });
            } catch (error) {
                next(error);
            }
        }
    );

    // Create the HTTP server
    const httpServer = createServer(app);

    return httpServer;
}
