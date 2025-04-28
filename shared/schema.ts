import { pgTable, text, serial, integer, boolean, timestamp, unique, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User Schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Novel Genre Schema
export const novelGenres = pgTable("novel_genres", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  isPublic: boolean("is_public").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (novelGenres) => {
  return {
    nameUserIdUnique: unique().on(novelGenres.name, novelGenres.userId),
  };
});

// Novel Schema
export const novels = pgTable("novels", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  coverImage: text("cover_image"),
  genre: text("genre"),
  status: text("status").default("In Progress"),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  bookInfoId: integer("book_info_id").references(() => bookInfos.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Character Schema
export const characters = pgTable("characters", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  avatar: text("avatar"),
  novelId: integer("novel_id").notNull().references(() => novels.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relationship Type Schema
export const relationshipTypes = pgTable("relationship_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
});

// Relationship Schema
export const relationships = pgTable("relationships", {
  id: serial("id").primaryKey(),
  sourceId: integer("source_id").notNull().references(() => characters.id, { onDelete: "cascade" }),
  targetId: integer("target_id").notNull().references(() => characters.id, { onDelete: "cascade" }),
  typeId: integer("type_id").notNull().references(() => relationshipTypes.id, { onDelete: "cascade" }),
  description: text("description"),
  novelId: integer("novel_id").notNull().references(() => novels.id, { onDelete: "cascade" }),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  isAdmin: true,
});

export const insertNovelGenreSchema = createInsertSchema(novelGenres).pick({
  name: true,
  description: true,
  userId: true,
  isPublic: true,
});

export const insertNovelSchema = createInsertSchema(novels).pick({
  title: true,
  description: true,
  coverImage: true,
  genre: true,
  status: true,
  userId: true,
  bookInfoId: true,
});

export const insertCharacterSchema = createInsertSchema(characters).pick({
  name: true,
  description: true,
  avatar: true,
  novelId: true,
});

export const insertRelationshipTypeSchema = createInsertSchema(relationshipTypes).pick({
  name: true,
  color: true,
  userId: true,
});

export const insertRelationshipSchema = createInsertSchema(relationships).pick({
  sourceId: true,
  targetId: true,
  typeId: true,
  description: true,
  novelId: true,
});

// Types for validation and type safety
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertNovelGenre = z.infer<typeof insertNovelGenreSchema>;
export type NovelGenre = typeof novelGenres.$inferSelect;

export type InsertNovel = z.infer<typeof insertNovelSchema>;
export type Novel = typeof novels.$inferSelect;

export type InsertCharacter = z.infer<typeof insertCharacterSchema>;
export type Character = typeof characters.$inferSelect;

export type InsertRelationshipType = z.infer<typeof insertRelationshipTypeSchema>;
export type RelationshipType = typeof relationshipTypes.$inferSelect;

export type InsertRelationship = z.infer<typeof insertRelationshipSchema>;
export type Relationship = typeof relationships.$inferSelect;

// Book Info Schema - 存储外部API获取的书籍信息
export const bookInfos = pgTable("book_infos", {
  id: serial("id").primaryKey(),
  externalId: text("external_id").notNull().unique(), // 外部API的唯一标识符
  title: text("title").notNull(),
  author: text("author"),
  description: text("description"),
  coverImage: text("cover_image"),
  publishedDate: text("published_date"),
  publisher: text("publisher"),
  isbn: text("isbn"),
  pageCount: integer("page_count"),
  categories: jsonb("categories"), // 存储类别数组或对象
  language: text("language"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 提示: novelsExtended 定义已被移除，合并到 novels 表中
// bookInfoId 字段已直接添加到 novels 表定义中

// 书籍信息插入schema
export const insertBookInfoSchema = createInsertSchema(bookInfos).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// 导出类型
export type InsertBookInfo = z.infer<typeof insertBookInfoSchema>;
export type BookInfo = typeof bookInfos.$inferSelect;

// Login type
export type LoginData = Pick<InsertUser, "username" | "password">;
