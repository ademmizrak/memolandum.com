const CACHE_NAME = 'memolandum-v5';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './favicon.ico',
  './memolandum_preview.png',
  
  // Shell scripts
  './shells/shooter.shell.js',
  './shells/worddrop.shell.js',
  './shells/highway.shell.js',
  './shells/wordascent.shell.js',
  './shells/breakout.shell.js',
  
  // Data files
  './data/A1_words.json',
  './data/A2_words.json',
  './data/B1_words.json',
  './data/B2_words.json',
  './data/abstract_adjectives.json',
  './data/academic_verbs.json',
  './data/conjunctions.json',
  './data/fillers.json',
  './data/phrasal_verbs.json',
  './data/prepositions.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached response if found
      if (response) {
        return response;
      }
      
      // Otherwise fetch from network
      return fetch(event.request).then(
        (networkResponse) => {
          // Check if we received a valid response
          if(!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }

          // Clone the response because it's a stream
          const responseToCache = networkResponse.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return networkResponse;
        }
      ).catch(() => {
         // Optionally return a fallback offline page here if needed
      });
    })
  );
});

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
    }).then(() => self.clients.claim())
  );
});
