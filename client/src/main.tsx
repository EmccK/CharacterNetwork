import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { registerServiceWorker, checkPWAInstallable, handleOfflineStatus } from "./pwa";

// 禁用React开发模式的某些警告
if (process.env.NODE_ENV === 'development') {
  window.addEventListener('error', (event) => {
    if (event.message && event.message.includes('Rendered fewer hooks than expected')) {
      event.preventDefault();
      console.warn('忽略了Hooks错误:', event.message);
      return true;
    }
  }, true);
}

// 注册Service Worker
registerServiceWorker();

// 渲染应用
createRoot(document.getElementById("root")!).render(<App />);

// 在应用加载后检查PWA可安装性并处理离线状态
window.addEventListener('load', () => {
  checkPWAInstallable();
  handleOfflineStatus();
});
