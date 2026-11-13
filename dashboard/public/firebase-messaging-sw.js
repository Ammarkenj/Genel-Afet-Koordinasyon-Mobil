/* Push notifications for centers. Messages from the server are data-only ({ title, body, url, tag }),
   so this worker shows them itself and needs no Firebase library. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    const raw = event.data ? event.data.json() : {};
    payload = raw.data || raw.notification || raw;
  } catch (e) {
    payload = { title: 'YaşamHattı', body: event.data ? event.data.text() : '' };
  }
  const title = payload.title || 'YaşamHattı';
  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body || '',
      tag: payload.tag || 'assignment',
      renotify: true,
      requireInteraction: true,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      dir: payload.dir || 'auto',
      lang: payload.lang || 'tr',
      data: { url: payload.url || '/center' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || '/center', self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if (c.url.startsWith(self.location.origin) && 'focus' in c) {
          c.navigate(url);
          return c.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
