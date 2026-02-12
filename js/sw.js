const CACHE_NAME = 'lms-v2';
const urlsToCache = [
    './',
    './index.html',
    './styles.css',
    './icon.svg',
    './js/config.js',
    './js/firebase-db.js',
    './js/utils.js',
    './js/icons.js',
    './js/components.js',
    './js/login.js',
    './js/dashboard.js',
    './js/students.js',
    './js/seats.js',
    './js/payments.js',
    './js/accounts.js',
    './js/alerts.js',
    './js/attendance.js',
    './js/activity.js',
    './js/settings.js',
    './js/chatbot.js',
    './js/app.js',
    './js/app.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request).then(
                    response => {
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        // Optional: Clone response to cache dynamic requests?
                        // For now, only caching the explicit list for stability
                        return response;
                    }
                );
            })
    );
});

self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

