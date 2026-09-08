// Mendaftarkan Service Worker setelah halaman selesai dimuat
export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then(() => {
        console.log("Service Worker berhasil didaftarkan.");
      })
      .catch((err) => {
        console.error("Gagal mendaftarkan Service Worker:", err);
      });
  });
}
