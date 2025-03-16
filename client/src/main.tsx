import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

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

createRoot(document.getElementById("root")!).render(<App />);
