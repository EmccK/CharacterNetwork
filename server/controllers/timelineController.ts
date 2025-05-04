import { Request, Response } from 'express';
import { IStorage } from '../storage';
import { InsertTimelineEvent, timelineEvents } from '@shared/schema';
import { db } from '../db';
import { eq } from 'drizzle-orm';

export const getNovelTimelineEvents = async (req: Request, res: Response) => {
  try {
    const { novelId } = req.params;
    
    // 验证小说ID是有效数字
    const novelIdNumber = parseInt(novelId, 10);
    if (isNaN(novelIdNumber)) {
      return res.status(400).json({ error: '无效的小说ID' });
    }
    
    // 获取小说的所有时间线事件
    const events = await db.select().from(timelineEvents)
      .where(eq(timelineEvents.novelId, novelIdNumber))
      .orderBy(timelineEvents.date);
    
    return res.status(200).json(events);
  } catch (error) {
    console.error('获取小说时间线事件失败:', error);
    return res.status(500).json({ error: '服务器错误，无法获取时间线事件' });
  }
};

export const createTimelineEvent = async (req: Request, res: Response) => {
  try {
    const { novelId } = req.params;
    const { title, description, date, importance, characterIds } = req.body;
    
    // 验证小说ID是有效数字
    const novelIdNumber = parseInt(novelId, 10);
    if (isNaN(novelIdNumber)) {
      return res.status(400).json({ error: '无效的小说ID' });
    }
    
    // 确保必要字段存在
    if (!title || !date) {
      return res.status(400).json({ error: '标题和日期为必填项' });
    }
    
    // 创建时间线事件
    const eventData: InsertTimelineEvent = {
      title,
      description,
      date,
      importance: importance || 'normal',
      characterIds: characterIds || [],
      novelId: novelIdNumber,
    };
    
    const newEvent = await db.insert(timelineEvents).values(eventData).returning();
    
    return res.status(201).json(newEvent[0]);
  } catch (error) {
    console.error('创建时间线事件失败:', error);
    return res.status(500).json({ error: '服务器错误，无法创建时间线事件' });
  }
};

export const getTimelineEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // 验证事件ID是有效数字
    const eventId = parseInt(id, 10);
    if (isNaN(eventId)) {
      return res.status(400).json({ error: '无效的事件ID' });
    }
    
    // 获取特定的时间线事件
    const event = await db.select().from(timelineEvents)
      .where(eq(timelineEvents.id, eventId))
      .limit(1);
    
    if (event.length === 0) {
      return res.status(404).json({ error: '未找到指定的时间线事件' });
    }
    
    return res.status(200).json(event[0]);
  } catch (error) {
    console.error('获取时间线事件失败:', error);
    return res.status(500).json({ error: '服务器错误，无法获取时间线事件' });
  }
};

export const updateTimelineEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, date, importance, characterIds } = req.body;
    
    // 验证事件ID是有效数字
    const eventId = parseInt(id, 10);
    if (isNaN(eventId)) {
      return res.status(400).json({ error: '无效的事件ID' });
    }
    
    // 确保必要字段存在
    if (!title || !date) {
      return res.status(400).json({ error: '标题和日期为必填项' });
    }
    
    // 检查事件是否存在
    const existingEvent = await db.select().from(timelineEvents)
      .where(eq(timelineEvents.id, eventId))
      .limit(1);
    
    if (existingEvent.length === 0) {
      return res.status(404).json({ error: '未找到指定的时间线事件' });
    }
    
    // 更新时间线事件
    const updatedEvent = await db.update(timelineEvents)
      .set({
        title,
        description,
        date,
        importance,
        characterIds,
      })
      .where(eq(timelineEvents.id, eventId))
      .returning();
    
    return res.status(200).json(updatedEvent[0]);
  } catch (error) {
    console.error('更新时间线事件失败:', error);
    return res.status(500).json({ error: '服务器错误，无法更新时间线事件' });
  }
};

export const deleteTimelineEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // 验证事件ID是有效数字
    const eventId = parseInt(id, 10);
    if (isNaN(eventId)) {
      return res.status(400).json({ error: '无效的事件ID' });
    }
    
    // 检查事件是否存在
    const existingEvent = await db.select().from(timelineEvents)
      .where(eq(timelineEvents.id, eventId))
      .limit(1);
    
    if (existingEvent.length === 0) {
      return res.status(404).json({ error: '未找到指定的时间线事件' });
    }
    
    // 删除时间线事件
    await db.delete(timelineEvents)
      .where(eq(timelineEvents.id, eventId));
    
    return res.status(200).json({ message: '时间线事件已成功删除' });
  } catch (error) {
    console.error('删除时间线事件失败:', error);
    return res.status(500).json({ error: '服务器错误，无法删除时间线事件' });
  }
};
