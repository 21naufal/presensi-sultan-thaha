// Helper functions untuk deteksi respon wajah (backend validasi)

// Menghitung Mouth Aspect Ratio (MAR) untuk mendeteksi bukaan mulut
const calculateMAR = (landmarks) => {
  try {
    const p48 = landmarks[48];
    const p54 = landmarks[54];
    const p51 = landmarks[51];
    const p57 = landmarks[57];
    const p52 = landmarks[52];
    const p56 = landmarks[56];
    const p53 = landmarks[53];
    const p55 = landmarks[55];

    const vertical1 = Math.hypot(p51.x - p57.x, p51.y - p57.y);
    const vertical2 = Math.hypot(p52.x - p56.x, p52.y - p56.y);
    const vertical3 = Math.hypot(p53.x - p55.x, p53.y - p55.y);
    const horizontal = Math.hypot(p48.x - p54.x, p48.y - p54.y);

    if (horizontal === 0) return 0;

    return (vertical1 + vertical2 + vertical3) / (3.0 * horizontal);
  } catch (e) {
    return 0;
  }
};

// Mengecek apakah mulut terbuka berdasarkan threshold MAR
const isMouthOpen = (landmarks, threshold = 0.4) => {
  try {
    if (!Array.isArray(landmarks)) return false;
    if (landmarks.length < 68) return false;

    const mar = calculateMAR(landmarks);
    return mar > threshold;
  } catch (e) {
    return false;
  }
};

// Menghitung Eye Aspect Ratio (EAR) untuk mendeteksi bukaan mata
const calculateEAR = (landmarks) => {
  try {
    if (!Array.isArray(landmarks) || landmarks.length < 68) return 0.3;

    const getEyeEAR = (
      outer,
      topOuter,
      topInner,
      inner,
      bottomInner,
      bottomOuter,
    ) => {
      const v1 = Math.hypot(
        landmarks[topOuter].x - landmarks[bottomOuter].x,
        landmarks[topOuter].y - landmarks[bottomOuter].y,
      );
      const v2 = Math.hypot(
        landmarks[topInner].x - landmarks[bottomInner].x,
        landmarks[topInner].y - landmarks[bottomInner].y,
      );
      const h = Math.hypot(
        landmarks[outer].x - landmarks[inner].x,
        landmarks[outer].y - landmarks[inner].y,
      );
      if (h === 0) return 0;
      return (v1 + v2) / (2.0 * h);
    };

    const leftEAR = getEyeEAR(36, 37, 38, 39, 41, 40);
    const rightEAR = getEyeEAR(42, 43, 44, 45, 47, 46);
    return (leftEAR + rightEAR) / 2.0;
  } catch (e) {
    return 0.3;
  }
};

// Mengecek apakah mata terbuka berdasarkan threshold EAR
const isEyesOpen = (landmarks, threshold = 0.22) => {
  return calculateEAR(landmarks) > threshold;
};

// Validasi apakah kedipan mata terjadi secara natural (bukan manipulasi)
const isBlinkValid = (landmarks, proof, dropThreshold = 0.02) => {
  try {
    if (!Array.isArray(landmarks) || landmarks.length < 68) {
      return false;
    }

    const currentEAR = calculateEAR(landmarks);
    if (currentEAR > 1.0 || currentEAR < 0) return false;

    if (currentEAR < 0.15) {
      return false;
    }

    if (!proof || proof.minEAR === undefined || proof.maxEAR === undefined) {
      return false;
    }

    if (proof.maxEAR < 0.15) {
      return false;
    }

    const dropRatio = (proof.maxEAR - proof.minEAR) / proof.maxEAR;
    if (dropRatio < dropThreshold) {
      return false;
    }

    return true;
  } catch (e) {
    return false;
  }
};

module.exports = {
  calculateMAR,
  isMouthOpen,
  calculateEAR,
  isEyesOpen,
  isBlinkValid,
};
