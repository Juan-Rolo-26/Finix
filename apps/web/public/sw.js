// Service Worker para Finix PWA
const CACHE_NAME = 'finix-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Passthrough fetch para asegurar frescura de datos en la plataforma
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
