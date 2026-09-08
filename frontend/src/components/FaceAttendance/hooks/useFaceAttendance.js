import { useEffect, useRef, useState, useCallback } from "react";
import * as faceapi from "face-api.js";
import { useNavigate } from "react-router-dom";
import { loadFaceModels } from "../../../utils/loadModels";
import { formatTime } from "../../../utils/timeUtils";
import { getWIBDate } from "../../../utils/timeUtils";
import api from "../../../services/api";
import { isFaceCentered } from "../utils/faceHelpers";
import { useLocation } from "../../../context/LocationContext";

// Module challenge
import { useChallengeManager } from "./challenges/useChallengeManager";
import {
  CHALLENGE_TYPES,
  getRandomChallenge,
} from "./challenges/challengeConfig";

// ambil foto presensi
import { capturePhoto } from "../utils/capturePhoto";

// Konstanta global (tetap)
const MIN_BUFFER_REQUIRED = 5;

// Helper: Serialize landmarks untuk dikirim ke backend
const serializeLandmarks = (landmarks) => {
  if (!landmarks) return [];
  return landmarks.map((p) => ({ x: p.x, y: p.y }));
};

export const useFaceAttendance = (
  user,
  shiftInfo,
  attendanceType,
  onClose,
  onAttendanceSuccess,
) => {
  const navigate = useNavigate();
  const {
    location,
    buffer: locationBuffer,
    error: locationError,
  } = useLocation();

  // REF KAMERA & SCANNING
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);
  const bufferPollingRef = useRef(null);

  // Ref untuk sync nilai yang sering berubah (hindari stale closure)
  const locationBufferLengthRef = useRef(0);
  const verifyingDescriptorRef = useRef(null);
  const proceedWithVerificationRef = useRef(null);

  // Ref untuk menyimpan foto capture terakhir
  const latestPhotoRef = useRef(null);

  // STATE UTAMA
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState("Memuat model...");
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [attendanceData, setAttendanceData] = useState(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [countdown, setCountdown] = useState(null);
  const [locationBufferCount, setLocationBufferCount] = useState(0);

  // CHALLENGE MANAGER HOOK
  const {
    challengeState,
    challengeInstruction,
    challengeProgress,
    startChallenge,
    resetChallenge,
    processFrame: processChallengeFrame,
    isActive: isChallengeActive,
    getChallengeProof,
    activeChallengeType,
  } = useChallengeManager((landmarks) => {
    handleChallengeComplete(landmarks);
  });

  // SYNC REFS
  useEffect(() => {
    locationBufferLengthRef.current = locationBuffer?.length || 0;
  }, [locationBuffer]);

  useEffect(() => {
    setLocationBufferCount(locationBuffer?.length || 0);
  }, [locationBuffer]);

  // BUFFER POLLING
  const startBufferPolling = useCallback((onBufferReady) => {
    if (bufferPollingRef.current) {
      clearInterval(bufferPollingRef.current);
    }
    bufferPollingRef.current = setInterval(() => {
      const currentCount = locationBufferLengthRef.current;
      if (currentCount >= MIN_BUFFER_REQUIRED) {
        clearInterval(bufferPollingRef.current);
        bufferPollingRef.current = null;
        onBufferReady();
      }
    }, 500);
  }, []);

  const stopBufferPolling = useCallback(() => {
    if (bufferPollingRef.current) {
      clearInterval(bufferPollingRef.current);
      bufferPollingRef.current = null;
    }
  }, []);

  // KAMERA
  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise((resolve) => {
          if (videoRef.current?.readyState >= 2) {
            resolve(true);
          } else {
            videoRef.current.onloadedmetadata = () => resolve(true);
          }
        });
      }
      return true;
    } catch (error) {
      console.error("Camera start error:", error);
      throw error;
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    stopBufferPolling();
  }, [stopBufferPolling]);

  // RESET & COUNTDOWN
  const resetDetection = useCallback(() => {
    if (challengeState !== "idle") return;
    resetChallenge();
    setFaceDetected(false);
    setShowInstructions(true);
    setCountdown(null);
    setStatus("Posisikan wajah Anda di tengah lingkaran.");
  }, [challengeState, resetChallenge]);

  const startCountdown = useCallback(() => {
    if (countdownStartedRef.current) return;
    countdownStartedRef.current = true;
    let count = 3;
    setCountdown(count);
    countdownRef.current = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
      } else {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
        setCountdown(null);
        setFaceDetected(true);
        setShowInstructions(false);
        startRandomChallenge();
        setStatus("Silakan buka mulut Anda!");
      }
    }, 1000);
  }, []);

  const resetCountdown = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    countdownStartedRef.current = false;
    setCountdown(null);
  }, []);

  // Ref untuk countdown
  const countdownRef = useRef(null);
  const countdownStartedRef = useRef(false);

  // VERIFIKASI FACE & SAVE PRESENSI
  const proceedWithVerification = useCallback(
    async (descriptor, landmarks) => {
      try {
        // STEP 1: Verifikasi Wajah & Lokasi
        setStatus("Memverifikasi wajah & lokasi...");
        // Ambil proof dari challenge manager
        const challengeProof = getChallengeProof();
        const challengeType = activeChallengeType;

        console.log("=== CHALLENGE DATA ===");
        console.log("challengeState:", challengeState);
        console.log("challengeType:", challengeType);
        console.log("challengeProof:", challengeProof);
        console.log("challengeProgress:", challengeProgress);

        const verifyRes = await api.post("/face/verify", {
          capturedDescriptor: Array.from(descriptor),
          landmarks: serializeLandmarks(landmarks),
          location,
          locationBuffer,
          challengeType,
          challengeProof,
        });

        const {
          verified,
          message,
          faceDistance,
          timestamp,
          fakeGpsDetected,
          distanceFromOffice,
        } = verifyRes.data;

        if (!verified) {
          // Untuk kasus ditolak (rejected):
          setAttendanceData({
            time: formatTime(new Date(timestamp)),
            status: "-",
            location: shiftInfo.location, // ✅ Dari API
            shift: `${shiftInfo.name} (${shiftInfo.startTime.substring(0, 5)}-${shiftInfo.endTime.substring(0, 5)})`, // ✅ Dari API
            faceVerified: false,
            matchDistance: faceDistance,
            isRejected: true,
            rejectReason: message,
            isFakeGpsDetected: fakeGpsDetected,
            locationDistance: distanceFromOffice,
          });
          setStep(3);
          return;
        }

        const fotoBase64 = latestPhotoRef.current;

        // STEP 2: Simpan ke Database via /presensi/record
        setStatus("Menyimpan data presensi...");

        // Kirim waktu WIB ke backend
        const nowWIB = getWIBDate();

        const recordRes = await api.post("/presensi/record", {
          tipe: attendanceType,
          latitude: location.latitude,
          longitude: location.longitude,
          foto: fotoBase64,
          waktuWIB: nowWIB.toISOString(),
        });

        const recordData = recordRes.data.data;

        // LOGIKA BARU: Bedakan status berdasarkan tipe presensi
        let statusText = "Pulang";
        let isLateDisplay = false;

        if (attendanceType === "masuk") {
          // Check-in: gunakan statusPresensi dari backend
          statusText =
            recordData.statusPresensi === "terlambat" ? "Terlambat" : "Hadir";
        } else {
          // Check-out: gunakan isLate dari backend (pulang terlambat)
          statusText = "Pulang";
          isLateDisplay = recordData.isLate || false;
        }

        // Untuk kasus berhasil (success):
        const data = {
          time: recordData.waktu || formatTime(new Date()),
          status: statusText,
          tipe: attendanceType,
          location: shiftInfo.location,
          shift: `${shiftInfo.name} (${shiftInfo.startTime.substring(0, 5)}-${shiftInfo.endTime.substring(0, 5)})`,
          faceVerified: true,
          matchDistance: faceDistance,
          isRejected: false,
          isSaved: true,
          isLate: recordData.isLate,
          statusPresensi: recordData.statusPresensi,
          isLateDisplay,
          fotoUrl: recordData.fotoUrl,
        };

        setAttendanceData(data);
        setStep(3);
      } catch (error) {
        console.error("Proses presensi gagal:", error);
        const errorMsg =
          error.response?.data?.message || "Verifikasi atau penyimpanan gagal";

        // Untuk kasus error:
        const data = {
          time: formatTime(new Date()),
          status: "-",
          location: shiftInfo.location,
          shift: `${shiftInfo.name} (${shiftInfo.startTime.substring(0, 5)}-${shiftInfo.endTime.substring(0, 5)})`,
          faceVerified: false,
          matchDistance: "999",
          isRejected: true,
          rejectReason: errorMsg,
          isFakeGpsDetected: false,
        };
        setAttendanceData(data);
        setStep(3);
      }
    },
    [user, shiftInfo, attendanceType, location, locationBuffer],
  );

  // Sync ref proceedWithVerification
  useEffect(() => {
    proceedWithVerificationRef.current = proceedWithVerification;
  }, [proceedWithVerification]);

  // Wrapper verifyFaceMatch
  const verifyFaceMatch = useCallback(
    async (descriptor, landmarks) => {
      setStep(2);
      verifyingDescriptorRef.current = { descriptor, landmarks };
      if (locationBufferCount < MIN_BUFFER_REQUIRED) {
        setStatus(
          `Mengumpulkan data lokasi... (${locationBufferCount}/${MIN_BUFFER_REQUIRED})`,
        );
        startBufferPolling(async () => {
          const latestProceed = proceedWithVerificationRef.current;
          const saved = verifyingDescriptorRef.current;
          if (latestProceed && saved) {
            await latestProceed(saved.descriptor, saved.landmarks);
          } else {
            console.error("proceedWithVerification atau data tidak tersedia");
            setStatus("Error: Data tidak valid. Coba lagi.");
          }
        });
        return;
      }
      await proceedWithVerification(descriptor, landmarks);
    },
    [locationBufferCount, startBufferPolling, proceedWithVerification],
  );

  // captureVerificationFrame
  const captureVerificationFrame = useCallback(async () => {
    if (!videoRef.current) return null;

    // 1. Deteksi wajah & ambil descriptor
    const result = await faceapi
      .detectSingleFace(
        videoRef.current,
        new faceapi.TinyFaceDetectorOptions({
          inputSize: 160,
          scoreThreshold: 0.4,
        }),
      )
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!result || !result.descriptor || result.descriptor.length !== 128) {
      return null;
    }

    // 2. CAPTURE FOTO DARI FRAME INI (tepat saat challenge berhasil)
    try {
      const photoBase64 = await capturePhoto(videoRef.current, {
        width: 480,
        height: 360,
        quality: 0.85,
        mirror: true,
      });
      // Simpan di ref agar bisa diakses proceedWithVerification
      latestPhotoRef.current = photoBase64;
    } catch (err) {
      console.warn("⚠️ Gagal capture foto, lanjut tanpa foto:", err.message);
      latestPhotoRef.current = null;
    }

    return {
      descriptor: result.descriptor,
      landmarks: result.landmarks?.positions || result.landmarks,
    };
  }, []);

  // handleChallengeComplete
  const handleChallengeComplete = useCallback(
    async (landmarks) => {
      setStatus("Mengambil wajah...");
      try {
        const finalFrame = await captureVerificationFrame();
        if (!finalFrame) throw new Error("Descriptor tidak valid");
        await verifyFaceMatch(finalFrame.descriptor, finalFrame.landmarks);
      } catch (err) {
        console.error(err);
        setStatus("Gagal mengambil wajah. Coba lagi.");
      }
    },
    [captureVerificationFrame, verifyFaceMatch],
  );

  // START CHALLENGE
  // Pilih challenge random (mouth atau blink)
  const startRandomChallenge = useCallback(() => {
    const randomType = getRandomChallenge();
    startChallenge(randomType);

    // Status awal sesuai challenge
    if (randomType === CHALLENGE_TYPES.MOUTH_OPEN) {
      setStatus("Tutup mulut Anda terlebih dahulu...");
    } else if (randomType === CHALLENGE_TYPES.BLINK) {
      setStatus("Buka mata Anda lebar-lebar...");
    }
  }, [startChallenge]);

  // SCANNING LOOP
  const startScanning = useCallback(() => {
    let frameCount = 0;
    let lastDetectionTime = 0;
    const DETECTION_FPS = 2;
    const MIN_DETECTION_INTERVAL = 700 / DETECTION_FPS;

    const scan = async () => {
      frameCount++;

      // Guard clause: stop jika video tidak ready atau step berubah
      if (
        !videoRef.current ||
        videoRef.current.readyState !== 4 ||
        step !== 1
      ) {
        animationRef.current = requestAnimationFrame(scan);
        return;
      }

      const video = videoRef.current;
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        animationRef.current = requestAnimationFrame(scan);
        return;
      }

      // Rate limit deteksi agar tidak terlalu berat
      const now = performance.now();
      if (now - lastDetectionTime < MIN_DETECTION_INTERVAL) {
        animationRef.current = requestAnimationFrame(scan);
        return;
      }

      try {
        let detection = null;
        const detectionConfig =
          challengeState === "idle"
            ? { inputSize: 224, scoreThreshold: 0.35 }
            : { inputSize: 160, scoreThreshold: 0.3 };

        const detector = faceapi.detectSingleFace(
          video,
          new faceapi.TinyFaceDetectorOptions(detectionConfig),
        );

        detection =
          challengeState === "idle"
            ? await detector
            : await detector.withFaceLandmarks();

        lastDetectionTime = now;

        // Tidak ada wajah terdeteksi
        if (!detection) {
          if (challengeState === "idle") {
            resetCountdown();
            resetDetection();
            if (frameCount % 15 === 0) {
              setStatus(
                "Mencari wajah... Pastikan wajah berada di dalam lingkaran",
              );
            }
          } else {
            setStatus("Pertahankan posisi wajah didalam lingkaran...");
          }
          animationRef.current = requestAnimationFrame(scan);
          return;
        }

        // Cek confidence deteksi
        const confidence = detection?.detection?.score ?? detection?.score ?? 0;

        if (confidence < 0.25) {
          if (challengeState === "idle" && frameCount % 15 === 0) {
            setStatus("Deteksi lemah. Perbaiki pencahayaan.");
          }
          animationRef.current = requestAnimationFrame(scan);
          return;
        }

        // Ambil landmarks jika dibutuhkan (saat challenge aktif)
        const needsLandmarks = challengeState !== "idle";
        const landmarks = needsLandmarks
          ? detection.landmarks?.positions || detection.landmarks
          : null;

        if (needsLandmarks && (!landmarks || landmarks.length < 68)) {
          if (challengeState === "idle" && frameCount % 15 === 0) {
            setStatus("Landmarks tidak lengkap. Gerakkan wajah sedikit.");
          }
          animationRef.current = requestAnimationFrame(scan);
          return;
        }

        // STATE: IDLE (Menunggu wajah masuk frame)
        if (challengeState === "idle") {
          const box = detection?.detection?.box ?? detection?.box;
          if (!box) {
            animationRef.current = requestAnimationFrame(scan);
            return;
          }

          const centered = isFaceCentered(box, video, 0.3);
          if (!centered) {
            resetCountdown();
            resetDetection();
            setStatus("Posisikan wajah di tengah lingkaran.");
            animationRef.current = requestAnimationFrame(scan);
            return;
          }

          // Wajah sudah pas → mulai countdown
          if (!countdownStartedRef.current) {
            startCountdown();
          }
          animationRef.current = requestAnimationFrame(scan);
          return;
        }

        // STATE: CHALLENGE AKTIF
        // Semua logic challenge sekarang diproses oleh useChallengeManager
        const result = processChallengeFrame({
          landmarks,
          videoElement: videoRef.current,
          detectionBox: detection?.detection?.box ?? detection?.box,
        });

        // Update status UI jika challenge manager memberikan pesan
        if (result.status) {
          setStatus(result.status);
        }

        // Jika challenge sudah selesai, lanjut ke frame berikutnya
        if (result.shouldComplete) {
          animationRef.current = requestAnimationFrame(scan);
          return;
        }
      } catch (error) {
        if (challengeState === "idle" && frameCount % 30 === 0) {
          setStatus(`Deteksi bermasalah. Error: ${error.message}`);
        }
      }

      animationRef.current = requestAnimationFrame(scan);
    };

    scan();
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [
    step,
    challengeState,
    resetDetection,
    resetCountdown,
    startCountdown,
    processChallengeFrame,
  ]);

  // EFFECTS: INIT & CLEANUP
  useEffect(() => {
    const initialize = async () => {
      try {
        setStatus("Memuat sistem...");
        await loadFaceModels();
        setModelsLoaded(true);
        setStatus("Menyiapkan kamera...");
        await startCamera();
        setCameraReady(true);
        setStatus("Posisikan wajah di dalam lingkaran...");
      } catch (error) {
        console.error("Initialization error:", error);
        setStatus(`Gagal memuat sistem: ${error.message}`);
      }
    };
    initialize();
    return () => stopCamera();
  }, []);

  useEffect(() => {
    if (cameraReady && step === 1) {
      const cleanup = startScanning();
      return () => cleanup?.();
    }
  }, [cameraReady, step, startScanning]);

  useEffect(() => {
    return () => {
      stopCamera();
      stopBufferPolling();
    };
  }, [stopCamera, stopBufferPolling]);

  // ACTIONS: USER INTERACTION
  const handleContinue = useCallback(() => {
    stopCamera();
    if (onAttendanceSuccess) onAttendanceSuccess(attendanceData);
    navigate("/pegawai/dashboard", { replace: true });
  }, [attendanceData, onAttendanceSuccess, navigate, stopCamera]);

  const handleRetry = useCallback(() => {
    stopCamera();
    stopBufferPolling();

    // Reset semua state ke awal
    setStep(1);
    setFaceDetected(false);
    setShowInstructions(true);
    setAttendanceData(null);
    setCameraReady(false);
    setStatus("Menyiapkan kamera...");

    // Reset challenge via manager
    resetChallenge();

    // Restart kamera
    startCamera()
      .then(() => {
        setCameraReady(true);
        setStatus("Posisikan wajah Anda...");
      })
      .catch((err) => {
        console.error("Failed to restart camera:", err);
        setStatus("Gagal mengakses kamera. Periksa izin & coba lagi.");
      });
  }, [stopCamera, stopBufferPolling, startCamera, resetChallenge]);

  // RETURN VALUES
  return {
    refs: { videoRef },
    state: {
      step,
      status,
      modelsLoaded,
      cameraReady,
      countdown,
      attendanceData,
      challengeState,
      challengeInstruction,
      challengeProgress,
      faceDetected,
      showInstructions,
      locationBufferCount,
    },
    actions: { handleContinue, handleRetry, setStatus },
    shiftInfo,
  };
};
