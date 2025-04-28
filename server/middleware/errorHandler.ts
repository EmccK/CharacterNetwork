import { Request, Response, NextFunction } from 'express';

/**
 * 全局错误处理中间件
 * 捕获应用中未处理的错误，记录它们并返回适当的响应
 */
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  // 记录错误详情
  console.error(`[错误处理] 捕获到应用错误:`, {
    url: req.originalUrl,
    method: req.method,
    errorMessage: err.message,
    errorStack: err.stack,
    data: req.body
  });

  // 为数据库错误提供友好信息
  if (err.code && err.code.startsWith('23')) {
    // PostgreSQL 约束违反错误 (23xxx)
    switch(err.code) {
      case '23505': // 唯一约束违反
        return res.status(409).json({
          message: '数据已存在，无法创建重复数据'
        });
      case '23503': // 外键约束违反
        return res.status(400).json({
          message: '引用的记录不存在，无法创建关联'
        });
      default:
        return res.status(400).json({
          message: '数据违反数据库约束，请检查输入'
        });
    }
  }

  // 默认错误响应
  return res.status(500).json({
    message: '服务器处理请求时发生错误',
    details: process.env.NODE_ENV === 'production' ? undefined : err.message
  });
}