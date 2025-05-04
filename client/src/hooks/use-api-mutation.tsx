import { useState, useCallback } from 'react';
import { useToast } from './use-toast';

export interface MutationOptions<TData, TError, TVariables> {
  onSuccess?: (data: TData, variables: TVariables) => void | Promise<void>;
  onError?: (error: TError, variables: TVariables) => void | Promise<void>;
  onSettled?: (data: TData | null, error: TError | null, variables: TVariables) => void | Promise<void>;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string;
  errorMessage?: string;
}

export interface MutationState<TData, TError> {
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  data: TData | null;
  error: TError | null;
}

export interface UseMutationReturn<TData, TError, TVariables> {
  mutate: (variables: TVariables) => Promise<TData | null>;
  reset: () => void;
  state: MutationState<TData, TError>;
}

/**
 * 自定义API操作Hook
 * 用于处理数据修改操作（POST, PUT, DELETE等）
 */
function useApiMutation<TData = any, TError = Error, TVariables = any>(
  url: string,
  method: 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'POST',
  options: MutationOptions<TData, TError, TVariables> = {}
): UseMutationReturn<TData, TError, TVariables> {
  // 状态管理
  const [state, setState] = useState<MutationState<TData, TError>>({
    isLoading: false,
    isError: false,
    isSuccess: false,
    data: null,
    error: null,
  });
  
  const toast = useToast();

  // 执行修改操作
  const mutate = useCallback(async (variables: TVariables): Promise<TData | null> => {
    setState({
      isLoading: true,
      isError: false,
      isSuccess: false,
      data: null,
      error: null,
    });
    
    try {
    console.log(`[API请求] ${method} ${url}`);
    
    // 构建请求配置
    const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      },
      credentials: 'include', // 包含cookie
    };
    
    // 对于有请求体的方法，添加请求体
    if (method !== 'GET' && method !== 'DELETE') {
    // 检查variables是否为FormData类型
    if (variables instanceof FormData) {
    // 如果是FormData，直接使用，并删除Content-Type头（让浏览器自动设置）
      config.body = variables;
    delete config.headers['Content-Type'];
    console.log(`[API请求] 使用FormData发送数据`);
      
        // 输出 FormData 的内容（仅用于调试）
            const formDataEntries = [];
            variables.forEach((value, key) => {
              if (value instanceof File) {
                formDataEntries.push(`${key}: File(${value.name}, ${value.type}, ${value.size} bytes)`);
              } else {
                formDataEntries.push(`${key}: ${value}`);
              }
            });
            console.log(`[API请求] FormData内容:`, formDataEntries);
          } else {
            // 否则按JSON处理
            config.body = JSON.stringify(variables);
            console.log(`[API请求] 使用JSON发送数据:`, variables);
          }
        } else if (method === 'DELETE') {
          console.log(`[API请求] DELETE 请求至: ${url}`);
        }
      
      // 发送请求
      const response = await fetch(url, config);
      
      // 处理非2xx响应
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          status: response.status,
          statusText: response.statusText,
          data: errorData,
          message: errorData.message || `请求失败: ${response.status} ${response.statusText}`,
        };
      }
      
      // 解析响应数据
      let data: TData;
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else if (response.status === 204) {
        // 无内容响应
        data = {} as TData;
      } else {
        // 尝试解析JSON，如果失败则返回文本
        data = await response.json().catch(async () => await response.text()) as TData;
      }
      
      // 更新状态
      setState({
        isLoading: false,
        isError: false,
        isSuccess: true,
        data,
        error: null,
      });
      
      // 调用成功回调
      if (options.onSuccess) {
        await options.onSuccess(data, variables);
      }
      
      // 显示成功提示
      if (options.showSuccessToast) {
        toast.success(options.successMessage || '操作成功');
      }
      
      // 调用完成回调
      if (options.onSettled) {
        await options.onSettled(data, null, variables);
      }
      
      return data;
    } catch (error) {
      // 转换为TError类型
      const typedError = error as TError;
      
      // 更新状态
      setState({
        isLoading: false,
        isError: true,
        isSuccess: false,
        data: null,
        error: typedError,
      });
      
      // 调用错误回调
      if (options.onError) {
        await options.onError(typedError, variables);
      }
      
      // 显示错误提示
      if (options.showErrorToast) {
        const errorMessage = options.errorMessage || 
          (typedError as any).message || 
          '操作失败，请稍后重试';
        toast.error(errorMessage);
      }
      
      // 调用完成回调
      if (options.onSettled) {
        await options.onSettled(null, typedError, variables);
      }
      
      return null;
    }
  }, [url, method, options, toast]);

  // 重置状态
  const reset = useCallback(() => {
    setState({
      isLoading: false,
      isError: false,
      isSuccess: false,
      data: null,
      error: null,
    });
  }, []);

  return {
    mutate,
    reset,
    state,
  };
}

export default useApiMutation;