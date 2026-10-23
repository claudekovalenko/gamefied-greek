// Offline support: cache the app shell on install, use the network when it is
// available and fall back to the cache when offline.
const CACHE = 'koine-quest-v14';
const SHELL = [
  './', 'index.html', 'manifest.webmanifest', 'css/style.css',
  'js/data/alphabet.js', 'js/data/vocab.js', 'js/data/grammar.js', 'js/data/readings.js', 'js/data/curriculum.js', 'js/data/passages.js', 'js/data/teach.js', 'js/data/story.js', 'js/data/wardrobe.js', 'js/reader.js', 'data/nt/books.json', 'data/nt/lexicon.json',
  'js/engine.js', 'js/app.js', 'js/world.js', 'js/worlds.js', 'js/props.js', 'js/stage.js', 'js/stagesets.js', 'js/fx.js', 'js/sidequests.js', 'js/venues.js', 'js/raiders.js', 'js/cloud.js', 'js/vendor/three.module.min.js',
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
  // Network first so updates appear immediately; the cache keeps it working offline.
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const res = await fetch(e.request);
      if (res.ok && (res.type === 'basic' || res.type === 'cors')) cache.put(e.request, res.clone());
      return res;
    } catch (err) {
      const hit = await cache.match(e.request, { ignoreSearch: true });
      if (hit) return hit;
      throw err;
    }
  })());
});
