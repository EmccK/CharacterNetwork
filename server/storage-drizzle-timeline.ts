// 时间线事件相关方法扩展

import { eq } from 'drizzle-orm';
import { db } from './db';
import { timelineEvents, type TimelineEvent, type InsertTimelineEvent } from '@shared/schema';

// 获取小说的所有时间线事件
export async function getNovelTimelineEvents(novelId: number): Promise<TimelineEvent[]> {
  try {
    return await db.select().from(timelineEvents)
      .where(eq(timelineEvents.novelId, novelId))
      .orderBy(timelineEvents.date);
  } catch (error) {
    console.error(`[数据库操作] 获取小说时间线事件失败:`, error);
    return [];
  }
}

// 获取单个时间线事件
export async function getTimelineEvent(id: number): Promise<TimelineEvent | undefined> {
  try {
    const results = await db.select().from(timelineEvents)
      .where(eq(timelineEvents.id, id))
      .limit(1);
    return results.length > 0 ? results[0] : undefined;
  } catch (error) {
    console.error(`[数据库操作] 获取时间线事件失败:`, error);
    return undefined;
  }
}

// 创建新的时间线事件
export async function createTimelineEvent(event: InsertTimelineEvent): Promise<TimelineEvent> {
  try {
    const result = await db.insert(timelineEvents).values(event).returning();
    return result[0];
  } catch (error) {
    console.error(`[数据库操作] 创建时间线事件失败:`, error);
    throw error;
  }
}

// 更新时间线事件
export async function updateTimelineEvent(id: number, eventData: Partial<TimelineEvent>): Promise<TimelineEvent | undefined> {
  try {
    // 检查事件是否存在
    const existing = await getTimelineEvent(id);
    if (!existing) return undefined;
    
    const result = await db.update(timelineEvents)
      .set(eventData)
      .where(eq(timelineEvents.id, id))
      .returning();
    
    return result.length > 0 ? result[0] : undefined;
  } catch (error) {
    console.error(`[数据库操作] 更新时间线事件失败:`, error);
    return undefined;
  }
}

// 删除时间线事件
export async function deleteTimelineEvent(id: number): Promise<boolean> {
  try {
    // 检查事件是否存在
    const existing = await getTimelineEvent(id);
    if (!existing) return false;
    
    const result = await db.delete(timelineEvents)
      .where(eq(timelineEvents.id, id))
      .returning();
    
    return result.length > 0;
  } catch (error) {
    console.error(`[数据库操作] 删除时间线事件失败:`, error);
    return false;
  }
}
