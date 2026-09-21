// Service Worker para Finix PWA

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = {}; }
  event.waitUntil(self.registration.showNotification(data.title || 'Finix', {
    body: data.body || 'Tenes una nueva notificacion.',
    icon: '/finix-logo.png',
    tag: data.tag || 'finix',
    data: { url: data.url || '/notifications' },
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  let url = new URL('/notifications', self.location.origin);
  try {
    const requested = new URL(event.notification.data?.url || '/notifications', self.location.origin);
    if (requested.origin === self.location.origin) url = requested;
  } catch { /* Keep the local notifications route. */ }
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async clients => {
    for (const client of clients) {
      if (new URL(client.url).origin === self.location.origin) {
        await client.navigate(url.href);
        return client.focus();
      }
    }
    return self.clients.openWindow(url.href);
  }));
});
