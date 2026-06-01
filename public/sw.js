// ICOM Service Worker — cache shell for offline support + PWA install
const CACHE = "icom-v1";
const SHELL = ["/", "/offline", "/manifest.json", "/icon-192.png", "/icon-512.png", "/apple-touch-icon.png", "/logo.svg", "/favicon.svg"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  // Only handle GET requests for same-origin or static assets
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  // Let API calls go through the network always
  if (url.pathname.startsWith("/api")) return;

  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((res) => {
        // Cache successful same-origin page responses
        if (res.ok && url.origin === self.location.origin) {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, clone));
        }
        return res;
      }).catch(() => {
        // Offline fallback for navigation requests
        if (e.request.mode === "navigate") return caches.match("/");
      });
    })
  );
});
