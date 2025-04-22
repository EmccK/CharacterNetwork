// Service Worker 注册函数
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        // 尝试先注销已有的Service Worker
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
        
        // 重新注册
        const registration = await navigator.serviceWorker.register('/sw.js', { 
          scope: '/',
          updateViaCache: 'none' // 禁用缓存，确保每次都获取最新的service worker
        });
        
        console.log('Service Worker 注册成功，范围:', registration.scope);
        
        // 强制更新
        registration.update();
      } catch (error) {
        console.error('Service Worker 注册失败:', error);
      }
    });
  }
}

// 检查PWA是否可安装
export function checkPWAInstallable() {
  let deferredPrompt: any;
  const installButton = document.getElementById('pwa-install-button');

  // 监听beforeinstallprompt事件
  window.addEventListener('beforeinstallprompt', (e) => {
    // 阻止Chrome 67及更高版本自动显示安装提示
    e.preventDefault();
    // 保存事件，以便稍后触发
    deferredPrompt = e;
    
    // 如果有安装按钮，则显示它
    if (installButton) {
      installButton.style.display = 'block';

      installButton.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        
        // 显示安装提示
        deferredPrompt.prompt();
        
        // 等待用户响应
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`用户操作: ${outcome}`);
        
        // 无论如何都清除保存的提示，因为它只能使用一次
        deferredPrompt = null;
        
        // 隐藏安装按钮
        installButton.style.display = 'none';
      });
    }
  });

  // 监听appinstalled事件
  window.addEventListener('appinstalled', (e) => {
    console.log('PWA已成功安装');
    // 隐藏安装按钮
    if (installButton) {
      installButton.style.display = 'none';
    }
  });
}

// 处理离线状态
export function handleOfflineStatus() {
  const updateOnlineStatus = () => {
    const offlineBanner = document.getElementById('offline-banner');
    if (offlineBanner) {
      if (navigator.onLine) {
        offlineBanner.style.display = 'none';
      } else {
        offlineBanner.style.display = 'block';
      }
    }
  };

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  
  // 初始化状态
  window.addEventListener('DOMContentLoaded', updateOnlineStatus);
}
