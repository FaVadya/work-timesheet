// Service Worker для полного офлайн-режима
const CACHE_NAME = 'work-timesheet-offline-v2';
const urlsToCache = [
  '/work-timesheet/',
  '/work-timesheet/index.html',
  '/work-timesheet/manifest.json'
];

self.addEventListener('install', function(event) {
  console.log('🚀 Устанавливаем Service Worker для офлайн-работы');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('✅ Кешируем основные файлы');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', function(event) {
  console.log('🔧 Активируем Service Worker');
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

self.addEventListener('fetch', function(event) {
  // Для GitHub Pages - особенная обработка
  if (event.request.url.includes('github.io')) {
    event.respondWith(
      caches.match(event.request)
        .then(function(response) {
          // Если есть в кеше - возвращаем
          if (response) {
            return response;
          }
          
          // Иначе пробуем сеть
          return fetch(event.request)
            .then(function(networkResponse) {
              // Кешируем успешные ответы
              if (networkResponse && networkResponse.status === 200) {
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME)
                  .then(function(cache) {
                    cache.put(event.request, responseToCache);
                  });
              }
              return networkResponse;
            })
            .catch(function() {
              // В офлайне возвращаем главную страницу
              return caches.match('/work-timesheet/index.html');
            });
        })
    );
    return;
  }
  
  // Для остальных запросов
  event.respondWith(
    fetch(event.request).catch(function() {
      return caches.match(event.request);
    })
  );
});
