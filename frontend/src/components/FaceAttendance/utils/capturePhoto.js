export const capturePhoto = (videoElement, options = {}) => {
  return new Promise((resolve, reject) => {
    if (!videoElement || videoElement.readyState !== 4) {
      reject(new Error("Video element tidak valid atau belum siap"));
      return;
    }

    const {
      width = 480,
      height = 360,
      quality = 0.85,
      mirror = true, // Mirror untuk kamera depan (selfie)
    } = options;

    try {
      // Buat canvas
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");

      // Mirror effect (karena kamera depan)
      if (mirror) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }

      // Draw video frame ke canvas
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

      // Convert ke base64 JPEG
      const base64 = canvas.toDataURL("image/jpeg", quality);

      // Hapus prefix "data:image/jpeg;base64,"
      const base64Data = base64.split(",")[1];

      resolve(base64Data);
    } catch (err) {
      reject(err);
    }
  });
};
