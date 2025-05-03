/**
 * 全局状态管理策略
 * 
 * 本项目采用混合状态管理策略：
 * 
 * 1. 服务器状态：使用React Query
 *    - 用于数据获取、缓存、同步和更新
 *    - 处理服务器数据的加载状态、错误处理和重试逻辑
 *    - 提供乐观更新和自动重新验证
 *    - 适用于：小说列表、角色数据、关系数据等服务器数据
 * 
 * 2. 全局UI状态：使用Zustand
 *    - 轻量级状态管理库，API简洁
 *    - 支持中间件，可与Redux DevTools集成
 *    - 基于不可变更新，但API更简单
 *    - 适用于：主题设置、侧边栏状态、全局通知等应用级UI状态
 * 
 * 3. 表单状态：使用React Hook Form
 *    - 专门为表单设计，处理验证、错误和提交
 *    - 减少不必要的渲染，提高表单性能
 *    - 与Zod集成进行类型安全的验证
 *    - 适用于：创建/编辑表单、搜索过滤器、设置表单等
 * 
 * 4. 组件内部状态：使用useState/useReducer
 *    - 用于组件特定的局部状态
 *    - 当状态只在单个组件内使用时最合适
 *    - 适用于：展开/折叠状态、激活的选项卡、临时UI状态等
 * 
 * 5. 特定功能状态：使用专用store
 *    - 特定功能的状态管理，如图形可视化、复杂交互等
 *    - 基于Zustand实现，但专注于特定功能域
 *    - 适用于：图谱交互状态、复杂编辑器状态等
 */

// 重新导出各个store，方便统一导入
export * from './app-store';
export * from './ui-store';
export * from './auth-store';

// 导出通用的createStore辅助函数，用于创建新的Zustand store
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

/**
 * 创建持久化store的辅助函数
 * @param name store的名称
 * @param initialState 初始状态
 * @param config 额外配置选项
 */
export function createPersistStore<T>(
  name: string,
  initialState: T,
  config?: {
    version?: number;
    partialize?: (state: T) => Partial<T>;
  }
) {
  return create<T>()(
    devtools(
      persist(
        () => initialState,
        {
          name: `character-network-${name}`,
          version: config?.version || 1,
          partialize: config?.partialize
        }
      )
    )
  );
}

/**
 * 创建非持久化store的辅助函数
 * @param name store的名称
 * @param initialState 初始状态
 */
export function createStore<T>(name: string, initialState: T) {
  return create<T>()(
    devtools(
      () => initialState,
      { name: `character-network-${name}` }
    )
  );
}
