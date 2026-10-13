// Cambiar la version en cada publicacion para que los telefonos descarguen la app nueva.
const CACHE_NAME = 'joyas-pikete-v1';
const ASSETS = [
  './',
  './index.html',
  './app.jsx',
  './firebase-config.js',
  './manifest.webmanifest',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
];
// Librerias y fuentes externas que tambien se guardan para abrir la app sin internet.
// Firestore (firestore.googleapis.com) no pasa por aqui: tiene su propia copia local.
const HOSTS_EXTERNOS = ['unpkg.com', 'www.gstatic.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    const habiaVersionAnterior = keys.some((k) => k !== CACHE_NAME);
    await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));
    await self.clients.claim();
    if (habiaVersionAnterior) {
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach((c) => c.postMessage({ type: 'SW_UPDATED', cache: CACHE_NAME }));
    }
  })());
});

// Primero la red (siempre lo mas nuevo); si no hay internet, lo guardado.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const propio = url.origin === self.location.origin;
  if (!propio && !HOSTS_EXTERNOS.includes(url.hostname)) return;
  event.respondWith(
    fetch(req).then((res) => {
      if (res && res.status === 200 && (res.type === 'basic' || res.type === 'cors')) {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
      }
      return res;
    }).catch(() => caches.match(req))
  );
});
