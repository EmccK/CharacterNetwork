import { createPersistStore } from './index';

/**
 * 应用级状态类型定义
 */
interface AppState {
  // 应用初始化状态
  initialized: boolean;
  
  // 当前活动的模块/页面
  activeModule: string;
  
  // 当前选中的小说ID
  currentNovelId: number | null;
  
  // 应用通知
  notifications: Notification[];
  
  // 应用国际化设置
  locale: 'zh-CN' | 'en-US';
  
  // 版本和上次更新信息
  version: string;
  lastUpdateCheck: string | null;
  
  // 功能标志
  featureFlags: Record<string, boolean>;
  
  // Actions
  setInitialized: (initialized: boolean) => void;
  setActiveModule: (module: string) => void;
  setCurrentNovelId: (novelId: number | null) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  setLocale: (locale: 'zh-CN' | 'en-US') => void;
  setFeatureFlag: (flag: string, enabled: boolean) => void;
}

/**
 * 通知类型定义
 */
interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  createdAt: string;
  autoClose?: boolean; // 是否自动关闭
  duration?: number; // 自动关闭时间(ms)
}

/**
 * 应用级状态store
 */
export const useAppStore = createPersistStore<AppState>(
  'app',
  {
    // 初始状态
    initialized: false,
    activeModule: 'home',
    currentNovelId: null,
    notifications: [],
    locale: 'zh-CN',
    version: '1.0.0',
    lastUpdateCheck: null,
    featureFlags: {
      enableDarkMode: true,
      enableAutoSave: true,
      enableOfflineMode: true,
      enableDebugTools: false,
    },
    
    // Actions
    setInitialized: (initialized) => useAppStore.setState({ initialized }),
    
    setActiveModule: (module) => useAppStore.setState({ activeModule: module }),
    
    setCurrentNovelId: (novelId) => useAppStore.setState({ currentNovelId: novelId }),
    
    addNotification: (notification) => useAppStore.setState((state) => ({
      notifications: [
        ...state.notifications,
        {
          ...notification,
          id: `notification-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          createdAt: new Date().toISOString(),
        }
      ]
    })),
    
    removeNotification: (id) => useAppStore.setState((state) => ({
      notifications: state.notifications.filter(n => n.id !== id)
    })),
    
    clearNotifications: () => useAppStore.setState({ notifications: [] }),
    
    setLocale: (locale) => useAppStore.setState({ locale }),
    
    setFeatureFlag: (flag, enabled) => useAppStore.setState((state) => ({
      featureFlags: {
        ...state.featureFlags,
        [flag]: enabled
      }
    }))
  },
  {
    // 仅持久化部分状态
    partialize: (state) => ({
      locale: state.locale,
      featureFlags: state.featureFlags,
      version: state.version,
      lastUpdateCheck: state.lastUpdateCheck,
      currentNovelId: state.currentNovelId,
    })
  }
);
