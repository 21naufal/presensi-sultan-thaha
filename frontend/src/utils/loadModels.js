import * as faceapi from "face-api.js";

let loadingPromise = null;

// Memuat model AI (face-api.js) untuk deteksi dan pengenalan wajah
export const loadFaceModels = async () => {
  // Jika model sudah dimuat, lewati proses loading
  if (
    faceapi.nets.tinyFaceDetector.isLoaded &&
    faceapi.nets.faceLandmark68Net.isLoaded &&
    faceapi.nets.faceRecognitionNet.isLoaded
  ) {
    console.log("Models already loaded");
    return true;
  }

  // Cegah loading ganda: gunakan promise yang sedang berjalan jika ada
  if (loadingPromise) {
    console.log("Waiting existing model loading...");
    return loadingPromise;
  }

  const MODEL_URL = "/models";

  // Load 3 model utama: Deteksi wajah, Landmark, dan Pengenalan
  loadingPromise = Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ])
    .then(() => {
      console.log("Semua model berhasil dimuat");
      return true;
    })
    .catch((error) => {
      loadingPromise = null; // Reset jika gagal
      throw error;
    });

  return loadingPromise;
};

// Mengecek status apakah semua model wajah sudah siap digunakan
export const areFaceModelsLoaded = () => {
  return (
    faceapi.nets.tinyFaceDetector.isLoaded &&
    faceapi.nets.faceLandmark68Net.isLoaded &&
    faceapi.nets.faceRecognitionNet.isLoaded
  );
};
