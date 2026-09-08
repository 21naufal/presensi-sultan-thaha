// face api
import * as faceapi from "face-api.js";

// konstanta konfigurasi
export const FACE_CONFIG = {
  INPUT_SIZE: 320, // resolusi input deteksi (320, 416, 512, 640)
  CONFIDENCE_THRESHOLD: 0.4, // minimum confidence score untuk menganggap deteksi valid
  CENTER_TOLERANCE: 0.15, // toleransi posisi wajah (15%)
  CAPTURE_DELAY: 1000, // jeda antar pengambilan sampel (dalam milidetik)
  REQUIRED_SAMPLES: 5, // jumlah sampel descriptor yang dibutuhkan
};

// konfigurasi opsi deteksi face-api.js
export const FACE_DETECTOR_OPTIONS = new faceapi.TinyFaceDetectorOptions({
  inputSize: FACE_CONFIG.INPUT_SIZE,
  scoreThreshold: FACE_CONFIG.CONFIDENCE_THRESHOLD,
});

// 1. fungsi geometri dan posisi
export const scaleBoundingBox = (
  box,
  videoWidth,
  videoHeight,
  displayWidth,
  displayHeight,
) => {
  const scaleX = displayWidth / videoWidth;
  const scaleY = displayHeight / videoHeight;

  return {
    x: box.x * scaleX,
    y: box.y * scaleY,
    width: box.width * scaleX,
    height: box.height * scaleY,
  };
};

// 2. fungsi mengecek apakah posisi wajah berada di tengah area kamera
export const isFaceCentered = (box, width, height) => {
  // cari titik tengah area kamera
  const centerX = width / 2;
  const centerY = height / 2;

  // cari titik tengah kotak deteksi wajah
  const faceCenterX = box.x + box.width / 2;
  const faceCenterY = box.y + box.height / 2;

  // tentukan batas toleransi (15%)
  const toleranceX = width * FACE_CONFIG.CENTER_TOLERANCE;
  const toleranceY = height * FACE_CONFIG.CENTER_TOLERANCE;

  // hitung selisih absolut dan cek apakah masih dalam toleransi
  return (
    Math.abs(faceCenterX - centerX) < toleranceX &&
    Math.abs(faceCenterY - centerY) < toleranceY
  );
};

// 3. fungsi validasi deteksi wajah
export const validateFaceDetection = (
  detection,
  scaledBox,
  displayWidth,
  displayHeight,
) => {
  // validasi 1 Confidence score terlalu rendah
  if (detection.detection.score < FACE_CONFIG.CONFIDENCE_THRESHOLD) {
    return {
      isValid: false,
      message: "Pencahayaan kurang. Gunakan lokasi yang lebih terang.",
    };
  }

  // validasi 2 Wajah tidak di tengah
  if (!isFaceCentered(scaledBox, displayWidth, displayHeight)) {
    return {
      isValid: false,
      message: "Posisikan wajah tepat di tengah lingkaran.",
    };
  }

  return { isValid: true, message: "" };
};

// 4. fungsi pengolahan descriptor
export const averageDescriptor = (descriptors) => {
  // jika belum ada descriptor, kembalikan array kosong
  if (!descriptors || descriptors.length === 0) return [];

  // ambil jumlah dimensi pada setiap descriptor (128 dimensi)
  const length = descriptors[0].length;

  // buat array penampung total setiap dimensi
  const avg = new Array(length).fill(0);

  // jumlahkan seluruh nilai descriptor pada setiap dimensi
  descriptors.forEach((desc) => {
    for (let i = 0; i < length; i++) {
      avg[i] += desc[i];
    }
  });

  // hitung nilai rata-rata setiap dimensi descriptor
  return avg.map((val) => val / descriptors.length);
};
