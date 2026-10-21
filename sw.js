// Offline support: cache the app shell on install, serve cache-first,
// and refresh cached files in the background when online.
const CACHE = 'koine-quest-v1';
const SHELL = [
  './', 'index.html', 'manifest.webmanifest', 'css/style.css',
  'js/data/alphabet.js', 'js/data/vocab.js', 'js/data/grammar.js', 'js/data/readings.js', 'js/data/curriculum.js',
  'js/engine.js', 'js/app.js',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.open(CACHE).then(async cache => {
    const hit = await cache.match(e.request, { ignoreSearch: true });
    const fresh = fetch(e.request).then(res => {
      if (res.ok && (res.type === 'basic' || res.type === 'cors')) cache.put(e.request, res.clone());
      return res;
    }).catch(() => hit);
    return hit || fresh;
  }));
});
