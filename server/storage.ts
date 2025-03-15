import {
  users, novels, characters, relationshipTypes, relationships,
  type User, type Novel, type Character, type RelationshipType, type Relationship,
  type InsertUser, type InsertNovel, type InsertCharacter, type InsertRelationshipType, type InsertRelationship
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

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

  // Relationship Type operations
  getRelationshipTypes(userId: number): Promise<RelationshipType[]>;
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

  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private usersMap: Map<number, User>;
  private novelsMap: Map<number, Novel>;
  private charactersMap: Map<number, Character>;
  private relationshipTypesMap: Map<number, RelationshipType>;
  private relationshipsMap: Map<number, Relationship>;
  private userIdCounter: number;
  private novelIdCounter: number;
  private characterIdCounter: number;
  private relationshipTypeIdCounter: number;
  private relationshipIdCounter: number;
  sessionStore: session.SessionStore;

  constructor() {
    this.usersMap = new Map();
    this.novelsMap = new Map();
    this.charactersMap = new Map();
    this.relationshipTypesMap = new Map();
    this.relationshipsMap = new Map();
    this.userIdCounter = 1;
    this.novelIdCounter = 1;
    this.characterIdCounter = 1;
    this.relationshipTypeIdCounter = 1;
    this.relationshipIdCounter = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    });

    // Create default relationship types
    this.createRelationshipType({
      name: "Family",
      color: "#3B82F6", // blue
      userId: 0, // System default
    });
    this.createRelationshipType({
      name: "Friends",
      color: "#10B981", // green
      userId: 0, // System default
    });
    this.createRelationshipType({
      name: "Enemies",
      color: "#EF4444", // red
      userId: 0, // System default
    });
    this.createRelationshipType({
      name: "Romantic",
      color: "#8B5CF6", // purple
      userId: 0, // System default
    });
    this.createRelationshipType({
      name: "Mentorship",
      color: "#F59E0B", // amber
      userId: 0, // System default
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.usersMap.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(
      (user) => user.username === username
    );
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.usersMap.values());
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const timestamp = new Date();
    const newUser = { 
      ...user, 
      id, 
      createdAt: timestamp 
    };
    this.usersMap.set(id, newUser);
    return newUser;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.usersMap.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.usersMap.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.usersMap.delete(id);
  }

  // Novel operations
  async getNovels(userId?: number): Promise<Novel[]> {
    const novels = Array.from(this.novelsMap.values());
    if (userId !== undefined) {
      return novels.filter(novel => novel.userId === userId);
    }
    return novels;
  }

  async getNovel(id: number): Promise<Novel | undefined> {
    return this.novelsMap.get(id);
  }

  async createNovel(novel: InsertNovel): Promise<Novel> {
    const id = this.novelIdCounter++;
    const timestamp = new Date();
    const newNovel = {
      ...novel,
      id,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    this.novelsMap.set(id, newNovel);
    return newNovel;
  }

  async updateNovel(id: number, novelData: Partial<Novel>): Promise<Novel | undefined> {
    const novel = this.novelsMap.get(id);
    if (!novel) return undefined;
    
    const updatedNovel = { 
      ...novel, 
      ...novelData, 
      updatedAt: new Date() 
    };
    this.novelsMap.set(id, updatedNovel);
    return updatedNovel;
  }

  async deleteNovel(id: number): Promise<boolean> {
    // Delete all characters and relationships associated with this novel
    const charactersToDelete = Array.from(this.charactersMap.values())
      .filter(character => character.novelId === id)
      .map(character => character.id);
      
    charactersToDelete.forEach(charId => this.charactersMap.delete(charId));
    
    const relationshipsToDelete = Array.from(this.relationshipsMap.values())
      .filter(relationship => relationship.novelId === id)
      .map(relationship => relationship.id);
      
    relationshipsToDelete.forEach(relId => this.relationshipsMap.delete(relId));
    
    return this.novelsMap.delete(id);
  }

  // Character operations
  async getCharacters(novelId: number): Promise<Character[]> {
    return Array.from(this.charactersMap.values()).filter(
      character => character.novelId === novelId
    );
  }

  async getCharacter(id: number): Promise<Character | undefined> {
    return this.charactersMap.get(id);
  }

  async createCharacter(character: InsertCharacter): Promise<Character> {
    const id = this.characterIdCounter++;
    const timestamp = new Date();
    const newCharacter = {
      ...character,
      id,
      createdAt: timestamp
    };
    this.charactersMap.set(id, newCharacter);
    return newCharacter;
  }

  async updateCharacter(id: number, characterData: Partial<Character>): Promise<Character | undefined> {
    const character = this.charactersMap.get(id);
    if (!character) return undefined;
    
    const updatedCharacter = { ...character, ...characterData };
    this.charactersMap.set(id, updatedCharacter);
    return updatedCharacter;
  }

  async deleteCharacter(id: number): Promise<boolean> {
    // Delete all relationships involving this character
    const relationshipsToDelete = Array.from(this.relationshipsMap.values())
      .filter(rel => rel.sourceId === id || rel.targetId === id)
      .map(rel => rel.id);
      
    relationshipsToDelete.forEach(relId => this.relationshipsMap.delete(relId));
    
    return this.charactersMap.delete(id);
  }

  // Relationship Type operations
  async getRelationshipTypes(userId: number): Promise<RelationshipType[]> {
    return Array.from(this.relationshipTypesMap.values()).filter(
      type => type.userId === userId || type.userId === 0 // Show system defaults (userId=0) and user's custom types
    );
  }

  async getRelationshipType(id: number): Promise<RelationshipType | undefined> {
    return this.relationshipTypesMap.get(id);
  }

  async createRelationshipType(relationshipType: InsertRelationshipType): Promise<RelationshipType> {
    const id = this.relationshipTypeIdCounter++;
    const newRelationshipType = {
      ...relationshipType,
      id
    };
    this.relationshipTypesMap.set(id, newRelationshipType);
    return newRelationshipType;
  }

  async updateRelationshipType(id: number, relationshipTypeData: Partial<RelationshipType>): Promise<RelationshipType | undefined> {
    const relationshipType = this.relationshipTypesMap.get(id);
    if (!relationshipType) return undefined;
    
    // Don't allow updating system defaults (userId=0)
    if (relationshipType.userId === 0) return relationshipType;
    
    const updatedRelationshipType = { ...relationshipType, ...relationshipTypeData };
    this.relationshipTypesMap.set(id, updatedRelationshipType);
    return updatedRelationshipType;
  }

  async deleteRelationshipType(id: number): Promise<boolean> {
    const relationshipType = this.relationshipTypesMap.get(id);
    
    // Don't allow deleting system defaults (userId=0)
    if (!relationshipType || relationshipType.userId === 0) return false;
    
    return this.relationshipTypesMap.delete(id);
  }

  // Relationship operations
  async getRelationships(novelId: number): Promise<Relationship[]> {
    return Array.from(this.relationshipsMap.values()).filter(
      relationship => relationship.novelId === novelId
    );
  }

  async getRelationship(id: number): Promise<Relationship | undefined> {
    return this.relationshipsMap.get(id);
  }

  async createRelationship(relationship: InsertRelationship): Promise<Relationship> {
    const id = this.relationshipIdCounter++;
    const newRelationship = {
      ...relationship,
      id
    };
    this.relationshipsMap.set(id, newRelationship);
    return newRelationship;
  }

  async updateRelationship(id: number, relationshipData: Partial<Relationship>): Promise<Relationship | undefined> {
    const relationship = this.relationshipsMap.get(id);
    if (!relationship) return undefined;
    
    const updatedRelationship = { ...relationship, ...relationshipData };
    this.relationshipsMap.set(id, updatedRelationship);
    return updatedRelationship;
  }

  async deleteRelationship(id: number): Promise<boolean> {
    return this.relationshipsMap.delete(id);
  }
}

import { SupabaseStorage } from './storage-supabase';

export const storage = new SupabaseStorage();
