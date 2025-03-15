import { IStorage } from './storage';
import session from 'express-session';
import pgSessionStore from 'connect-pg-simple';
import pg from 'pg';
import {
  users, novels, characters, relationshipTypes, relationships,
  type User, type Novel, type Character, type RelationshipType, type Relationship,
  type InsertUser, type InsertNovel, type InsertCharacter, type InsertRelationshipType, type InsertRelationship
} from '@shared/schema';
import { db } from './db';
import { eq, and, or, desc } from 'drizzle-orm';

const { Pool } = pg;

const PgStore = pgSessionStore(session);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
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
    // 由于数据库外键约束，我们需要创建一个系统管理员用户来关联默认关系类型
    // 首先，检查是否已经存在系统管理员用户
    const adminUserResults = await db.select().from(users).where(eq(users.username, 'system')).limit(1);
    
    let adminUserId: number;
    if (adminUserResults.length === 0) {
      // 创建系统管理员用户
      const adminUser = {
        username: 'system',
        password: 'system_password_not_for_login', // 不会被用于登录
        email: 'system@example.com',
        isAdmin: true
      };
      
      const result = await db.insert(users).values(adminUser).returning();
      adminUserId = result[0].id;
    } else {
      adminUserId = adminUserResults[0].id;
    }
    
    const defaultTypes = [
      { name: "Family", color: "#3B82F6", userId: adminUserId },
      { name: "Friends", color: "#10B981", userId: adminUserId },
      { name: "Enemies", color: "#EF4444", userId: adminUserId },
      { name: "Romantic", color: "#8B5CF6", userId: adminUserId },
      { name: "Mentorship", color: "#F59E0B", userId: adminUserId }
    ];

    for (const type of defaultTypes) {
      const existingType = await db.select().from(relationshipTypes).where(eq(relationshipTypes.name, type.name)).limit(1);
      
      if (existingType.length === 0) {
        await db.insert(relationshipTypes).values(type);
      }
    }
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
    // 获取系统默认的关系类型和用户自定义的关系类型
    const systemUser = await db.select().from(users).where(eq(users.username, 'system')).limit(1);
    const systemUserId = systemUser.length > 0 ? systemUser[0].id : -1;
    
    return await db.select().from(relationshipTypes)
      .where(or(eq(relationshipTypes.userId, userId), eq(relationshipTypes.userId, systemUserId)));
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
    // 检查是否为系统默认关系类型
    const existing = await this.getRelationshipType(id);
    if (!existing) return undefined;
    
    // 获取系统用户ID
    const systemUser = await db.select().from(users).where(eq(users.username, 'system')).limit(1);
    const systemUserId = systemUser.length > 0 ? systemUser[0].id : -1;
    
    // 如果是系统默认类型，不允许更新
    if (existing.userId === systemUserId) {
      return existing; // 不更新系统默认类型
    }
    
    const result = await db.update(relationshipTypes).set(relationshipTypeData).where(eq(relationshipTypes.id, id)).returning();
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteRelationshipType(id: number): Promise<boolean> {
    // 检查是否为系统默认关系类型
    const existing = await this.getRelationshipType(id);
    if (!existing) return false;
    
    // 获取系统用户ID
    const systemUser = await db.select().from(users).where(eq(users.username, 'system')).limit(1);
    const systemUserId = systemUser.length > 0 ? systemUser[0].id : -1;
    
    // 如果是系统默认类型，不允许删除
    if (existing.userId === systemUserId) {
      return false; // 不删除系统默认类型
    }
    
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