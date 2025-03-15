import { IStorage } from './storage';
import session from 'express-session';
import createMemoryStore from 'memorystore';
import { supabase } from './supabase';
import type {
  User,
  Novel,
  Character,
  RelationshipType,
  Relationship,
  InsertUser,
  InsertNovel,
  InsertCharacter,
  InsertRelationshipType,
  InsertRelationship
} from '@shared/schema';

const MemoryStore = createMemoryStore(session);

export class SupabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    });
    this.initializeDefaultRelationshipTypes();
  }

  private async initializeDefaultRelationshipTypes() {
    const defaultTypes = [
      { name: "Family", color: "#3B82F6", userId: 0 },
      { name: "Friends", color: "#10B981", userId: 0 },
      { name: "Enemies", color: "#EF4444", userId: 0 },
      { name: "Romantic", color: "#8B5CF6", userId: 0 },
      { name: "Mentorship", color: "#F59E0B", userId: 0 }
    ];

    for (const type of defaultTypes) {
      const { data } = await supabase
        .from('relationship_types')
        .select()
        .eq('name', type.name)
        .single();

      if (!data) {
        await supabase.from('relationship_types').insert(type);
      }
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const { data } = await supabase
      .from('users')
      .select()
      .eq('id', id)
      .single();
    return data || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data } = await supabase
      .from('users')
      .select()
      .eq('username', username)
      .single();
    return data || undefined;
  }

  async getUsers(): Promise<User[]> {
    const { data } = await supabase
      .from('users')
      .select();
    return data || [];
  }

  async createUser(user: InsertUser): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert(user)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const { data } = await supabase
      .from('users')
      .update(userData)
      .eq('id', id)
      .select()
      .single();
    return data || undefined;
  }

  async deleteUser(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    return !error;
  }

  // Novel operations
  async getNovels(userId?: number): Promise<Novel[]> {
    let query = supabase.from('novels').select();
    if (userId) {
      query = query.eq('userId', userId);
    }
    const { data } = await query;
    return data || [];
  }

  async getNovel(id: number): Promise<Novel | undefined> {
    const { data } = await supabase
      .from('novels')
      .select()
      .eq('id', id)
      .single();
    return data || undefined;
  }

  async createNovel(novel: InsertNovel): Promise<Novel> {
    const { data, error } = await supabase
      .from('novels')
      .insert(novel)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateNovel(id: number, novelData: Partial<Novel>): Promise<Novel | undefined> {
    const { data } = await supabase
      .from('novels')
      .update(novelData)
      .eq('id', id)
      .select()
      .single();
    return data || undefined;
  }

  async deleteNovel(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('novels')
      .delete()
      .eq('id', id);
    return !error;
  }

  // Character operations
  async getCharacters(novelId: number): Promise<Character[]> {
    const { data } = await supabase
      .from('characters')
      .select()
      .eq('novelId', novelId);
    return data || [];
  }

  async getCharacter(id: number): Promise<Character | undefined> {
    const { data } = await supabase
      .from('characters')
      .select()
      .eq('id', id)
      .single();
    return data || undefined;
  }

  async createCharacter(character: InsertCharacter): Promise<Character> {
    const { data, error } = await supabase
      .from('characters')
      .insert(character)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateCharacter(id: number, characterData: Partial<Character>): Promise<Character | undefined> {
    const { data } = await supabase
      .from('characters')
      .update(characterData)
      .eq('id', id)
      .select()
      .single();
    return data || undefined;
  }

  async deleteCharacter(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('characters')
      .delete()
      .eq('id', id);
    return !error;
  }

  // Relationship Type operations
  async getRelationshipTypes(userId: number): Promise<RelationshipType[]> {
    const { data } = await supabase
      .from('relationship_types')
      .select()
      .or(`userId.eq.${userId},userId.eq.0`);
    return data || [];
  }

  async getRelationshipType(id: number): Promise<RelationshipType | undefined> {
    const { data } = await supabase
      .from('relationship_types')
      .select()
      .eq('id', id)
      .single();
    return data || undefined;
  }

  async createRelationshipType(relationshipType: InsertRelationshipType): Promise<RelationshipType> {
    const { data, error } = await supabase
      .from('relationship_types')
      .insert(relationshipType)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateRelationshipType(id: number, relationshipTypeData: Partial<RelationshipType>): Promise<RelationshipType | undefined> {
    const { data } = await supabase
      .from('relationship_types')
      .update(relationshipTypeData)
      .eq('id', id)
      .select()
      .single();
    return data || undefined;
  }

  async deleteRelationshipType(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('relationship_types')
      .delete()
      .eq('id', id);
    return !error;
  }

  // Relationship operations
  async getRelationships(novelId: number): Promise<Relationship[]> {
    const { data } = await supabase
      .from('relationships')
      .select()
      .eq('novelId', novelId);
    return data || [];
  }

  async getRelationship(id: number): Promise<Relationship | undefined> {
    const { data } = await supabase
      .from('relationships')
      .select()
      .eq('id', id)
      .single();
    return data || undefined;
  }

  async createRelationship(relationship: InsertRelationship): Promise<Relationship> {
    const { data, error } = await supabase
      .from('relationships')
      .insert(relationship)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateRelationship(id: number, relationshipData: Partial<Relationship>): Promise<Relationship | undefined> {
    const { data } = await supabase
      .from('relationships')
      .update(relationshipData)
      .eq('id', id)
      .select()
      .single();
    return data || undefined;
  }

  async deleteRelationship(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('relationships')
      .delete()
      .eq('id', id);
    return !error;
  }
}