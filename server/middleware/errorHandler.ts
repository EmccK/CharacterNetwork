import { Request, Response, NextFunction } from 'express';

/**
 * 基础API错误类
 */
export class ApiError extends Error {
  statusCode: number;
  details?: any;
  errorCode?: string;

  constructor(message: string, statusCode: number, details?: any, errorCode?: string) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.details = details;
    this.errorCode = errorCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 400 Bad Request 错误
 * 用于客户端提供的请求数据无效或格式错误
 */
export class BadRequestError extends ApiError {
  constructor(message: string = '请求数据无效', details?: any) {
    super(message, 400, details, 'BAD_REQUEST');
  }
}

/**
 * 401 Unauthorized 错误
 * 用于认证失败或未提供认证信息
 */
export class UnauthorizedError extends ApiError {
  constructor(message: string = '请先登录', details?: any) {
    super(message, 401, details, 'UNAUTHORIZED');
  }
}

/**
 * 403 Forbidden 错误
 * 用于用户无权限访问资源
 */
export class ForbiddenError extends ApiError {
  constructor(message: string = '您没有权限执行此操作', details?: any) {
    super(message, 403, details, 'FORBIDDEN');
  }
}

/**
 * 404 Not Found 错误
 * 用于请求的资源不存在
 */
export class NotFoundError extends ApiError {
  constructor(message: string = '请求的资源不存在', details?: any) {
    super(message, 404, details, 'NOT_FOUND');
  }
}

/**
 * 409 Conflict 错误
 * 用于数据冲突，如唯一约束违反
 */
export class ConflictError extends ApiError {
  constructor(message: string = '数据冲突', details?: any) {
    super(message, 409, details, 'CONFLICT');
  }
}

/**
 * 422 Unprocessable Entity 错误
 * 用于验证失败
 */
export class ValidationError extends ApiError {
  constructor(message: string = '数据验证失败', details?: any) {
    super(message, 422, details, 'VALIDATION_ERROR');
  }
}

/**
 * 500 Internal Server Error 错误
 * 用于服务器内部错误
 */
export class InternalServerError extends ApiError {
  constructor(message: string = '服务器内部错误', details?: any) {
    super(message, 500, details, 'INTERNAL_SERVER_ERROR');
  }
}

/**
 * 数据库错误处理函数
 * 将数据库特定错误转换为API错误
 */
function handleDatabaseError(err: any): ApiError {
  if (!err.code) {
    return new InternalServerError('数据库操作失败', err.message);
  }

  // PostgreSQL 特定错误码处理
  switch (err.code) {
    case '23505': // 唯一约束违反
      return new ConflictError('数据已存在，无法创建重复数据', err.detail);
    case '23503': // 外键约束违反
      return new BadRequestError('引用的记录不存在，无法创建关联', err.detail);
    case '23502': // 非空约束违反
      return new BadRequestError('必填字段不能为空', err.detail);
    case '22P02': // 无效的文本表示
      return new BadRequestError('无效的数据格式', err.detail);
    default:
      if (err.code.startsWith('23')) { // 其他完整性约束违反
        return new BadRequestError('数据违反数据库约束，请检查输入', err.detail);
      }
      return new InternalServerError('数据库操作失败', err.detail);
  }
}

/**
 * 错误日志记录函数
 * 将错误记录到控制台或日志系统
 */
export function logError(err: any, req: Request) {
  const errorInfo = {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id || 'unauthenticated',
    timestamp: new Date().toISOString(),
    errorName: err.name,
    errorMessage: err.message,
    errorCode: err.errorCode || 'UNKNOWN',
    errorStack: err.stack,
    requestBody: req.body,
    requestParams: req.params,
    requestQuery: req.query
  };

  // 在生产环境中，这里可以将错误发送到专门的日志服务
  if (process.env.NODE_ENV === 'production') {
    // 可以使用外部日志服务，如 Sentry, LogRocket 等
    console.error('[错误]', JSON.stringify(errorInfo));
  } else {
    // 开发环境下打印详细信息
    console.error('[错误详情]', errorInfo);
    console.error('[错误堆栈]', err.stack);
  }
}

/**
 * 全局错误处理中间件
 * 捕获应用中未处理的错误，记录它们并返回适当的响应
 */
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  // 记录错误
  logError(err, req);
  
  // 检查是否为已知API错误类型
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errorCode: err.errorCode,
      details: err.details,
      // 仅在非生产环境返回堆栈信息
      stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
    });
  }
  
  // 处理数据库错误
  if (err.code) {
    const dbError = handleDatabaseError(err);
    return res.status(dbError.statusCode).json({
      success: false,
      message: dbError.message,
      errorCode: dbError.errorCode,
      details: dbError.details,
      stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
    });
  }
  
  // 处理未知错误
  return res.status(500).json({
    success: false,
    message: '服务器处理请求时发生错误',
    errorCode: 'INTERNAL_SERVER_ERROR',
    details: process.env.NODE_ENV !== 'production' ? err.message : undefined,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
  });
}