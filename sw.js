// Упрощенный Service Worker для надежного офлайн-режима
const CACHE_NAME = 'work-timesheet-hybrid-v1';
const urlsToCache = [
  './index.html',
  './manifest.json'
];

// Установка - кешируем только основные файлы
self.addEventListener('install', function(event) {
  console.log('🔄 Устанавливаем упрощенный Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('✅ Основные файлы закешированы');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Активация - очищаем старые кеши
self.addEventListener('activate', function(event) {
  console.log('🔄 Активируем Service Worker...');
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

// Обработка запросов - простая стратегия "сеть, потом кеш"
self.addEventListener('fetch', function(event) {
  // Пропускаем внешние ресурсы (CDN)
  if (event.request.url.includes('cdnjs.cloudflare.com')) {
    return fetch(event.request);
  }
  
  // Пропускаем данные
  if (event.request.url.includes('data:') || event.request.url.includes('blob:')) {
    return fetch(event.request);
  }

  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        // Если успешно загрузили из сети - кешируем
        if (response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(function(cache) {
              cache.put(event.request, responseToCache);
            });
        }
        return response;
      })
      .catch(function() {
        // Если нет сети - пробуем из кеша
        return caches.match(event.request)
          .then(function(response) {
            if (response) {
              return response;
            }
            // Fallback для HTML-страниц
            if (event.request.destination === 'document') {
              return caches.match('./index.html');
            }
            return new Response('Офлайн режим', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});
