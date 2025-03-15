import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
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

// Novel Schema
export const novels = pgTable("novels", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  coverImage: text("cover_image"),
  genre: text("genre"),
  status: text("status").default("In Progress"),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Character Schema
export const characters = pgTable("characters", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  avatar: text("avatar"),
  novelId: integer("novel_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relationship Type Schema
export const relationshipTypes = pgTable("relationship_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull(),
  userId: integer("user_id").notNull(),
});

// Relationship Schema
export const relationships = pgTable("relationships", {
  id: serial("id").primaryKey(),
  sourceId: integer("source_id").notNull(),
  targetId: integer("target_id").notNull(),
  typeId: integer("type_id").notNull(),
  description: text("description"),
  novelId: integer("novel_id").notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  isAdmin: true,
});

export const insertNovelSchema = createInsertSchema(novels).pick({
  title: true,
  description: true,
  coverImage: true,
  genre: true,
  status: true,
  userId: true,
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

export type InsertNovel = z.infer<typeof insertNovelSchema>;
export type Novel = typeof novels.$inferSelect;

export type InsertCharacter = z.infer<typeof insertCharacterSchema>;
export type Character = typeof characters.$inferSelect;

export type InsertRelationshipType = z.infer<typeof insertRelationshipTypeSchema>;
export type RelationshipType = typeof relationshipTypes.$inferSelect;

export type InsertRelationship = z.infer<typeof insertRelationshipSchema>;
export type Relationship = typeof relationships.$inferSelect;

// Login type
export type LoginData = Pick<InsertUser, "username" | "password">;
