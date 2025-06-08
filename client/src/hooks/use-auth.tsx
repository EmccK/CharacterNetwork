import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser, LoginData } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<boolean, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
};

export const AuthContext = createContext<AuthContextType | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | null>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      try {
        // 使用修改后的apiRequest函数，更好地处理各种响应类型
        return await apiRequest<SelectUser>("POST", "/api/login", credentials);
      } catch (error) {
        console.error("登录请求出错:", error);
        throw error;
      }
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "登录成功",
        description: `欢迎回来， ${user.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "登录失败",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      try {
        // 使用修改后的apiRequest函数，更好地处理各种响应类型
        return await apiRequest<SelectUser>("POST", "/api/register", credentials);
      } catch (error) {
        console.error("注册请求出错:", error);
        throw error;
      }
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "注册成功",
        description: `欢迎，${user.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "注册失败",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        // 使用增强的apiRequest函数处理各种响应情况
        await apiRequest("POST", "/api/logout");
        return true;
      } catch (error) {
        console.error("登出请求出错:", error);
        // 即使请求失败，我们也尝试清除本地状态
        // 这确保用户在前端看来已经登出，即使后端请求失败
        queryClient.setQueryData(["/api/user"], null);
        throw error;
      }
    },
    onSuccess: () => {
      // 确保清除用户数据
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "已登出",
        description: "您已成功登出系统",
      });
    },
    onError: (error: Error) => {
      // 尽管显示错误，但我们已经在mutationFn中尝试了清除用户状态
      toast({
        title: "登出过程中发生错误",
        description: "您已在本地登出，但服务器可能未完全处理您的请求",
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
