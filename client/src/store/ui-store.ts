import { createPersistStore } from './index';

/**
 * 主题类型
 */
type Theme = 'light' | 'dark' | 'system';

/**
 * UI状态类型定义
 */
interface UIState {
  // 主题相关
  theme: Theme;
  accentColor: string;
  
  // 侧边栏相关
  sidebarOpen: boolean;
  sidebarWidth: number;
  
  // 布局相关
  contentWidth: 'full' | 'container' | 'fluid';
  navbarFixed: boolean;
  
  // 可访问性设置
  fontSize: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  reduceMotion: boolean;
  highContrast: boolean;
  
  // 对话框和弹出层
  activeDialog: string | null;
  dialogHistory: string[];
  
  // UI Actions
  setTheme: (theme: Theme) => void;
  setAccentColor: (color: string) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarWidth: (width: number) => void;
  setContentWidth: (width: 'full' | 'container' | 'fluid') => void;
  setNavbarFixed: (fixed: boolean) => void;
  setFontSize: (size: 'xs' | 'sm' | 'md' | 'lg' | 'xl') => void;
  setReduceMotion: (reduce: boolean) => void;
  setHighContrast: (enabled: boolean) => void;
  showDialog: (dialogId: string) => void;
  closeDialog: () => void;
  resetUI: () => void;
}

// 默认UI设置
const defaultUISettings = {
  theme: 'system' as Theme,
  accentColor: '#2563eb', // 蓝色
  sidebarOpen: true,
  sidebarWidth: 280,
  contentWidth: 'container' as const,
  navbarFixed: true,
  fontSize: 'md' as const,
  reduceMotion: false,
  highContrast: false,
  activeDialog: null,
  dialogHistory: [],
};

/**
 * UI状态store
 */
export const useUIStore = createPersistStore<UIState>(
  'ui',
  {
    ...defaultUISettings,
    
    // UI Actions
    setTheme: (theme) => useUIStore.setState({ theme }),
    
    setAccentColor: (color) => useUIStore.setState({ accentColor: color }),
    
    toggleSidebar: () => useUIStore.setState((state) => ({ 
      sidebarOpen: !state.sidebarOpen 
    })),
    
    setSidebarOpen: (open) => useUIStore.setState({ sidebarOpen: open }),
    
    setSidebarWidth: (width) => useUIStore.setState({ sidebarWidth: width }),
    
    setContentWidth: (width) => useUIStore.setState({ contentWidth: width }),
    
    setNavbarFixed: (fixed) => useUIStore.setState({ navbarFixed: fixed }),
    
    setFontSize: (size) => useUIStore.setState({ fontSize: size }),
    
    setReduceMotion: (reduce) => useUIStore.setState({ reduceMotion: reduce }),
    
    setHighContrast: (enabled) => useUIStore.setState({ highContrast: enabled }),
    
    showDialog: (dialogId) => useUIStore.setState((state) => ({ 
      activeDialog: dialogId, 
      dialogHistory: [...state.dialogHistory, dialogId]
    })),
    
    closeDialog: () => useUIStore.setState((state) => {
      const history = [...state.dialogHistory];
      history.pop(); // 移除最近的对话框
      return {
        activeDialog: history.length > 0 ? history[history.length - 1] : null,
        dialogHistory: history
      };
    }),
    
    resetUI: () => useUIStore.setState(defaultUISettings)
  },
  {
    // 版本，当结构变化时递增
    version: 1,
    
    // 仅持久化部分状态
    partialize: (state) => ({
      theme: state.theme,
      accentColor: state.accentColor,
      sidebarWidth: state.sidebarWidth,
      contentWidth: state.contentWidth,
      navbarFixed: state.navbarFixed,
      fontSize: state.fontSize,
      reduceMotion: state.reduceMotion,
      highContrast: state.highContrast,
    })
  }
);

/**
 * 在应用启动时应用UI设置（主题等）
 */
export function applyInitialUISettings() {
  const state = useUIStore.getState();
  
  // 应用主题
  if (state.theme === 'dark' || 
      (state.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  
  // 应用字体大小
  document.documentElement.dataset.fontSize = state.fontSize;
  
  // 应用减少动画设置
  if (state.reduceMotion) {
    document.documentElement.classList.add('reduce-motion');
  } else {
    document.documentElement.classList.remove('reduce-motion');
  }
  
  // 应用高对比度设置
  if (state.highContrast) {
    document.documentElement.classList.add('high-contrast');
  } else {
    document.documentElement.classList.remove('high-contrast');
  }
  
  // 应用强调色
  document.documentElement.style.setProperty('--accent-color', state.accentColor);
}
