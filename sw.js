const CACHE_NAME = 'work-timesheet-v2.0';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
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

// Обработка запросов
self.addEventListener('fetch', function(event) {
  // Для внешних ресурсов (CDN) - всегда загружаем из сети
  if (event.request.url.includes('cdnjs.cloudflare.com')) {
    return fetch(event.request);
  }
  
  // Для данных localStorage - пропускаем
  if (event.request.url.includes('data:')) {
    return fetch(event.request);
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Если файл есть в кеше - отдаем из кеша
        if (response) {
          return response;
        }
        
        // Если нет в кеше - загружаем из сети
        return fetch(event.request).then(function(response) {
          // Кешируем только успешные ответы
          if (response && response.status === 200 && response.type === 'basic') {
            var responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });
          }
          return response;
        }).catch(function() {
          // Fallback для офлайн режима - возвращаем основную страницу
          if (event.request.destination === 'document') {
            return caches.match('./index.html');
          }
          return new Response('Офлайн', { status: 503 });
        });
      })
  );
});