// helper functions untuk challenge response detection (frontend realtime)
export const calculateMAR = (landmarks) => {
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

export const isHeadForward = (landmarks) => {
  try {
    const positions = landmarks?.positions || landmarks;

    if (!positions || positions.length < 68) {
      return false;
    }

    const leftEye = positions[36];
    const rightEye = positions[45];
    const nose = positions[30];

    const eyeCenterX = (leftEye.x + rightEye.x) / 2;
    const noseOffset = Math.abs(nose.x - eyeCenterX);
    const eyeDistance = Math.abs(rightEye.x - leftEye.x);

    if (eyeDistance === 0) return false;

    const ratio = noseOffset / eyeDistance;
    return ratio < 0.12;
  } catch (e) {
    return false;
  }
};

export const isMouthOpen = (faceLandmarks) => {
  try {
    const positions = faceLandmarks?.positions || faceLandmarks;

    if (!positions || positions.length < 68) return false;

    const mar = calculateMAR(positions);
    return mar > 0.55;
  } catch (e) {
    return false;
  }
};

export const calculateEAR = (landmarks) => {
  try {
    const positions = landmarks?.positions || landmarks;
    if (!positions || positions.length < 68) return 0.3;

    const getEyeEAR = (
      outer,
      topOuter,
      topInner,
      inner,
      bottomInner,
      bottomOuter,
    ) => {
      const vertical1 = Math.hypot(
        positions[topOuter].x - positions[bottomOuter].x,
        positions[topOuter].y - positions[bottomOuter].y,
      );
      const vertical2 = Math.hypot(
        positions[topInner].x - positions[bottomInner].x,
        positions[topInner].y - positions[bottomInner].y,
      );
      const horizontal = Math.hypot(
        positions[outer].x - positions[inner].x,
        positions[outer].y - positions[inner].y,
      );

      if (horizontal === 0) return 0;
      return (vertical1 + vertical2) / (2.0 * horizontal);
    };

    const leftEAR = getEyeEAR(36, 37, 38, 39, 41, 40);
    const rightEAR = getEyeEAR(42, 43, 44, 45, 47, 46);

    return (leftEAR + rightEAR) / 2.0;
  } catch (e) {
    return 0.3;
  }
};

export const isEyesOpen = (landmarks, threshold = 0.22) => {
  return calculateEAR(landmarks) > threshold;
};

export const isEyesClosed = (landmarks, threshold = 0.02) => {
  return calculateEAR(landmarks) < threshold;
};
