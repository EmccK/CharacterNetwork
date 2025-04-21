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
  '/offline.html',
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

// 网络请求拦截，提供离线支持
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 如果找到缓存的响应，则返回缓存
        if (response) {
          return response;
        }
        
        // 否则发送网络请求
        return fetch(event.request)
          .then((response) => {
            // 检查是否收到有效响应
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // 克隆响应以便我们可以将其存入缓存并返回
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then((cache) => {
                // 添加响应到缓存
                cache.put(event.request, responseToCache);
              });
              
            return response;
          })
          .catch(() => {
            // 当网络失败时，尝试返回离线页面
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
            // 如果是图片请求，返回一个默认的图标
            if (event.request.destination === 'image') {
              return caches.match('/icons/icon-192x192.png');
            }
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
