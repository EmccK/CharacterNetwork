// 这个文件会被vite-plugin-pwa替换，
// 但我们在此提供一个基础实现，以防插件未能正确生成

// 缓存名称和版本
const CACHE_NAME = 'characternetwork-cache-v1';

// 需要缓存的资源列表
const urlsToCache = [
  '/',
  '/index.html',
  '/favicon.png',
  '/manifest.json',
  '/icons/icon-192x192.png'
];

// 安装service worker并缓存基本资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// 网络请求拦截，提供优先网络的策略
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 检查是否收到有效响应
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        
        // 检查URL是否有效（不是chrome-extension等不支持的协议）
        const url = new URL(event.request.url);
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
          return response;
        }
        
        // 克隆响应以便我们可以将其存入缓存并返回
        const responseToCache = response.clone();
        
        caches.open(CACHE_NAME)
          .then((cache) => {
            try {
              // 添加响应到缓存
              cache.put(event.request, responseToCache);
            } catch (err) {
              console.warn('缓存存储失败:', err);
            }
          });
          
        return response;
      })
      .catch(() => {
        // 当网络失败时，尝试从缓存中获取
        return caches.match(event.request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // 如果缓存中也没有，则返回网络错误
            return new Response('网络错误', { 
              status: 408, 
              headers: { 'Content-Type': 'text/plain' } 
            });
          });
      })
  );
});

// 激活时清理旧缓存
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
