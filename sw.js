// Saves the tour on the visitor's phone the first time it opens,
// so every later visit works with no signal at all.
const CACHE = 'mandir-tour-v12';           // bump this when content changes
const CORE  = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './hero.webp'];
// sharper zoom map and stop photos: fetched in the background, never block the tour
const EXTRA = ['./campus-map-zoom.webp', './music/divine-footprints.m4a',
  './photos/annakut.webp', './photos/gate.webp', './photos/parking.webp', './photos/stop1.webp', './photos/stop2.webp', './photos/stop3.webp', './photos/stop4.webp', './photos/stop5.webp', './photos/stop6.webp', './photos/stop7.webp', './photos/stop8.webp'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(async c => {
    await c.addAll(CORE);
    c.addAll(EXTRA).catch(() => {});
  }).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('mandir-tour-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// The page itself: try the network first (up to 3 s) so updates show straight away,
// otherwise use the saved copy. Photos and the map: saved copy first (instant, works offline).
const fromNet = (c, req, ms) => new Promise(res => {
  const t = ms ? setTimeout(() => res(null), ms) : 0;
  fetch(req).then(r => { if (r && r.ok) c.put(req, r.clone()); clearTimeout(t); res(r); }).catch(() => { clearTimeout(t); res(null); });
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.open(CACHE).then(async c => {
    if (e.request.mode === 'navigate') {
      return (await fromNet(c, e.request, 3000)) || (await c.match(e.request, { ignoreSearch: true })) || (await c.match('./index.html')) || (await c.match('./')) || Response.error();
    }
    const hit = await c.match(e.request, { ignoreSearch: true });
    if (hit) { fromNet(c, e.request); return hit; }
    return (await fromNet(c, e.request)) || Response.error();
  }));
});
