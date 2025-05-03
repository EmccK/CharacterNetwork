import { createPersistStore } from './index';

/**
 * 用户类型定义
 */
interface User {
  id: number;
  username: string;
  email: string;
  avatar?: string;
  role: 'user' | 'admin';
}

/**
 * 认证状态类型定义
 */
interface AuthState {
  // 用户信息
  user: User | null;
  
  // 认证状态
  isAuthenticated: boolean;
  isAdmin: boolean;
  authError: string | null;
  
  // 令牌相关
  token: string | null;
  tokenExpiry: number | null;
  refreshToken: string | null;
  
  // 登录状态
  isLoading: boolean;
  
  // Auth Actions
  setUser: (user: User | null) => void;
  setAuth: (data: { 
    user: User | null; 
    token: string | null;
    tokenExpiry?: number | null;
    refreshToken?: string | null;
  }) => void;
  logout: () => void;
  setAuthError: (error: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  refreshAuth: () => Promise<boolean>;
}

/**
 * 认证状态store
 */
export const useAuthStore = createPersistStore<AuthState>(
  'auth',
  {
    // 初始状态
    user: null,
    isAuthenticated: false,
    isAdmin: false,
    authError: null,
    token: null,
    tokenExpiry: null,
    refreshToken: null,
    isLoading: false,
    
    // Actions
    setUser: (user) => useAuthStore.setState({
      user,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin'
    }),
    
    setAuth: ({ user, token, tokenExpiry = null, refreshToken = null }) => useAuthStore.setState({
      user,
      token,
      tokenExpiry,
      refreshToken,
      isAuthenticated: !!user && !!token,
      isAdmin: user?.role === 'admin',
      authError: null
    }),
    
    logout: () => useAuthStore.setState({
      user: null,
      token: null,
      tokenExpiry: null,
      refreshToken: null,
      isAuthenticated: false,
      isAdmin: false
    }),
    
    setAuthError: (error) => useAuthStore.setState({ authError: error }),
    
    setLoading: (isLoading) => useAuthStore.setState({ isLoading }),
    
    refreshAuth: async () => {
      const state = useAuthStore.getState();
      
      // 未登录或没有刷新令牌，无法刷新
      if (!state.refreshToken) {
        return false;
      }
      
      try {
        state.setLoading(true);
        
        // 调用刷新令牌API
        const response = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            refreshToken: state.refreshToken
          }),
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('令牌刷新失败');
        }
        
        const data = await response.json();
        
        // 更新认证状态
        state.setAuth({
          user: data.user,
          token: data.token,
          tokenExpiry: data.tokenExpiry ? new Date(data.tokenExpiry).getTime() : null,
          refreshToken: data.refreshToken || state.refreshToken
        });
        
        return true;
      } catch (error) {
        // 刷新失败，清除认证状态
        console.error('令牌刷新失败', error);
        state.logout();
        state.setAuthError('您的会话已过期，请重新登录');
        return false;
      } finally {
        state.setLoading(false);
      }
    }
  },
  {
    // 版本，当结构变化时递增
    version: 1,
    
    // 仅持久化部分状态
    partialize: (state) => ({
      token: state.token,
      refreshToken: state.refreshToken,
      tokenExpiry: state.tokenExpiry,
      // 用户信息也持久化，但不包含敏感信息
      user: state.user ? {
        id: state.user.id,
        username: state.user.username,
        email: state.user.email,
        avatar: state.user.avatar,
        role: state.user.role
      } : null
    })
  }
);

/**
 * 检查令牌是否过期或即将过期
 * @returns boolean 如果令牌已过期或在5分钟内过期则返回true
 */
export function isTokenExpired(): boolean {
  const { tokenExpiry } = useAuthStore.getState();
  
  if (!tokenExpiry) {
    return true;
  }
  
  // 如果令牌已经过期，或者在5分钟内将过期
  const EXPIRY_MARGIN = 5 * 60 * 1000; // 5分钟
  return Date.now() + EXPIRY_MARGIN >= tokenExpiry;
}

/**
 * 获取认证头信息
 * @returns Record<string, string> 包含Authorization头的对象
 */
export function getAuthHeaders(): Record<string, string> {
  const { token } = useAuthStore.getState();
  
  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
}
