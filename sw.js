const CACHE = 'gk-estate-v1';
const ASSETS = ['/'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Solo richieste GET, ignora Google Scripts e analytics
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('script.google.com')) return;
  if (e.request.url.includes('wa.me')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        // Salva in cache solo risorse dello stesso dominio e font Google
        if (
          response.ok &&
          (e.request.url.startsWith(self.location.origin) ||
           e.request.url.includes('fonts.gstatic.com') ||
           e.request.url.includes('fonts.googleapis.com') ||
           e.request.url.includes('cdn.jsdelivr.net'))
        ) {
          const clone = response.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return response;
      }).catch(() => cached || new Response('Offline', { status: 503 }));
    })
  );
});
