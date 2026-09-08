// Logic khusus untuk challenge "Buka Mulut"
import { isMouthOpen, isHeadForward } from "../../utils/challengeHelpers";

export const MOUTH_CHALLENGE_STATES = {
  WAIT_CLOSE: "WAIT_CLOSE",
  WAIT_OPEN: "WAIT_OPEN",
  COMPLETED: "COMPLETED",
};

export const createMouthChallengeState = () => ({
  state: MOUTH_CHALLENGE_STATES.WAIT_CLOSE,
  closedFrames: 0,
  openedFrames: 0,
  progress: 0,
  isDetected: false,
});

export const resetMouthChallenge = () => ({
  ...createMouthChallengeState(),
});

export const processMouthChallengeFrame = ({
  landmarks,
  currentState,
  frames,
  minOpenFrames = 10,
  minCloseFrames = 8,
}) => {
  const { state, closedFrames, openedFrames } = frames;
  let newState = { ...frames };
  let instruction = "";
  let status = "";
  let shouldComplete = false;

  if (!isHeadForward(landmarks)) {
    return {
      ...newState,
      closedFrames: 0,
      openedFrames: 0,
      progress: 0,
      instruction: "Luruskan Wajah",
      status: "",
      shouldComplete: false,
    };
  }

  // STATE 1: Tunggu mulut tertutup dulu
  if (state === MOUTH_CHALLENGE_STATES.WAIT_CLOSE) {
    const mouthCurrentlyOpen = isMouthOpen({ positions: landmarks });

    if (!mouthCurrentlyOpen) {
      newState.closedFrames = closedFrames + 1;
      instruction = "Tutup Mulut";

      if (newState.closedFrames >= minCloseFrames) {
        newState.state = MOUTH_CHALLENGE_STATES.WAIT_OPEN;
        newState.openedFrames = 0;
        instruction = "Buka Mulut";
      }
    } else {
      newState.closedFrames = 0;
      instruction = "Tutup Mulut";
    }
  }

  // STATE 2: Tunggu mulut terbuka
  else if (state === MOUTH_CHALLENGE_STATES.WAIT_OPEN) {
    const mouthCurrentlyOpen = isMouthOpen({ positions: landmarks });

    if (!mouthCurrentlyOpen) {
      newState.openedFrames = 0;
      newState.progress = 0;
      instruction = "Buka Mulut";
      return {
        ...newState,
        instruction,
        status: "",
        shouldComplete: false,
      };
    }

    newState.openedFrames = openedFrames + 1;
    newState.progress = Math.min(
      (newState.openedFrames / minOpenFrames) * 100,
      100,
    );
    instruction = "Buka Mulut";

    if (newState.openedFrames >= minOpenFrames) {
      newState.state = MOUTH_CHALLENGE_STATES.COMPLETED;
      newState.isDetected = true;
      shouldComplete = true;
      instruction = "Berhasil!";
    }
  }

  return { ...newState, instruction, status, shouldComplete };
};
