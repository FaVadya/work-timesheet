// Упрощенный Service Worker для офлайн-работы
const CACHE_NAME = 'work-timesheet-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Установка Service Worker
self.addEventListener('install', function(event) {
  console.log('🚀 Устанавливаем Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('✅ Файлы закешированы для офлайн-работы');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Активация
self.addEventListener('activate', function(event) {
  console.log('🔧 Активируем Service Worker...');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cache) {
          if (cache !== CACHE_NAME) {
            console.log('🗑️ Удаляем старый кеш:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Обработка запросов
self.addEventListener('fetch', function(event) {
  // Для CDN ресурсов - всегда из сети
  if (event.request.url.includes('cdnjs.cloudflare.com')) {
    return fetch(event.request);
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Если есть в кеше - отдаем из кеша
        if (response) {
          return response;
        }
        
        // Если нет в кеше - загружаем из сети
        return fetch(event.request).then(function(response) {
          // Кешируем успешные ответы
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });
          }
          return response;
        }).catch(function() {
          // Fallback для офлайн режима
          if (event.request.destination === 'document') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
