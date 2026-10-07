/* FarmIntelytics on the phone (installable web app).
 * Keeps the app itself on the device so it opens without signal:
 *  - pages: network first, then the last copy, then offline.html
 *  - app files (/assets, fonts, icons, crop photos): served from the device, refreshed in the background
 * Never stores organisation data: API calls (/farmintelytics-engine/) and map tiles always go to the network.
 * Answers and field visits made without signal are kept by the app itself and sent later. */
const VERSION = 'fi-app-v1';
const SHELL = ['/', '/index.html', '/offline.html', '/manifest.webmanifest', '/favicon-192.png', '/icon-512.png', '/farmintelytics-logo.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

const isAppFile = (url) => url.origin === self.location.origin && (/^\/assets\//.test(url.pathname) || /\.(png|svg|ico|webp|jpg|jpeg|woff2?)$/.test(url.pathname) || url.pathname === '/manifest.webmanifest');
const isFont = (url) => /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.pathname.startsWith('/farmintelytics-engine/')) return; // organisation data: never cached here

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => { const copy = res.clone(); caches.open(VERSION).then((c) => c.put('/index.html', copy)); return res; })
        .catch(async () => (await caches.match('/index.html')) || caches.match('/offline.html')),
    );
    return;
  }

  if (isAppFile(url) || isFont(url)) {
    event.respondWith(
      caches.open(VERSION).then(async (c) => {
        const hit = await c.match(req);
        const fresh = fetch(req).then((res) => { if (res.ok || res.type === 'opaque') c.put(req, res.clone()); return res; }).catch(() => hit);
        return hit || fresh;
      }),
    );
  }
});
