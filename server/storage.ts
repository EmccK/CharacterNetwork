import {
  type User, type Novel, type Character, type RelationshipType, type Relationship, type NovelGenre, type BookInfo, type TimelineEvent,
  type InsertUser, type InsertNovel, type InsertCharacter, type InsertRelationshipType, type InsertRelationship, type InsertNovelGenre, type InsertBookInfo, type InsertTimelineEvent
} from "@shared/schema";
import session from "express-session";

// Interface for storage operations
export interface IStorage {
  // 索引签名，允许动态方法访问
  [key: string]: any;

  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

  // Novel Genre operations
  getNovelGenres(userId: number): Promise<NovelGenre[]>;
  getPublicNovelGenres(): Promise<NovelGenre[]>;
  getNovelGenre(id: number): Promise<NovelGenre | undefined>;
  createNovelGenre(novelGenre: InsertNovelGenre): Promise<NovelGenre>;
  updateNovelGenre(id: number, novelGenre: Partial<NovelGenre>): Promise<NovelGenre | undefined>;
  deleteNovelGenre(id: number): Promise<boolean>;

  // Novel operations
  getNovels(userId?: number): Promise<Novel[]>;
  getNovel(id: number): Promise<Novel | undefined>;
  createNovel(novel: InsertNovel): Promise<Novel>;
  updateNovel(id: number, novel: Partial<Novel>): Promise<Novel | undefined>;
  deleteNovel(id: number): Promise<boolean>;

  // Character operations
  getCharacters(novelId: number): Promise<Character[]>;
  getCharacter(id: number): Promise<Character | undefined>;
  createCharacter(character: InsertCharacter): Promise<Character>;
  updateCharacter(id: number, character: Partial<Character>): Promise<Character | undefined>;
  deleteCharacter(id: number): Promise<boolean>;

  // Relationship Type operations (包括系统默认类型和用户自定义类型)
  getRelationshipTypes(userId: number): Promise<RelationshipType[]>; // 获取用户自定义类型
  getAllAvailableRelationshipTypes(userId: number): Promise<RelationshipType[]>; // 获取所有可用类型（系统默认+用户自定义）
  getSystemDefaultRelationshipTypes(): Promise<RelationshipType[]>; // 获取系统默认类型
  getRelationshipType(id: number): Promise<RelationshipType | undefined>;
  createRelationshipType(relationshipType: InsertRelationshipType): Promise<RelationshipType>;
  updateRelationshipType(id: number, relationshipType: Partial<RelationshipType>): Promise<RelationshipType | undefined>;
  deleteRelationshipType(id: number): Promise<boolean>;

  // Relationship operations
  getRelationships(novelId: number): Promise<Relationship[]>;
  getRelationship(id: number): Promise<Relationship | undefined>;
  createRelationship(relationship: InsertRelationship): Promise<Relationship>;
  updateRelationship(id: number, relationship: Partial<Relationship>): Promise<Relationship | undefined>;
  deleteRelationship(id: number): Promise<boolean>;

  // Book Info operations
  getBookInfo(id: number): Promise<BookInfo | undefined>;
  getBookInfoByExternalId(externalId: string): Promise<BookInfo | undefined>;
  searchBookInfos(query: string): Promise<BookInfo[]>;
  createBookInfo(bookInfo: InsertBookInfo): Promise<BookInfo>;
  updateBookInfo(id: number, bookInfo: Partial<BookInfo>): Promise<BookInfo | undefined>;
  deleteBookInfo(id: number): Promise<boolean>;
  
  // 扩展小说操作，支持通过bookInfoId
  getNovelsByBookInfoId(bookInfoId: number): Promise<Novel[]>;

  // 时间线事件相关操作
  getNovelTimelineEvents(novelId: number): Promise<TimelineEvent[]>;
  getTimelineEvent(id: number): Promise<TimelineEvent | undefined>;
  createTimelineEvent(event: InsertTimelineEvent): Promise<TimelineEvent>;
  updateTimelineEvent(id: number, event: Partial<TimelineEvent>): Promise<TimelineEvent | undefined>;
  deleteTimelineEvent(id: number): Promise<boolean>;

  // Session store
  sessionStore: session.Store;
}






import { DrizzleStorage } from './storage-drizzle';

export const storage = new DrizzleStorage();
