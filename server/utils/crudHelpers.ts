import { IStorage } from "../storage";
import { NotFoundError, ForbiddenError, BadRequestError, ValidationError, InternalServerError } from "../middleware/errorHandler";

/**
 * CRUD操作选项接口
 */
export interface CrudOptions {
  // 用于访问控制的选项
  ownerId?: number;              // 资源所有者ID（用于权限检查）
  currentUserId?: number;        // 当前用户ID
  isAdmin?: boolean;             // 当前用户是否为管理员
  checkOwnership?: boolean;      // 是否执行所有权检查
  ownershipField?: string;       // 所有权检查的字段名（默认为"userId"）
  
  // 查询相关选项
  select?: string[];             // 要选择的字段
  relations?: string[];          // 要加载的关联
  
  // 验证相关选项
  validateSchema?: any;          // Zod验证Schema
  transformData?: boolean;       // 是否对数据进行转换
  
  // 钩子函数
  beforeCreate?: (data: any) => Promise<any>; // 创建前钩子
  afterCreate?: (data: any) => Promise<any>;  // 创建后钩子
  beforeUpdate?: (data: any, id: number) => Promise<any>; // 更新前钩子
  afterUpdate?: (data: any) => Promise<any>;  // 更新后钩子
  beforeDelete?: (id: number) => Promise<void>; // 删除前钩子
  afterDelete?: (id: number) => Promise<void>;  // 删除后钩子
}

/**
 * 资源创建函数
 * @param storage 存储实例
 * @param storageMethod 存储方法名
 * @param data 要创建的数据
 * @param options 操作选项
 * @returns 创建的资源
 */
export async function createResource(
  storage: IStorage,
  storageMethod: string,
  data: any,
  options: CrudOptions = {}
): Promise<any> {
  try {
    let resourceData = { ...data };
    
    // 设置所有者ID（如果提供）
    if (options.currentUserId && !resourceData.userId) {
      resourceData.userId = options.currentUserId;
    }
    
    // 验证数据
    if (options.validateSchema) {
      const validationResult = options.validateSchema.safeParse(resourceData);
      if (!validationResult.success) {
        throw new ValidationError("数据验证失败", validationResult.error.format());
      }
      
      // 如果需要转换数据
      if (options.transformData) {
        resourceData = validationResult.data;
      }
    }
    
    // 执行创建前钩子
    if (options.beforeCreate) {
      resourceData = await options.beforeCreate(resourceData);
    }
    
    // 执行创建操作
    const createMethod = storage[storageMethod] as Function;
    if (!createMethod) {
      throw new Error(`存储方法 ${storageMethod} 不存在`);
    }
    
    const resource = await createMethod.call(storage, resourceData);
    
    // 执行创建后钩子
    if (options.afterCreate) {
      await options.afterCreate(resource);
    }
    
    return resource;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new InternalServerError("创建资源失败", error);
  }
}

/**
 * 获取单个资源函数
 * @param storage 存储实例
 * @param storageMethod 存储方法名
 * @param id 资源ID
 * @param options 操作选项
 * @returns 资源对象
 */
export async function getResource(
  storage: IStorage,
  storageMethod: string,
  id: number,
  options: CrudOptions = {}
): Promise<any> {
  try {
    // 执行获取操作
    const getMethod = storage[storageMethod] as Function;
    if (!getMethod) {
      throw new Error(`存储方法 ${storageMethod} 不存在`);
    }
    
    const resource = await getMethod.call(storage, id);
    
    if (!resource) {
      throw new NotFoundError("找不到指定资源");
    }
    
    // 检查所有权
    if (options.checkOwnership && options.currentUserId) {
      const ownerField = options.ownershipField || "userId";
      
      if (resource[ownerField] !== options.currentUserId && !options.isAdmin) {
        throw new ForbiddenError("您没有权限访问此资源");
      }
    }
    
    return resource;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new InternalServerError("获取资源失败", error);
  }
}

/**
 * 更新资源函数
 * @param storage 存储实例
 * @param storageMethod 存储方法名
 * @param id 资源ID
 * @param data 更新数据
 * @param options 操作选项
 * @returns 更新后的资源
 */
export async function updateResource(
  storage: IStorage,
  storageMethod: string,
  getMethod: string,
  id: number,
  data: any,
  options: CrudOptions = {}
): Promise<any> {
  try {
    // 先获取资源，检查是否存在以及权限
    const resource = await getResource(storage, getMethod, id, options);
    
    let updateData = { ...data };
    
    // 验证数据
    if (options.validateSchema) {
      const validationResult = options.validateSchema.partial().safeParse(updateData);
      if (!validationResult.success) {
        throw new ValidationError("数据验证失败", validationResult.error.format());
      }
      
      // 如果需要转换数据
      if (options.transformData) {
        updateData = validationResult.data;
      }
    }
    
    // 执行更新前钩子
    if (options.beforeUpdate) {
      updateData = await options.beforeUpdate(updateData, id);
    }
    
    // 执行更新操作
    const updateMethod = storage[storageMethod] as Function;
    if (!updateMethod) {
      throw new Error(`存储方法 ${storageMethod} 不存在`);
    }
    
    const updatedResource = await updateMethod.call(storage, id, updateData);
    
    if (!updatedResource) {
      throw new InternalServerError("更新资源失败");
    }
    
    // 执行更新后钩子
    if (options.afterUpdate) {
      await options.afterUpdate(updatedResource);
    }
    
    return updatedResource;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new InternalServerError("更新资源失败", error);
  }
}

/**
 * 删除资源函数
 * @param storage 存储实例
 * @param storageMethod 存储方法名
 * @param getMethod 获取资源的方法名
 * @param id 资源ID
 * @param options 操作选项
 * @returns 操作是否成功
 */
export async function deleteResource(
  storage: IStorage,
  storageMethod: string,
  getMethod: string,
  id: number,
  options: CrudOptions = {}
): Promise<boolean> {
  try {
    // 先获取资源，检查是否存在以及权限
    const resource = await getResource(storage, getMethod, id, options);
    
    // 执行删除前钩子
    if (options.beforeDelete) {
      await options.beforeDelete(id);
    }
    
    // 执行删除操作
    const deleteMethod = storage[storageMethod] as Function;
    if (!deleteMethod) {
      throw new Error(`存储方法 ${storageMethod} 不存在`);
    }
    
    const result = await deleteMethod.call(storage, id);
    
    if (!result) {
      throw new InternalServerError("删除资源失败");
    }
    
    // 执行删除后钩子
    if (options.afterDelete) {
      await options.afterDelete(id);
    }
    
    return true;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new InternalServerError("删除资源失败", error);
  }
}

/**
 * 列出资源函数
 * @param storage 存储实例
 * @param storageMethod 存储方法名
 * @param filters 过滤条件
 * @param options 操作选项
 * @returns 资源列表
 */
export async function listResources(
  storage: IStorage,
  storageMethod: string,
  filters?: any,
  options: CrudOptions = {}
): Promise<any[]> {
  try {
    // 执行列表查询操作
    const listMethod = storage[storageMethod] as Function;
    if (!listMethod) {
      throw new Error(`存储方法 ${storageMethod} 不存在`);
    }
    
    // 调用列表方法，根据是否提供了过滤条件决定如何调用
    const resources = filters 
      ? await listMethod.call(storage, filters) 
      : await listMethod.call(storage);
    
    // 如果启用了所有权检查，过滤掉当前用户无权访问的资源
    if (options.checkOwnership && options.currentUserId) {
      const ownerField = options.ownershipField || "userId";
      
      return resources.filter(resource => 
        resource[ownerField] === options.currentUserId || options.isAdmin
      );
    }
    
    return resources;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new InternalServerError("获取资源列表失败", error);
  }
}