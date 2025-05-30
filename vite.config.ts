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
    apply: 'serve',
    configureServer(server) {
      // 覆盖原有的错误插件
      server.middlewares.use((req, res, next) => {
        next();
      });
    },
  };
}

// 配置函数，接收环境变量
export default defineConfig(async ({ mode }) => {
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
      VitePWA({
        registerType: 'prompt',
        includeAssets: ['favicon.png', 'robots.txt', 'icons/*.png'],
        manifest: false, // 我们使用自定义的manifest.json
        strategies: 'generateSW',
        workbox: {
          cleanupOutdatedCaches: true,
          skipWaiting: true,
          clientsClaim: true,
          sourcemap: true,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,json}'],
          navigateFallbackDenylist: [/\/api\//], // API请求不应该回退
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1年
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1年
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'images-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 30 // 30天
                }
              }
            },
            {
              urlPattern: /\/api\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 // 24小时
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        }
      }),
      ...(process.env.NODE_ENV !== "production" &&
      process.env.REPL_ID !== undefined
        ? [
            await import("@replit/vite-plugin-cartographer").then((m) =>
              m.cartographer()
            ),
          ]
        : []),
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