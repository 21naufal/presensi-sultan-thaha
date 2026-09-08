// helper functions untuk face detection
export const isFaceCentered = (
  detectionBox,
  videoElement,
  tolerance = 0.25,
) => {
  try {
    const videoWidth = videoElement.videoWidth;
    const videoHeight = videoElement.videoHeight;

    if (!videoWidth || !videoHeight) return false;

    const centerX = videoWidth / 2;
    const centerY = videoHeight / 2;

    const faceCenterX = detectionBox.x + detectionBox.width / 2;
    const faceCenterY = detectionBox.y + detectionBox.height / 2;

    const toleranceX = videoWidth * tolerance;
    const toleranceY = videoHeight * tolerance;

    return (
      Math.abs(faceCenterX - centerX) < toleranceX &&
      Math.abs(faceCenterY - centerY) < toleranceY
    );
  } catch (e) {
    console.warn("isFaceCentered error:", e);
    return false;
  }
};
