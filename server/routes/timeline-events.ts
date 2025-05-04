import express from 'express';
import { isAuthenticated } from '../middleware/authMiddleware';
import {
  getNovelTimelineEvents,
  createTimelineEvent,
  getTimelineEvent,
  updateTimelineEvent,
  deleteTimelineEvent,
} from '../controllers/timelineController';

const router = express.Router();

// 获取小说的全部时间线事件
router.get('/novels/:novelId/timeline-events', isAuthenticated, getNovelTimelineEvents);

// 创建新的时间线事件
router.post('/novels/:novelId/timeline-events', isAuthenticated, createTimelineEvent);

// 获取特定的时间线事件
router.get('/timeline-events/:id', isAuthenticated, getTimelineEvent);

// 更新特定的时间线事件
router.put('/timeline-events/:id', isAuthenticated, updateTimelineEvent);

// 删除特定的时间线事件
router.delete('/timeline-events/:id', isAuthenticated, deleteTimelineEvent);

export default router;
