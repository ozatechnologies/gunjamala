const CACHE_NAME = 'gunjamala-notifier-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/script-new.js',
  '/icon-192x192.png',
  '/manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Received');
  
  let notificationData = { title: 'Gunjamala Notifier', body: 'Time for Gunjamala!' };
  
  try {
    if (event.data) {
      notificationData = event.data.json();
    }
  } catch (e) {
    console.error('Error parsing notification data:', e);
  }

  const title = notificationData.title || 'Gunjamala Notifier';
  const options = {
    body: notificationData.body || 'Time for Gunjamala!',
    icon: 'icon-192x192.png',
    badge: 'icon-192x192.png',
    vibrate: [200, 100, 200],
    data: notificationData.data || {},
    tag: 'gunjamala-notification',
    renotify: true,
    requireInteraction: true
  };

  console.log('[Service Worker] Showing notification:', title, options);

  event.waitUntil(
    self.registration.showNotification(title, options)
      .then(() => console.log('Notification shown successfully'))
      .catch(err => console.error('Error showing notification:', err))
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // Handle the notification click
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Handle background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-notifications') {
    console.log('Background sync for notifications');
    // You can add background sync logic here if needed
  }
});
