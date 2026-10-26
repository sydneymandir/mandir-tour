// Saves the tour on the visitor's phone the first time it opens,
// so every later visit works with no signal at all.
const CACHE = 'mandir-tour-v6';           // bump this when content changes
const CORE  = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './hero.webp'];
// sharper zoom map and stop photos: fetched in the background, never block the tour
const EXTRA = ['./campus-map-zoom.webp',
  './photos/annakut.webp', './photos/gate.webp', './photos/parking.webp', './photos/stop1.webp', './photos/stop2.webp', './photos/stop3.webp', './photos/stop4.webp', './photos/stop5.webp', './photos/stop6.webp', './photos/stop7.webp', './photos/stop8.webp'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(async c => {
    await c.addAll(CORE);
    c.addAll(EXTRA).catch(() => {});
  }).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// Cache first (instant, works offline), then refresh the copy quietly when signal allows.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(e.request, { ignoreSearch: true });
    const net = fetch(e.request).then(r => { if (r && (r.ok || r.type === 'opaque')) c.put(e.request, r.clone()); return r; }).catch(() => null);
    return hit || (await net) || (e.request.mode === 'navigate' ? c.match('./index.html') : Response.error());
  }));
});
