import { IStorage } from './storage';
import session from 'express-session';
import pgSessionStore from 'connect-pg-simple';
import pg from 'pg';
import {
  users, novels, characters, relationshipTypes, relationships, novelGenres, bookInfos,
  type User, type Novel, type Character, type RelationshipType, type Relationship, type NovelGenre, type BookInfo,
  type InsertUser, type InsertNovel, type InsertCharacter, type InsertRelationshipType, type InsertRelationship, type InsertNovelGenre, type InsertBookInfo
} from '@shared/schema';
import { db } from './db';
import { eq, and, or, desc, like, ilike, or as orExpr, and as andExpr, sql } from 'drizzle-orm';

const { Pool } = pg;

const PgStore = pgSessionStore(session);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // 只有在生产环境或明确指定时才启用 SSL
  ssl: process.env.NODE_ENV === 'production' || process.env.DATABASE_URL?.includes('sslmode=require') 
    ? { rejectUnauthorized: false } 
    : false,
  password: process.env.PGPASSWORD // Explicitly set password
});

export class DrizzleStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PgStore({
      pool,
      createTableIfMissing: true,
    });
    this.initializeDefaultRelationshipTypes();
  }

  private async initializeDefaultRelationshipTypes() {
    // 由于不再需要默认关系类型，这里仅仅保留初始化方法
    // 如果需要可以在这里添加自定义初始化逻辑
  }

  // Novel Genre operations
  async getNovelGenres(userId: number): Promise<NovelGenre[]> {
    return await db.select().from(novelGenres).where(
      or(
        eq(novelGenres.userId, userId),
        eq(novelGenres.isPublic, true)
      )
    );
  }

  async getPublicNovelGenres(): Promise<NovelGenre[]> {
    return await db.select().from(novelGenres).where(eq(novelGenres.isPublic, true));
  }

  async getNovelGenre(id: number): Promise<NovelGenre | undefined> {
    const results = await db.select().from(novelGenres).where(eq(novelGenres.id, id)).limit(1);
    return results.length > 0 ? results[0] : undefined;
  }

  async createNovelGenre(novelGenre: InsertNovelGenre): Promise<NovelGenre> {
    const result = await db.insert(novelGenres).values(novelGenre).returning();
    return result[0];
  }

  async updateNovelGenre(id: number, novelGenreData: Partial<NovelGenre>): Promise<NovelGenre | undefined> {
    const result = await db.update(novelGenres).set(novelGenreData).where(eq(novelGenres.id, id)).returning();
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteNovelGenre(id: number): Promise<boolean> {
    const result = await db.delete(novelGenres).where(eq(novelGenres.id, id)).returning();
    return result.length > 0;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return results.length > 0 ? results[0] : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return results.length > 0 ? results[0] : undefined;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const result = await db.update(users).set(userData).where(eq(users.id, id)).returning();
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  // Novel operations
  async getNovels(userId?: number): Promise<Novel[]> {
    if (userId) {
      return await db.select().from(novels).where(eq(novels.userId, userId)).orderBy(desc(novels.createdAt));
    }
    return await db.select().from(novels).orderBy(desc(novels.createdAt));
  }

  async getNovel(id: number): Promise<Novel | undefined> {
    const results = await db.select({
      novel: novels,
      bookInfo: bookInfos
    })
    .from(novels)
    .leftJoin(bookInfos, eq(novels.bookInfoId, bookInfos.id))
    .where(eq(novels.id, id))
    .limit(1);

    if (results.length === 0) {
      return undefined;
    }

    const { novel, bookInfo } = results[0];
    return {
      ...novel,
      bookInfo: bookInfo || undefined
    };
  }

  async createNovel(novel: InsertNovel): Promise<Novel> {
    console.log(`[数据库操作] 开始创建小说:`, {
      title: novel.title,
      bookInfoId: novel.bookInfoId
    });
    
    // 创建一个新对象来保存处理后的数据
    const insertData = { ...novel };
    
    // 统一处理 bookInfoId
    if (insertData.bookInfoId !== undefined && insertData.bookInfoId !== null) {
      // 确保 bookInfoId 是数字类型
      const numericId = Number(insertData.bookInfoId);
      
      if (!isNaN(numericId) && numericId > 0) {
        // 只有当转换结果是有效的正数时才设置
        insertData.bookInfoId = numericId;
        console.log(`[数据库操作] bookInfoId 有效，已转换为数字: ${numericId}`);
      } else {
        console.warn(`[数据库操作] 警告: bookInfoId 非有效数字 (${insertData.bookInfoId})，设置为 null`);
        insertData.bookInfoId = null; // 无效值设为null而不是保留错误的值
      }
    } else {
      console.log(`[数据库操作] bookInfoId 未提供或为null`);
      // 确保明确设置为null而不是undefined
      insertData.bookInfoId = null;
    }
    
    try {
      // 给values放入明确处理过的插入数据
      console.log(`[数据库操作] 准备插入数据:`, {
        title: insertData.title,
        bookInfoId: insertData.bookInfoId,
        bookInfoIdType: typeof insertData.bookInfoId
      });
      
      const result = await db.insert(novels).values(insertData).returning();
      console.log(`[数据库操作] 小说创建成功: ID=${result[0].id}, bookInfoId=${result[0].bookInfoId}`);
      return result[0];
    } catch (error) {
      console.error(`[数据库操作] 创建小说失败:`, error);
      throw error;
    }
  }

  async updateNovel(id: number, novelData: Partial<Novel>): Promise<Novel | undefined> {
    // Always update the updatedAt field
    const updateData = {
      ...novelData,
      updatedAt: new Date()
    };
    
    const result = await db.update(novels).set(updateData).where(eq(novels.id, id)).returning();
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteNovel(id: number): Promise<boolean> {
    // The database cascade will handle deleting related entities
    const result = await db.delete(novels).where(eq(novels.id, id)).returning();
    return result.length > 0;
  }

  // Character operations
  async getCharacters(novelId: number): Promise<Character[]> {
    return await db.select().from(characters).where(eq(characters.novelId, novelId));
  }

  async getCharacter(id: number): Promise<Character | undefined> {
    const results = await db.select().from(characters).where(eq(characters.id, id)).limit(1);
    return results.length > 0 ? results[0] : undefined;
  }

  async createCharacter(character: InsertCharacter): Promise<Character> {
    const result = await db.insert(characters).values(character).returning();
    return result[0];
  }

  async updateCharacter(id: number, characterData: Partial<Character>): Promise<Character | undefined> {
    const result = await db.update(characters).set(characterData).where(eq(characters.id, id)).returning();
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteCharacter(id: number): Promise<boolean> {
    // The database cascade will handle deleting related relationships
    const result = await db.delete(characters).where(eq(characters.id, id)).returning();
    return result.length > 0;
  }

  // Relationship Type operations
  async getRelationshipTypes(userId: number): Promise<RelationshipType[]> {
    // 只获取用户自定义的关系类型
    return await db.select().from(relationshipTypes)
      .where(eq(relationshipTypes.userId, userId));
  }

  async getRelationshipType(id: number): Promise<RelationshipType | undefined> {
    const results = await db.select().from(relationshipTypes).where(eq(relationshipTypes.id, id)).limit(1);
    return results.length > 0 ? results[0] : undefined;
  }

  async createRelationshipType(relationshipType: InsertRelationshipType): Promise<RelationshipType> {
    const result = await db.insert(relationshipTypes).values(relationshipType).returning();
    return result[0];
  }

  async updateRelationshipType(id: number, relationshipTypeData: Partial<RelationshipType>): Promise<RelationshipType | undefined> {
    // 检查关系类型是否存在
    const existing = await this.getRelationshipType(id);
    if (!existing) return undefined;
    
    const result = await db.update(relationshipTypes).set(relationshipTypeData).where(eq(relationshipTypes.id, id)).returning();
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteRelationshipType(id: number): Promise<boolean> {
    // 检查关系类型是否存在
    const existing = await this.getRelationshipType(id);
    if (!existing) return false;
    
    const result = await db.delete(relationshipTypes).where(eq(relationshipTypes.id, id)).returning();
    return result.length > 0;
  }

  // Relationship operations
  async getRelationships(novelId: number): Promise<Relationship[]> {
    return await db.select().from(relationships).where(eq(relationships.novelId, novelId));
  }

  async getRelationship(id: number): Promise<Relationship | undefined> {
    const results = await db.select().from(relationships).where(eq(relationships.id, id)).limit(1);
    return results.length > 0 ? results[0] : undefined;
  }

  async createRelationship(relationship: InsertRelationship): Promise<Relationship> {
    const result = await db.insert(relationships).values(relationship).returning();
    return result[0];
  }

  async updateRelationship(id: number, relationshipData: Partial<Relationship>): Promise<Relationship | undefined> {
    const result = await db.update(relationships).set(relationshipData).where(eq(relationships.id, id)).returning();
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteRelationship(id: number): Promise<boolean> {
    const result = await db.delete(relationships).where(eq(relationships.id, id)).returning();
    return result.length > 0;
  }

  // Book Info operations
  async getBookInfo(id: number): Promise<BookInfo | undefined> {
    const results = await db.select().from(bookInfos).where(eq(bookInfos.id, id)).limit(1);
    return results.length > 0 ? results[0] : undefined;
  }

  async getBookInfoByExternalId(externalId: string | number | null | undefined): Promise<BookInfo | undefined> {
    // 注意: 参数类型改为更广泛的类型，以适应不同的调用方式
    
    // 统一处理成字符串类型
    if (externalId === null || externalId === undefined) {
      console.error('[数据库操作] getBookInfoByExternalId: 传入的外部ID为空');
      return undefined;
    }
    
    // 将任何类型都转换为字符串
    const idString = String(externalId).trim();
    
    if (!idString) {
      console.error('[数据库操作] getBookInfoByExternalId: 转换后的外部ID为空字符串');
      return undefined;
    }
    
    console.log(`[数据库操作] 查询外部ID: "${idString}", 原始类型: ${typeof externalId}, 转换后类型: ${typeof idString}`);
    
    try {      
      // 使用统一的字符串形式进行查询
      const results = await db.select().from(bookInfos).where(eq(bookInfos.externalId, idString)).limit(1);
      
      if (results.length > 0) {
        console.log(`[数据库操作] 找到书籍信息: ID=${results[0].id}, 标题=${results[0].title}, 外部ID=${results[0].externalId}`);
      } else {
        console.log(`[数据库操作] 未找到外部ID为"${idString}"的书籍信息`);
      }
      
      return results.length > 0 ? results[0] : undefined;
    } catch (error) {
      console.error('[数据库操作] 根据外部ID查询书籍时出错:', error);
      return undefined;
    }
  }

  async searchBookInfos(query: string): Promise<BookInfo[]> {
    // 分解查询字符串以便更灵活地搜索
    const terms = query.split(/\s+/).filter(term => term.length > 0);
    
    if (terms.length === 0) {
      // 如果没有有效的搜索词，返回最近添加的书籍
      return await db.select().from(bookInfos).orderBy(desc(bookInfos.createdAt)).limit(10);
    }
    
    // 构建搜索条件
    const conditions = terms.map(term => {
      const likePattern = `%${term}%`;
      return orExpr(
        ilike(bookInfos.title, likePattern),
        ilike(bookInfos.author, likePattern),
        ilike(bookInfos.isbn, likePattern)
      );
    });
    
    // 组合所有条件（AND连接多个词条的搜索）
    return await db.select()
      .from(bookInfos)
      .where(andExpr(...conditions))
      .orderBy(desc(bookInfos.createdAt))
      .limit(20);
  }

  async createBookInfo(bookInfo: InsertBookInfo): Promise<BookInfo> {
    // 统一处理 externalId，确保是字符串类型
    if (bookInfo.externalId === undefined || bookInfo.externalId === null) {
      console.error('[数据库操作] 创建书籍信息失败: externalId不能为null或undefined');
      throw new Error('创建书籍信息时externalId不能为空');
    }
    
    // 使用String()来统一处理为字符串
    const externalId = String(bookInfo.externalId).trim();
    
    if (!externalId) {
      console.error('[数据库操作] 创建书籍信息失败: 处理后的externalId为空字符串');
      throw new Error('创建书籍信息时externalId不能为空');
    }
    
    console.log(`[数据库操作] 开始创建书籍信息，外部ID: "${externalId}", 标题: "${bookInfo.title}", 原始类型: ${typeof bookInfo.externalId}`);
    
    // 先检查是否已存在相同的 externalId
    const existing = await this.getBookInfoByExternalId(externalId);
    if (existing) {
      console.log(`[数据库操作] 书籍信息已存在，ID: ${existing.id}, 外部ID: "${existing.externalId}"`);
      return existing;
    }
    
    // 准备数据，创建一个新对象以确保不改变原始对象
    const now = new Date();
    const bookInfoWithTimestamps = {
      ...bookInfo,
      externalId, // 使用处理后的字符串类型外部ID
      createdAt: now,
      updatedAt: now
    };
    
    // 统一处理categories字段，确保是数组
    if (!Array.isArray(bookInfoWithTimestamps.categories)) {
      if (bookInfoWithTimestamps.categories) {
        try {
          // 如果是字符串，尝试解析
          if (typeof bookInfoWithTimestamps.categories === 'string') {
            try {
              bookInfoWithTimestamps.categories = JSON.parse(bookInfoWithTimestamps.categories as string);
            } catch {
              // 解析失败，转换为数组
              bookInfoWithTimestamps.categories = [bookInfoWithTimestamps.categories as string];
            }
          } else {
            // 其他类型则使用空数组
            bookInfoWithTimestamps.categories = [];
          }
        } catch (err) {
          console.warn(`[数据库操作] 警告: 处理categories时出错，使用空数组`, err);
          bookInfoWithTimestamps.categories = [];
        }
      } else {
        bookInfoWithTimestamps.categories = [];
      }
    }
    
    console.log(`[数据库操作] 准备插入书籍数据:`);
    console.log(JSON.stringify({
      id: 'to be generated',
      externalId: bookInfoWithTimestamps.externalId,
      title: bookInfoWithTimestamps.title,
      categoriesType: typeof bookInfoWithTimestamps.categories,
      categoriesIsArray: Array.isArray(bookInfoWithTimestamps.categories),
      categories: bookInfoWithTimestamps.categories
    }, null, 2));
    
    try {
      console.log(`[数据库操作] 执行插入操作...`);
      const result = await db.insert(bookInfos).values(bookInfoWithTimestamps).returning();
      console.log(`[数据库操作] 插入成功！新书籍信息 ID: ${result[0].id}, 外部ID: ${result[0].externalId}`);
      return result[0];
    } catch (error) {
      console.error(`[数据库操作] 插入书籍信息失败:`, error);
      throw error;
    }
  }

  async updateBookInfo(id: number, bookInfoData: Partial<BookInfo>): Promise<BookInfo | undefined> {
    // 更新时间戳
    const updateData = {
      ...bookInfoData,
      updatedAt: new Date()
    };
    
    const result = await db.update(bookInfos).set(updateData).where(eq(bookInfos.id, id)).returning();
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteBookInfo(id: number): Promise<boolean> {
    // 先检查是否有小说关联到这个书籍信息
    const novels = await this.getNovelsByBookInfoId(id);
    
    if (novels.length > 0) {
      // 有关联的小说，只移除关联而不删除书籍信息
      for (const novel of novels) {
        await this.updateNovel(novel.id, { bookInfoId: null });
      }
      return false; // 表示没有真正删除书籍信息
    }
    
    // 没有关联的小说，可以安全删除
    const result = await db.delete(bookInfos).where(eq(bookInfos.id, id)).returning();
    return result.length > 0;
  }

  // 扩展小说操作
  async getNovelsByBookInfoId(bookInfoId: number): Promise<Novel[]> {
    // 现在可以直接使用模式了，因为已在schema中整合了定义
    console.log(`[数据库操作] 开始查询书籍ID为${bookInfoId}的小说`);
    
    try {
      // 执行查询
      const query = db.select().from(novels).where(eq(novels.bookInfoId, bookInfoId));
      console.log(`[数据库操作] 执行查询: ${JSON.stringify(query.toSQL())}`);
      
      const results = await query;
      console.log(`[数据库操作] 查询结果数量: ${results.length}`);
      return results;
    } catch (error) {
      console.error(`[数据库操作] 查询时出错:`, error);
      
      // 如果刚才的查询失败，尝试使用原始方式SQL查询
      try {
        console.log(`[数据库操作] 尝试使用原始SQL查询方式`);
        const { rows } = await pool.query(
          'SELECT * FROM novels WHERE book_info_id = $1', 
          [bookInfoId]
        );
        
        console.log(`[数据库操作] 原始查询结果数量: ${rows.length}`);
        
        // 转换字段名称为驼峰命名
        return rows.map(row => ({
          id: row.id,
          title: row.title,
          description: row.description,
          coverImage: row.cover_image,
          genre: row.genre,
          status: row.status,
          userId: row.user_id,
          bookInfoId: row.book_info_id,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        }));
      } catch (sqlError) {
        console.error(`[数据库操作] 原始查询也失败:`, sqlError);
        return [];
      }
    }
  }
}