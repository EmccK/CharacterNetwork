// Service Worker 注册函数 - 现在由 Vite PWA 插件自动处理
export function registerServiceWorker() {
  // 清理可能存在的旧的 Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        // 检查是否有旧的 Service Worker 需要清理
        const registrations = await navigator.serviceWorker.getRegistrations();
        console.log('发现的 Service Worker 注册:', registrations.length);

        // 如果有多个注册，清理旧的
        if (registrations.length > 1) {
          for (let i = 0; i < registrations.length - 1; i++) {
            await registrations[i].unregister();
            console.log('清理了旧的 Service Worker');
          }
        }
      } catch (error) {
        console.error('Service Worker 清理失败:', error);
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
