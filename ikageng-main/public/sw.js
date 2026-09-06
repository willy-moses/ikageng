// Ikageng PWA service worker
// Strategy:
//  - Supabase REST/auth calls: NEVER cached — always go to network. Caching
//    live worker/group data here would be actively dangerous until a real
//    sync layer exists (stale reads, silently "successful" offline writes).
//  - Navigation (HTML pages): network-first, falling back to cache, falling
//    back to offline.html if neither is available.
//  - Everything else (fonts, CDN scripts, icons, this page's own JS/CSS):
//    cache-first, populating the cache on first successful fetch.

const CACHE_VERSION = 'ikageng-v1';
const OFFLINE_URL = 'offline.html';

// Adjust this list to match whatever shared files actually live alongside
// your HTML pages — these are the ones referenced so far.
const PRECACHE_URLS = [
  'offline.html',
  'manifest.json',
  'ward-utils.js',
  'ward-header.js',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,700;1,9..144,400&display=swap',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css'
];

function isSupabaseRequest(url) {
  return url.hostname.endsWith('.supabase.co');
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .catch(err => console.warn('[sw] precache skipped some URLs:', err))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Never intercept Supabase — always hit the network directly.
  if (isSupabaseRequest(url)) return;

  // Only handle GET requests for caching; POST/PATCH/DELETE pass straight through.
  if (req.method !== 'GET') return;

  // Page navigations: network-first, cache fallback, offline page last resort.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(req, copy));
          return res;
        })
        .catch(() =>
          caches.match(req).then(cached => cached || caches.match(OFFLINE_URL))
        )
    );
    return;
  }

  // Everything else: cache-first, network fallback, cache the result.
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req)
        .then(res => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then(cache => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
    })
  );
});
