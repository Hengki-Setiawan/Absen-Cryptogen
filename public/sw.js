const CACHE_NAME = 'cryptgen-v1';
const urlsToCache = [
    '/',
    '/jadwal',
    '/mahasiswa',
    '/absen',
    '/logo.jpg',
    '/manifest.json'
];

// Install event - cache files
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
    );
    self.skipWaiting();
});

// Activate event - cleanup old caches
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
    self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});

// Push notification event
self.addEventListener('push', (event) => {
    const data = event.data?.json() || {};
    const title = data.title || 'Cryptgen Class';
    const options = {
        body: data.body || 'Ada kelas yang akan dimulai!',
        icon: '/logo.jpg',
        badge: '/logo.jpg',
        vibrate: [200, 100, 200],
        tag: 'class-notification',
        data: {
            url: data.url || '/jadwal'
        }
    };
    event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});
