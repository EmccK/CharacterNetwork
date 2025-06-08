import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { ApiResponse, ApiError } from "@shared/api-types";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest<TResponse, TData = unknown>(
  method: string,
  url: string,
  data?: TData | undefined,
): Promise<TResponse> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);

  // 处理204 No Content响应或空响应
  if (res.status === 204 || res.headers.get("content-length") === "0") {
    console.log(`[apiRequest] 收到空响应，返回空对象`);
    return {} as TResponse;
  }

  // 检查内容类型是否为JSON
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return await res.json();
  } else {
    // 非JSON响应，将文本内容包装为对象返回
    const text = await res.text();
    console.log(`[apiRequest] 收到非JSON响应: ${text}`);
    return { message: text } as TResponse;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn = <TResponse>(options: {
  on401: UnauthorizedBehavior;
}): QueryFunction<TResponse> =>
  async ({ queryKey }) => {
    const { on401: unauthorizedBehavior } = options;
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null as unknown as TResponse;
    }

    await throwIfResNotOk(res);

    // 处理204 No Content响应或空响应
    if (res.status === 204 || res.headers.get("content-length") === "0") {
      console.log(`[getQueryFn] 收到空响应，返回空对象`);
      return {} as TResponse;
    }

    // 检查内容类型是否为JSON
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await res.json();
    } else {
      // 非JSON响应，将文本内容包装为对象返回
      const text = await res.text();
      console.log(`[getQueryFn] 收到非JSON响应: ${text}`);
      return { message: text } as TResponse;
    }
  };

// 通用请求辅助函数
export const getRequest = <TResponse>(url: string) => {
  return apiRequest<TResponse, void>("GET", url);
};

export const postRequest = <TResponse, TData = unknown>(url: string, data: TData) => {
  return apiRequest<TResponse, TData>("POST", url, data);
};

export const putRequest = <TResponse, TData = unknown>(url: string, data: TData) => {
  return apiRequest<TResponse, TData>("PUT", url, data);
};

export const deleteRequest = <TResponse>(url: string) => {
  return apiRequest<TResponse, void>("DELETE", url);
};

export const patchRequest = <TResponse, TData = unknown>(url: string, data: TData) => {
  return apiRequest<TResponse, TData>("PATCH", url, data);
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5分钟
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
