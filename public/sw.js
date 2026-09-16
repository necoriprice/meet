// PWAのインストール要件を満たすための最小限のService Worker。
// ビデオ通話はリアルタイム通信が前提のため、積極的なキャッシュは行わず
// 「ネットワーク優先、オフライン時のみキャッシュにフォールバック」に留める。
const CACHE_NAME = 'riprice-meet-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        return response;
      })
      .catch(() => caches.match(event.request)),
  );
});
