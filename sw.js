// Название кеша - можно менять версию при обновлениях
const CACHE_NAME = 'work-timesheet-v1.0';

// Что кешируем для офлайн работы
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Установка Service Worker
self.addEventListener('install', function(event) {
  console.log('Устанавливаем приложение для офлайн работы...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Кешируем файлы для офлайн работы');
        return cache.addAll(urlsToCache);
      })
      .then(function() {
        console.log('Все файлы закешированы!');
        return self.skipWaiting();
      })
  );
});

// Активация Service Worker
self.addEventListener('activate', function(event) {
  console.log('Активируем Service Worker...');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cache) {
          if (cache !== CACHE_NAME) {
            console.log('Удаляем старый кеш');
            return caches.delete(cache);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Обработка запросов - работа в офлайн режиме
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Если файл есть в кеше - отдаем из кеша
        if (response) {
          return response;
        }
        
        // Если нет в кеше - загружаем из сети
        return fetch(event.request).then(function(response) {
          // Проверяем валидный ли ответ
          if(!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Сохраняем в кеш для будущего использования
          var responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(function(cache) {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        });
      })
      .catch(function() {
        // Если нет соединения и нет в кеше - показываем офлайн страницу
        return new Response('Офлайн режим', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      })
  );
});