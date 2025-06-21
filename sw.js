const CACHE_NAME = 'gunjamala-notifier-v3';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/script-new.js',
  '/push-manager.js',
  '/icon-192x192.png',
  '/manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching app shell');
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (CACHE_NAME !== cacheName) {
            console.log('Removing old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all pages under this service worker
      return self.clients.claim();
    })
  );
});

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Received:', event);
  
  let notificationData = { 
    title: 'Gunjamala Notifier', 
    body: 'Time for Gunjamala!',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [200, 100, 200, 100, 200, 100, 200],
    data: {
      url: '/',
      timestamp: Date.now()
    },
    actions: [
      { action: 'view', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };
  
  try {
    if (event.data) {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    }
  } catch (e) {
    console.error('Error parsing notification data:', e);
  }

  const title = notificationData.title || 'Gunjamala Notifier';
  const options = {
    body: notificationData.body || 'Time for Gunjamala!',
    icon: notificationData.icon || '/icon-192x192.png',
    badge: notificationData.badge || '/icon-192x192.png',
    vibrate: notificationData.vibrate || [200, 100, 200, 100, 200, 100, 200],
    data: notificationData.data || { url: '/' },
    actions: notificationData.actions || [
      { action: 'view', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
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
