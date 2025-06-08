import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";
import { loadEnv } from "vite";

// 自定义插件，覆盖默认的runtimeErrorOverlay插件
function customRuntimeErrorOverlay() {
  return {
    name: 'custom-runtime-error-overlay',
    apply: 'serve' as const,
    configureServer(server: any) {
      // 覆盖原有的错误插件
      server.middlewares.use((req: any, res: any, next: any) => {
        next();
      });
    },
  };
}

// 配置函数，接收环境变量
export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '');

  // 创建环境变量替换对象
  const envReplacements = {
    'process.env.NODE_ENV': JSON.stringify(mode),
    '%VITE_SUPABASE_URL%': JSON.stringify(env.SUPABASE_URL || ''),
    '%VITE_SUPABASE_ANON_KEY%': JSON.stringify(env.SUPABASE_ANON_KEY || '')
  };

  return {
    server: {
      hmr: {
        host: 'localhost',
        port: 5001,
        overlay: false // 禁用错误覆盖层
      }
    },
    plugins: [
      react(),
      customRuntimeErrorOverlay(),
      themePlugin(),
      // 注释掉异步插件加载，因为在同步配置中无法使用
      // ...(process.env.NODE_ENV !== "production" &&
      // process.env.REPL_ID !== undefined
      //   ? [
      //       await import("@replit/vite-plugin-cartographer").then((m) =>
      //         m.cartographer()
      //       ),
      //     ]
      //   : []),
    ],
    resolve: {
      alias: {
        "@": path.resolve("./client/src"),
        "@shared": path.resolve("./shared"),
      },
    },
    root: path.resolve("./client"),
    build: {
      outDir: path.resolve("./dist/public"),
      emptyOutDir: true,
    },
  };
});