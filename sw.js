// Service Worker для полного офлайн-режима
const CACHE_NAME = 'work-timesheet-v1.3';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
];

// Установка Service Worker
self.addEventListener('install', function(event) {
  console.log('🚀 Service Worker: Устанавливаем для офлайн-работы...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('✅ Service Worker: Кешируем основные файлы');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Активация
self.addEventListener('activate', function(event) {
  console.log('🔧 Service Worker: Активируем...');
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

// Обработка запросов - УПРОЩЕННАЯ ВЕРСИЯ
self.addEventListener('fetch', function(event) {
  // Для всех запросов - сначала кеш, потом сеть
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Возвращаем из кеша если есть
        if (response) {
          return response;
        }
        
        // Иначе загружаем из сети
        return fetch(event.request)
          .then(function(networkResponse) {
            // Кешируем только локальные файлы
            if (networkResponse.ok && event.request.url.startsWith('http')) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then(function(cache) {
                  cache.put(event.request, responseToCache);
                });
            }
            return networkResponse;
          })
          .catch(function() {
            // Fallback для HTML-страниц
            if (event.request.destination === 'document') {
              return caches.match('./index.html');
            }
            // Для CSS возвращаем пустой стиль
            if (event.request.url.includes('.css')) {
              return new Response('', { 
                headers: { 'Content-Type': 'text/css' } 
              });
            }
          });
      })
  );
});
