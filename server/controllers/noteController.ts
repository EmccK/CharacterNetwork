import { Request, Response } from "express";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { notes, InsertNote } from "@shared/schema";
import { validateRequest } from "../utils/validation";
import { z } from "zod";

// 获取小说的所有笔记
export const getNovelNotes = async (req: Request, res: Response) => {
  try {
    const novelId = parseInt(req.params.novelId);
    
    if (isNaN(novelId)) {
      return res.status(400).json({ message: "无效的小说ID" });
    }
    
    const novelNotes = await db.select().from(notes)
      .where(eq(notes.novelId, novelId))
      .orderBy(notes.createdAt);
      
    return res.status(200).json(novelNotes);
  } catch (error) {
    console.error("获取笔记失败:", error);
    return res.status(500).json({ message: "获取笔记失败" });
  }
};

// 获取单个笔记
export const getNoteById = async (req: Request, res: Response) => {
  try {
    const noteId = parseInt(req.params.id);
    
    if (isNaN(noteId)) {
      return res.status(400).json({ message: "无效的笔记ID" });
    }
    
    const note = await db.select().from(notes)
      .where(eq(notes.id, noteId))
      .limit(1);
      
    if (!note || note.length === 0) {
      return res.status(404).json({ message: "笔记未找到" });
    }
    
    return res.status(200).json(note[0]);
  } catch (error) {
    console.error("获取笔记失败:", error);
    return res.status(500).json({ message: "获取笔记失败" });
  }
};

// 创建笔记
export const createNote = async (req: Request, res: Response) => {
  const noteSchema = z.object({
    title: z.string().min(1, "标题不能为空"),
    content: z.string().optional(),
    novelId: z.number().int().positive("小说ID必须是正整数"),
    characterIds: z.array(z.number().int()).optional(),
    labels: z.array(z.string()).optional(),
  });
  
  try {
    const validation = await validateRequest(req.body, noteSchema);
    
    if (!validation.success) {
      return res.status(400).json({ message: validation.error });
    }
    
    const noteData: InsertNote = validation.data;
    
    const newNote = await db.insert(notes).values(noteData).returning();
    
    return res.status(201).json(newNote[0]);
  } catch (error) {
    console.error("创建笔记失败:", error);
    return res.status(500).json({ message: "创建笔记失败" });
  }
};

// 更新笔记
export const updateNote = async (req: Request, res: Response) => {
  const noteSchema = z.object({
    title: z.string().min(1, "标题不能为空").optional(),
    content: z.string().optional(),
    characterIds: z.array(z.number().int()).optional(),
    labels: z.array(z.string()).optional(),
  });
  
  try {
    const noteId = parseInt(req.params.id);
    
    if (isNaN(noteId)) {
      return res.status(400).json({ message: "无效的笔记ID" });
    }
    
    const validation = await validateRequest(req.body, noteSchema);
    
    if (!validation.success) {
      return res.status(400).json({ message: validation.error });
    }
    
    // 检查笔记是否存在
    const existingNote = await db.select().from(notes)
      .where(eq(notes.id, noteId))
      .limit(1);
      
    if (!existingNote || existingNote.length === 0) {
      return res.status(404).json({ message: "笔记未找到" });
    }
    
    const updateData = validation.data;
    
    const updatedNote = await db.update(notes)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(notes.id, noteId))
      .returning();
      
    return res.status(200).json(updatedNote[0]);
  } catch (error) {
    console.error("更新笔记失败:", error);
    return res.status(500).json({ message: "更新笔记失败" });
  }
};

// 删除笔记
export const deleteNote = async (req: Request, res: Response) => {
  try {
    const noteId = parseInt(req.params.id);
    
    if (isNaN(noteId)) {
      return res.status(400).json({ message: "无效的笔记ID" });
    }
    
    // 检查笔记是否存在
    const existingNote = await db.select().from(notes)
      .where(eq(notes.id, noteId))
      .limit(1);
      
    if (!existingNote || existingNote.length === 0) {
      return res.status(404).json({ message: "笔记未找到" });
    }
    
    await db.delete(notes)
      .where(eq(notes.id, noteId));
      
    return res.status(200).json({ message: "笔记已成功删除" });
  } catch (error) {
    console.error("删除笔记失败:", error);
    return res.status(500).json({ message: "删除笔记失败" });
  }
}; 