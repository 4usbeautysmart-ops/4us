const CACHE_NAME = 'cortes-5d-v3';
const URLS_TO_CACHE = [
  './',
  './index.html',
  './index.tsx',
  './logo.svg',
  './manifest.json'
];

// Instalação do Service Worker e cache dos recursos estáticos principais
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(URLS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Ativação e limpeza de caches antigos
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

// Interceptação de requisições
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // IGNORAR requisições que não devem ser cacheadas:
  // 1. Métodos não-GET (POST, PUT, DELETE, etc)
  // 2. Chamadas para a API do Google Gemini/Generative Language
  // 3. Requisições chrome-extension (caso existam)
  if (
    event.request.method !== 'GET' || 
    url.hostname.includes('googleapis.com') || 
    url.hostname.includes('generativelanguage') ||
    url.protocol.startsWith('chrome-extension')
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Retorna o recurso do cache se encontrado
        if (cachedResponse) {
          return cachedResponse;
        }

        // Caso contrário, busca na rede
        return fetch(event.request).then(
          (networkResponse) => {
            // Verifica se a resposta é válida
            // Aceitamos 'basic' (mesma origem) e 'cors' (CDNs externas como Tailwind, Google Fonts)
            if(
              !networkResponse || 
              networkResponse.status !== 200 || 
              (networkResponse.type !== 'basic' && networkResponse.type !== 'cors')
            ) {
              return networkResponse;
            }

            // Clona a resposta para armazenar no cache
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          }
        ).catch(() => {
          // Fallback opcional para offline (poderia retornar uma página offline.html aqui)
          // Como é um SPA, geralmente o index.html cacheado já resolve a navegação básica
        });
      })
  );
});