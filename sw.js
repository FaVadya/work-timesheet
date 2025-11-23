// Название кеша
const CACHE_NAME = 'work-timesheet-v1.1';

// Что кешируем для офлайн работы
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
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
});

// Обработка запросов
self.addEventListener('fetch', function(event) {
  // Пропускаем запросы к CDN и внешним ресурсам
  if (event.request.url.includes('cdnjs.cloudflare.com')) {
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
        return fetch(event.request);
      })
  );
});
