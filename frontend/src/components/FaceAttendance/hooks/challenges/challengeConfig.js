export const CHALLENGE_TYPES = {
  MOUTH_OPEN: "mouth",
  BLINK: "blink",
  // Tambah challenge baru di sini nanti:
  // HEAD_TURN: "head_turn",
  // SMILE: "smile",
};

export const CHALLENGE_CONFIG = {
  [CHALLENGE_TYPES.MOUTH_OPEN]: {
    id: CHALLENGE_TYPES.MOUTH_OPEN,
    instruction: "Tutup Mulut",
    minFramesRequired: 10,
    threshold: 0.55,
    preCondition: "WAIT_CLOSE",
    progressLabel: "Buka mulut Anda",
  },
  [CHALLENGE_TYPES.BLINK]: {
    id: CHALLENGE_TYPES.BLINK,
    instruction: "Buka Mata Lebar",
    minFramesRequired: 5, // kedip = 1 kejadian
    threshold: 0.02, // EAR threshold
    preCondition: "WAIT_OPEN",
    progressLabel: "Kedipkan mata Anda",
  },
};

// DAFTAR CHALLENGE YANG TERSEDIA (untuk random picker)
// Mau tambah challenge baru? Cukup tambah di array ini!
export const AVAILABLE_CHALLENGES = [
  CHALLENGE_TYPES.MOUTH_OPEN,
  CHALLENGE_TYPES.BLINK,
];

// Pilih challenge random
export const getRandomChallenge = () => {
  return AVAILABLE_CHALLENGES[
    Math.floor(Math.random() * AVAILABLE_CHALLENGES.length)
  ];
};

export const DEFAULT_CHALLENGE_SETTINGS = {
  minBufferRequired: 5,
  detectionConfidence: 0.25,
  faceCenterTolerance: 0.25,
};
