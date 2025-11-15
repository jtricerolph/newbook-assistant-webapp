/**
 * Service Worker for NewBook Assistant PWA
 *
 * Provides:
 * - Offline page caching
 * - Static asset caching
 * - Basic offline functionality
 */

const CACHE_NAME = 'newbook-assistant-v1';
const OFFLINE_URL = '/assistant/';

// Assets to cache on install
const PRECACHE_ASSETS = [
    '/assistant/',
    // Add other critical assets here
];

// Install event - cache critical assets
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Caching critical assets');
                return cache.addAll(PRECACHE_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip admin-ajax requests (always go to network)
    if (event.request.url.includes('admin-ajax.php')) {
        return;
    }

    // Skip API requests (always go to network)
    if (event.request.url.includes('/wp-json/')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // Return cached version if available
                if (cachedResponse) {
                    return cachedResponse;
                }

                // Otherwise fetch from network
                return fetch(event.request)
                    .then((response) => {
                        // Cache successful responses
                        if (response && response.status === 200) {
                            const responseToCache = response.clone();

                            caches.open(CACHE_NAME)
                                .then((cache) => {
                                    cache.put(event.request, responseToCache);
                                });
                        }

                        return response;
                    })
                    .catch(() => {
                        // Return offline page if available
                        return caches.match(OFFLINE_URL);
                    });
            })
    );
});
