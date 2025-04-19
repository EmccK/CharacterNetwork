import { IStorage } from './storage';
import session from 'express-session';
import pgSessionStore from 'connect-pg-simple';
import pg from 'pg';
import {
  users, novels, characters, relationshipTypes, relationships, novelGenres,
  type User, type Novel, type Character, type RelationshipType, type Relationship, type NovelGenre,
  type InsertUser, type InsertNovel, type InsertCharacter, type InsertRelationshipType, type InsertRelationship, type InsertNovelGenre
} from '@shared/schema';
import { db } from './db';
import { eq, and, or, desc } from 'drizzle-orm';

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
    const results = await db.select().from(novels).where(eq(novels.id, id)).limit(1);
    return results.length > 0 ? results[0] : undefined;
  }

  async createNovel(novel: InsertNovel): Promise<Novel> {
    const result = await db.insert(novels).values(novel).returning();
    return result[0];
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
}