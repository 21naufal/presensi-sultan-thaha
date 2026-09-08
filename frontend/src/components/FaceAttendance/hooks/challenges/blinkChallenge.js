// Logic challenge "Kedip Mata"
import { isHeadForward } from "../../utils/challengeHelpers";

export const BLINK_CHALLENGE_STATES = {
  CALIBRATE: "CALIBRATE",
  WAIT_BLINK: "WAIT_BLINK",
  WAIT_OPEN_AGAIN: "WAIT_OPEN_AGAIN",
  COMPLETED: "COMPLETED",
};

export const createBlinkChallengeState = () => ({
  state: BLINK_CHALLENGE_STATES.CALIBRATE,
  baselineEARSamples: [],
  baselineEAR: 0,
  blinkWindow: [],
  openWindow: [],
  minEAR: 1.0,
  maxEAR: 0,
  blinkDetected: false,
  progress: 0,
  isDetected: false,
});

export const resetBlinkChallenge = () => ({
  ...createBlinkChallengeState(),
});

const calculateSafeEAR = (landmarks) => {
  try {
    const positions = landmarks?.positions || landmarks;
    if (!positions || positions.length < 68) return null;

    const getEyeEAR = (
      outer,
      topOuter,
      topInner,
      inner,
      bottomInner,
      bottomOuter,
    ) => {
      const v1 = Math.hypot(
        positions[topOuter].x - positions[bottomOuter].x,
        positions[topOuter].y - positions[bottomOuter].y,
      );
      const v2 = Math.hypot(
        positions[topInner].x - positions[bottomInner].x,
        positions[topInner].y - positions[bottomInner].y,
      );
      const h = Math.hypot(
        positions[outer].x - positions[inner].x,
        positions[outer].y - positions[inner].y,
      );
      if (h === 0) return null;
      return (v1 + v2) / (2.0 * h);
    };

    const leftEAR = getEyeEAR(36, 37, 38, 39, 41, 40);
    const rightEAR = getEyeEAR(42, 43, 44, 45, 47, 46);
    if (leftEAR === null || rightEAR === null) return null;

    const avg = (leftEAR + rightEAR) / 2.0;
    if (avg > 1.0 || avg < 0) return null;
    return avg;
  } catch (e) {
    return null;
  }
};

const average = (arr) => {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
};

// OPTIMASI: Cari min/max tanpa spread operator (lebih cepat)
const findMin = (arr) => {
  if (!arr || arr.length === 0) return Infinity;
  let min = arr[0];
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] < min) min = arr[i];
  }
  return min;
};

const findMax = (arr) => {
  if (!arr || arr.length === 0) return -Infinity;
  let max = arr[0];
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] > max) max = arr[i];
  }
  return max;
};

export const processBlinkChallengeFrame = ({
  landmarks,
  currentState,
  frames,
  minCalibrateFrames = 5,
  dropThreshold = 0.02,
  windowSizeBlink = 12,
  windowSizeOpen = 1,
}) => {
  const newState = { ...frames };
  let instruction = "";
  let status = "";
  let shouldComplete = false;

  const ear = calculateSafeEAR(landmarks);

  if (ear === null) {
    return {
      ...newState,
      instruction: "Hadapkan Wajah",
      status: "Deteksi mata tidak jelas",
      shouldComplete: false,
      progress: 0,
    };
  }

  newState.minEAR = Math.min(newState.minEAR, ear);
  newState.maxEAR = Math.max(newState.maxEAR, ear);

  // STATE 1: KALIBRASI
  if (newState.state === BLINK_CHALLENGE_STATES.CALIBRATE) {
    newState.baselineEARSamples = newState.baselineEARSamples || [];
    newState.baselineEARSamples.push(ear);

    instruction = "Buka Mata Lebar";
    status = `Kalibrasi... ${newState.baselineEARSamples.length}/${minCalibrateFrames}`;
    newState.progress = 0;

    if (newState.baselineEARSamples.length >= minCalibrateFrames) {
      newState.baselineEAR = average(newState.baselineEARSamples);
      newState.state = BLINK_CHALLENGE_STATES.WAIT_BLINK;
      newState.blinkWindow = [];
      instruction = "Kedip Sekarang";
      status = "Silakan kedipkan mata Anda";
      newState.progress = 0;
    }
  }

  // STATE 2: TUNGGU KEDIP
  else if (newState.state === BLINK_CHALLENGE_STATES.WAIT_BLINK) {
    newState.blinkWindow = newState.blinkWindow || [];
    newState.blinkWindow.push(ear);
    if (newState.blinkWindow.length > windowSizeBlink) {
      newState.blinkWindow.shift();
    }

    // OPTIMASI: Pakai findMin custom, bukan Math.min(...array)
    const windowMin = findMin(newState.blinkWindow);
    const baseline = newState.baselineEAR;
    const dropRatio = (baseline - windowMin) / baseline;

    instruction = "Kedip Sekarang";
    newState.progress = 0;

    if (dropRatio >= dropThreshold) {
      newState.blinkDetected = true;
      newState.state = BLINK_CHALLENGE_STATES.WAIT_OPEN_AGAIN;
      newState.openWindow = [];
      instruction = "Berhasil!";
      status = "Kedip terverifikasi";
      newState.progress = 100;
    } else {
      status = "Silakan kedipkan mata Anda";
    }
  }

  // STATE 3: TUNGGU MATA TERBUKA
  else if (newState.state === BLINK_CHALLENGE_STATES.WAIT_OPEN_AGAIN) {
    newState.openWindow = newState.openWindow || [];
    newState.openWindow.push(ear);
    if (newState.openWindow.length > windowSizeOpen) {
      newState.openWindow.shift();
    }

    // OPTIMASI: Pakai findMax custom
    const windowMax = findMax(newState.openWindow);
    const baseline = newState.baselineEAR;

    instruction = "Berhasil!";
    status = "Kedip terverifikasi";
    newState.progress = 100;

    if (windowMax > baseline * 0.95) {
      newState.state = BLINK_CHALLENGE_STATES.COMPLETED;
      newState.isDetected = true;
      shouldComplete = true;
    }
  }

  return { ...newState, instruction, status, shouldComplete };
};
