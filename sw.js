// Service Worker для офлайн-работы приложения "Рабочий табель"
const CACHE_NAME = 'work-timesheet-v1.2';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Установка Service Worker
self.addEventListener('install', function(event) {
  console.log('🚀 Service Worker: Устанавливаем...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('✅ Service Worker: Кешируем файлы для офлайн-работы');
        return cache.addAll(urlsToCache).catch(function(error) {
          console.log('⚠️ Service Worker: Некоторые файлы не закешированы:', error);
        });
      })
      .then(function() {
        console.log('🎉 Service Worker: Все файлы закешированы!');
        return self.skipWaiting();
      })
  );
});

// Активация Service Worker
self.addEventListener('activate', function(event) {
  console.log('🔧 Service Worker: Активируем...');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cache) {
          if (cache !== CACHE_NAME) {
            console.log('🗑️ Service Worker: Удаляем старый кеш:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(function() {
      console.log('✅ Service Worker: Активация завершена');
      return self.clients.claim();
    })
  );
});

// Обработка запросов - офлайн-режим
self.addEventListener('fetch', function(event) {
  // Пропускаем внешние ресурсы (CDN)
  if (event.request.url.includes('cdnjs.cloudflare.com')) {
    return fetch(event.request);
  }
  
  // Пропускаем данные и blob
  if (event.request.url.includes('data:') || event.request.url.includes('blob:')) {
    return fetch(event.request);
  }

  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Если файл есть в кеше - отдаем из кеша
        if (response) {
          console.log('📂 Service Worker: Отдаем из кеша:', event.request.url);
          return response;
        }
        
        // Если нет в кеше - загружаем из сети
        console.log('🌐 Service Worker: Загружаем из сети:', event.request.url);
        return fetch(event.request)
          .then(function(networkResponse) {
            // Кешируем успешные ответы
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then(function(cache) {
                  cache.put(event.request, responseToCache);
                  console.log('💾 Service Worker: Сохранили в кеш:', event.request.url);
                });
            }
            return networkResponse;
          })
          .catch(function(error) {
            console.log('❌ Service Worker: Ошибка загрузки:', event.request.url, error);
            
            // Fallback для HTML-страниц
            if (event.request.destination === 'document' || 
                event.request.headers.get('accept').includes('text/html')) {
              console.log('🔄 Service Worker: Возвращаем index.html');
              return caches.match('./index.html');
            }
            
            // Fallback для других типов файлов
            return new Response('Офлайн режим', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// Фоновая синхронизация (если поддерживается)
self.addEventListener('sync', function(event) {
  if (event.tag === 'background-sync') {
    console.log('🔄 Service Worker: Фоновая синхронизация');
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  return Promise.resolve();
}

// Получение сообщений от основного потока
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});