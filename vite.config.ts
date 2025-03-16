import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

// 自定义插件，覆盖默认的runtimeErrorOverlay插件
function customRuntimeErrorOverlay() {
  return {
    name: 'custom-runtime-error-overlay',
    apply: 'serve',
    configureServer(server) {
      // 覆盖原有的错误插件
      server.middlewares.use((req, res, next) => {
        next();
      });
    },
  };
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  server: {
    hmr: {
      overlay: false // 禁用错误覆盖层
    }
  },
  plugins: [
    react(),
    customRuntimeErrorOverlay(),
    themePlugin(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
});
