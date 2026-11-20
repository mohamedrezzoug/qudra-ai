// QUDRA AI service worker – incrémenter CACHE à chaque déploiement
const CACHE = 'qudra-v10';
const FILES = ['./', './index.html', './manifest.json', './css/style.css', './js/app.js', './js/scene.js', './js/store.js', './js/i18n.js', './js/content.js', './js/content2.js', './js/content3.js', './js/core.js', './js/prompts.js', './js/ai.js', './js/human.js', './js/mind.js', './js/invent.js', './js/universal.js', './js/career.js', './js/world.js', './js/vision.js', './js/offline.js', './js/memory.js', './js/access.js', './js/three.module.min.js', './icons/icon-192.png', './icons/icon-512.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => Promise.all(FILES.map((u) => fetch(u, { cache: 'reload' }).then((r) => { if (r.ok) return c.put(u, r); })))).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const same = new URL(e.request.url).origin === location.origin;
  e.respondWith(fetch(e.request, same ? { cache: 'no-cache' } : undefined).then((r) => {
    if (r.ok && same) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
    return r;
  }).catch(() => caches.match(e.request).then((hit) => hit || caches.match('./index.html'))));
});
self.addEventListener('message', (e) => {
  if (e.data === 'refresh') e.waitUntil(caches.open(CACHE).then((c) => Promise.all(FILES.map((u) => fetch(u, { cache: 'reload' }).then((r) => r.ok && c.put(u, r)).catch(() => {})))));
});
