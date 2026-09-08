// React
import { useEffect, useRef, useState, useCallback } from "react";

// face api
import * as faceapi from "face-api.js";

// Utils
import { loadFaceModels } from "../../../utils/loadModels";
import {
  FACE_CONFIG,
  FACE_DETECTOR_OPTIONS,
  scaleBoundingBox,
  validateFaceDetection,
  averageDescriptor,
} from "../utils/faceHelpers";

// Services
import api from "../../../services/api";

export const useFaceRegistration = (
  user,
  updateUserData,
  navigate,
  onRegistrationSuccess,
) => {
  // Refs elemen video, canvas, stream, animation ftame
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);

  // Refs menyimpan seluruh descriptor hasil scanning wajah
  const descriptorsRef = useRef([]);

  // Refs penanda proses scanning dan penyimpanan
  const isScanningRef = useRef(false);
  const isSavingRef = useRef(false);

  // State tampilan UI
  const [status, setStatus] = useState("Memuat model fitur...");
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturedSamples, setCapturedSamples] = useState(0);

  // Load model saat halaman dibuka
  useEffect(() => {
    const initModels = async () => {
      try {
        await loadFaceModels();
        setModelsLoaded(true);
        setStatus("Siap untuk pendaftaran wajah");
      } catch (error) {
        console.error("Gagal memuat model:", error);
        setStatus("Gagal memuat model pendaftaran wajah");
      }
    };

    initModels();

    // matikan kamera saat komponen ditutup
    return () => stopCamera();
  }, []);

  // menyalakan kamera
  const startCamera = useCallback(async () => {
    try {
      // meminta akses kamera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
        },
        audio: false,
      });

      streamRef.current = stream;

      // hubungkan stream ke elemen video
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraReady(true);
      }
    } catch (error) {
      console.error(error);
      setStatus("Tidak dapat mengakses kamera. Mohon izinkan akses!");
    }
  }, []);

  // mematikan kamera
  const stopCamera = useCallback(() => {
    // hentikan loop animasi frame
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    // matikan seluruh stream kamera
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setCameraReady(false);
    isScanningRef.current = false;
  }, []);

  // simpan face descriptor ke backend
  const saveDescriptor = useCallback(
    async (descriptor) => {
      isSavingRef.current = true;
      setSaving(true);
      setStatus("Menyimpan data wajah...");

      try {
        // kirim descriptor ke backend
        await api.post("/face/register", {
          pegawai_id: user.pegawai_id,
          descriptor,
        });

        // setelah berhasil, hentikan kamera
        stopCamera();
        setStatus("Pendaftaran wajah berhasil");

        if (onRegistrationSuccess) {
          onRegistrationSuccess();
        }

        return true;
      } catch (error) {
        console.error(error);
        setStatus("Pendaftaran wajah gagal. Coba ulangi lagi.");
        setSaving(false);
        isSavingRef.current = false;

        return false;
      }
    },
    [user, stopCamera, onRegistrationSuccess],
  );

  // proses scanning wajah
  const startScanning = useCallback(() => {
    // hindari proses scanning berjalan lebih dari satu kali
    if (isScanningRef.current) return () => {};
    isScanningRef.current = true;

    let captureTimeout = null;
    let isCancelled = false;

    // fungsi rekursif untuk loop pemindaian
    const scan = async () => {
      // hentikan proses jika scanning dibatalkan, dimatikan, atau sedang menyimpan
      if (isCancelled || !isScanningRef.current || isSavingRef.current) {
        return;
      }

      // tunggu video benar benar siap
      if (!videoRef.current || videoRef.current.readyState !== 4) {
        animationRef.current = requestAnimationFrame(scan);
        return;
      }

      const video = videoRef.current;
      const displayWidth = video.offsetWidth || video.clientWidth;
      const displayHeight = video.offsetHeight || video.clientHeight;
      const canvas = canvasRef.current;

      if (!canvas) {
        if (!isCancelled) {
          animationRef.current = requestAnimationFrame(scan);
        }
        return;
      }

      // siapkan canvas untuk kotak deteksi
      const ctx = canvas.getContext("2d");
      canvas.width = displayWidth;
      canvas.height = displayHeight;
      ctx.clearRect(0, 0, displayWidth, displayHeight);

      try {
        // proses deteksi wajah + cari landmark + ambil descriptor
        const detection = await faceapi
          .detectSingleFace(video, FACE_DETECTOR_OPTIONS)
          .withFaceLandmarks()
          .withFaceDescriptor();

        // jika tidak ada wajah yang terdeteksi
        if (!detection) {
          setStatus(
            "Wajah tidak terdeteksi. Posisikan wajah di dalam lingkaran.",
          );
          if (!isCancelled && isScanningRef.current) {
            animationRef.current = requestAnimationFrame(scan);
          }
          return;
        }

        // menyesuaikan posisi box dengan ukuran video
        const scaledBox = scaleBoundingBox(
          detection.detection.box,
          video.videoWidth,
          video.videoHeight,
          displayWidth,
          displayHeight,
        );

        // validasi kualitas hasil deteksi
        const validation = validateFaceDetection(
          detection,
          scaledBox,
          displayWidth,
          displayHeight,
        );

        if (!validation.isValid) {
          setStatus(validation.message);
          if (!isCancelled && isScanningRef.current) {
            animationRef.current = requestAnimationFrame(scan);
          }
          return;
        }

        // gambar kotak hijau di wajah
        ctx.strokeStyle = "lime";
        ctx.lineWidth = 2;
        ctx.strokeRect(
          scaledBox.x,
          scaledBox.y,
          scaledBox.width,
          scaledBox.height,
        );

        // proses ambil beberapa sampel face descriptor
        if (
          descriptorsRef.current.length < FACE_CONFIG.REQUIRED_SAMPLES &&
          !captureTimeout
        ) {
          setStatus("Sedang mengambil sampel. Mohon tahan posisi...");

          // simpan descriptor (vektor 128 dimensi)
          descriptorsRef.current.push(Array.from(detection.descriptor));
          setCapturedSamples(descriptorsRef.current.length);

          // beri jeda sebelum mengambil sampel berikutnya agar bervariasi
          captureTimeout = setTimeout(() => {
            captureTimeout = null;
            if (!isCancelled && isScanningRef.current) {
              animationRef.current = requestAnimationFrame(scan);
            }
          }, FACE_CONFIG.CAPTURE_DELAY);
          return;
        }

        // jika semua sampel terkumpul, simpan
        if (descriptorsRef.current.length >= FACE_CONFIG.REQUIRED_SAMPLES) {
          isScanningRef.current = false;
          await saveDescriptor(averageDescriptor(descriptorsRef.current));
          return;
        }
      } catch (error) {
        console.error("Pemindaian wajah error:", error);
        setStatus("Terjadi kesalahan saat memindai wajah.");
      }

      // Lanjutkan proses scanning / loop ke frame berikutnya
      if (!isCancelled && isScanningRef.current) {
        animationRef.current = requestAnimationFrame(scan);
      }
    };

    // mulai loop pertama
    scan();

    // cleanup saat scanning dihentikan
    return () => {
      isCancelled = true;
      isScanningRef.current = false;
      if (captureTimeout) {
        clearTimeout(captureTimeout);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [saveDescriptor]);

  // handle setelah pendaftaran berhasil
  const handleRegistrationSuccess = useCallback(() => {
    // update state global user
    const updatedUser = {
      ...user,
      faceRegistered: true,
    };
    updateUserData(updatedUser);

    // redirect ke dashboard
    navigate("/pegawai/dashboard", {
      replace: true,
    });
  }, [user, updateUserData, navigate]);

  // reset proses scanning jika user ingin mengulang pendaftaran
  const resetScanning = useCallback(() => {
    descriptorsRef.current = [];
    setCapturedSamples(0);
    setStatus("Memulai pemindaian...");
    isScanningRef.current = false;
  }, []);

  // return hook
  return {
    refs: {
      videoRef,
      canvasRef,
    },

    state: {
      status,
      modelsLoaded,
      saving,
      cameraReady,
      capturedSamples,
      requiredSamples: FACE_CONFIG.REQUIRED_SAMPLES,
    },

    actions: {
      startCamera,
      stopCamera,
      startScanning,
      handleRegistrationSuccess,
      setStatus,
      resetScanning,
    },
  };
};
