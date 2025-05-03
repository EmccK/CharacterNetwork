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
  return await res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <TResponse>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<TResponse> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null as unknown as TResponse;
    }

    await throwIfResNotOk(res);
    return await res.json();
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
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
