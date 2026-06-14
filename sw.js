const CACHE_NAME = 'solarquote-v2';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
  // Do NOT include icon files unless you are 100% sure they exist.
  // Missing files cause the entire cache.addAll() to fail.
];

// Install event – cache essential files individually to avoid total failure
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      console.log('Caching essential files');
      for (const url of urlsToCache) {
        try {
          await cache.add(url);
          console.log(`Cached: ${url}`);
        } catch (err) {
          console.log(`Failed to cache ${url}:`, err);
        }
      }
    })
  );
  self.skipWaiting(); // Activate worker immediately
});

// Fetch event – serve from cache, fallback to network, then offline fallback
self.addEventListener('fetch', event => {
  // Special handling for navigation requests (page loads)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html').then(cached => {
        return cached || fetch(event.request).catch(() => {
          // If both cache and network fail, return a simple offline message
          return new Response('⚠️ You are offline – please reconnect to use the app', {
            status: 200,
            headers: { 'Content-Type': 'text/plain' }
          });
        });
      })
    );
    return;
  }

  // For all other requests (CSS, JS, images, etc.) – cache first, then network
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).catch(() => {
        // Return a harmless empty response for failed assets (e.g., missing icons)
        return new Response('', { status: 404 });
      });
    })
  );
});

// Activate event – delete old caches and take control of all clients
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      // Immediately claim all open clients (tabs/windows)
      return self.clients.claim();
    })
  );
});
