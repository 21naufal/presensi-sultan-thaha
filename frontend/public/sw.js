// Nama versi cache untuk model Face API
const CACHE_NAME = "face-model-cache-v1";

// Daftar file model AI yang akan di-cache
const MODEL_FILES = [
  "/models/tiny_face_detector_model-weights_manifest.json",
  "/models/tiny_face_detector_model-shard1",

  "/models/face_landmark_68_model-weights_manifest.json",
  "/models/face_landmark_68_model-shard1",

  "/models/face_recognition_model-weights_manifest.json",
  "/models/face_recognition_model-shard1",
  "/models/face_recognition_model-shard2",
];

// Event install: Simpan semua file model ke cache browser saat Service Worker dipasang
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(MODEL_FILES);
    }),
  );
});

// Event activate: Klaim kontrol Service Worker segera agar aktif tanpa menunggu refresh
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Event fetch: Mencegat request jaringan untuk menerapkan strategi caching
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Abaikan request yang bukan menuju folder /models
  if (!url.pathname.startsWith("/models")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Jika model sudah ada di cache, kembalikan langsung (Cache First)
      if (cachedResponse) {
        return cachedResponse;
      }

      // Jika belum ada di cache, ambil dari network lalu simpan ke cache untuk pemakaian berikutnya
      return fetch(event.request).then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());

          return networkResponse;
        });
      });
    }),
  );
});
