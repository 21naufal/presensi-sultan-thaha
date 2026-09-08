import { useState, useRef, useCallback } from "react";
import { CHALLENGE_CONFIG, CHALLENGE_TYPES } from "./challengeConfig";
import {
  processMouthChallengeFrame,
  resetMouthChallenge,
} from "./mouthChallenge";
import {
  processBlinkChallengeFrame,
  resetBlinkChallenge,
} from "./blinkChallenge";

export const useChallengeManager = (onChallengeComplete) => {
  const [challengeState, setChallengeState] = useState("idle");
  const [challengeInstruction, setChallengeInstruction] = useState("");
  const [challengeProgress, setChallengeProgress] = useState(0);

  const challengeDataRef = useRef(null);
  const activeChallengeRef = useRef(null);

  // OPTIMASI: Track previous values untuk hindari setState tidak perlu
  const prevInstructionRef = useRef("");
  const prevProgressRef = useRef(0);

  const startChallenge = useCallback((type) => {
    const config = CHALLENGE_CONFIG[type];
    if (!config) {
      return;
    }

    activeChallengeRef.current = type;

    if (type === CHALLENGE_TYPES.MOUTH_OPEN) {
      challengeDataRef.current = resetMouthChallenge();
    } else if (type === CHALLENGE_TYPES.BLINK) {
      challengeDataRef.current = resetBlinkChallenge();
    }

    setChallengeState(type);
    setChallengeInstruction(config.instruction);
    setChallengeProgress(0);

    prevInstructionRef.current = config.instruction;
    prevProgressRef.current = 0;
  }, []);

  const resetChallenge = useCallback(() => {
    setChallengeState("idle");
    setChallengeInstruction("");
    setChallengeProgress(0);
    challengeDataRef.current = null;
    activeChallengeRef.current = null;
    prevInstructionRef.current = "";
    prevProgressRef.current = 0;
  }, []);

  const getChallengeProof = useCallback(() => {
    const type = activeChallengeRef.current;
    const data = challengeDataRef.current;
    if (!type || !data) return {};

    if (type === CHALLENGE_TYPES.BLINK) {
      return {
        minEAR: data.minEAR,
        maxEAR: data.maxEAR,
        blinkDetected: data.blinkDetected,
      };
    }
    return {};
  }, []);

  const processFrame = useCallback(
    ({ landmarks, videoElement, detectionBox }) => {
      const currentType = activeChallengeRef.current;
      if (!currentType || challengeState === "idle") {
        return { shouldComplete: false, status: "", instruction: "" };
      }

      const config = CHALLENGE_CONFIG[currentType];
      if (!config) return { shouldComplete: false };

      let result = null;

      if (currentType === CHALLENGE_TYPES.MOUTH_OPEN) {
        result = processMouthChallengeFrame({
          landmarks,
          currentState: challengeDataRef.current?.state,
          frames: challengeDataRef.current,
          minOpenFrames: config.minFramesRequired,
        });
      } else if (currentType === CHALLENGE_TYPES.BLINK) {
        result = processBlinkChallengeFrame({
          landmarks,
          currentState: challengeDataRef.current?.state,
          frames: challengeDataRef.current,
        });
      } else {
        return { shouldComplete: false };
      }

      challengeDataRef.current = result;

      // OPTIMASI: Hanya setState jika nilai benar-benar berubah
      if (result.progress !== prevProgressRef.current) {
        setChallengeProgress(result.progress || 0);
        prevProgressRef.current = result.progress || 0;
      }

      if (
        result.instruction &&
        result.instruction !== prevInstructionRef.current
      ) {
        setChallengeInstruction(result.instruction);
        prevInstructionRef.current = result.instruction;
      }

      if (result.shouldComplete) {
        onChallengeComplete?.(landmarks);
      }

      return {
        shouldComplete: result.shouldComplete,
        status: result.status,
        instruction: result.instruction,
      };
    },
    [challengeState, onChallengeComplete],
  );

  return {
    challengeState,
    challengeInstruction,
    challengeProgress,
    startChallenge,
    resetChallenge,
    processFrame,
    getChallengeProof,
    isActive: challengeState !== "idle",
    activeChallengeType: activeChallengeRef.current,
  };
};
