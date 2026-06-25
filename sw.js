// Portfolio Tracker — Service Worker
// Handles: background caching, push notification delivery

const CACHE = 'portfolio-v1';
const ASSETS = ['/', '/index.html', '/manifest.json', '/icons/icon-192.png'];

// ── INSTALL: cache core assets ──
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting();
});

// ── ACTIVATE: clean old caches ──
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── FETCH: serve from cache, fallback to network ──
self.addEventListener('fetch', e => {
  // Never intercept Yahoo Finance API calls — always go live
  if (e.request.url.includes('finance.yahoo.com')) return;

  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

// ── PUSH: receive server-sent push (for future server integration) ──
self.addEventListener('push', e => {
  const data = e.data?.json() ?? { title: 'Portfolio Update', body: 'New data available.' };
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body:  data.body,
      icon:  '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag:   'portfolio-update',
      renotify: true,
      vibrate: [200, 100, 200]
    })
  );
});

// ── NOTIFICATION CLICK: focus the app ──
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url.includes(self.location.origin) && 'focus' in c) return c.focus();
      }
      return clients.openWindow('/');
    })
  );
});
