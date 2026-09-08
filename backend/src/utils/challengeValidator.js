// Registry Pattern untuk validasi challenge wajah
const { isMouthOpen, isBlinkValid } = require("./challengeHelpers");

// Konstanta tipe challenge yang tersedia
const CHALLENGE_TYPES = {
  MOUTH_OPEN: "mouth",
  BLINK: "blink",
};

// Kamus validator: Memetakan tipe challenge ke fungsi validasinya
const VALIDATORS = {
  [CHALLENGE_TYPES.MOUTH_OPEN]: (landmarks, proof) => {
    return isMouthOpen(landmarks, 0.4);
  },
  [CHALLENGE_TYPES.BLINK]: (landmarks, proof) => {
    // Validasi kedipan dengan threshold penurunan rasio 2%
    return isBlinkValid(landmarks, proof, 0.02);
  },
};

// Fungsi utama untuk memvalidasi challenge berdasarkan tipe yang diberikan
const validateChallenge = (challengeType, landmarks, proof = {}) => {
  // Default ke mouth_open jika tipe tidak diberikan (backward compatibility)
  const type = challengeType || CHALLENGE_TYPES.MOUTH_OPEN;

  const validator = VALIDATORS[type];

  if (!validator) {
    console.warn(`[CHALLENGE] Tipe tidak dikenal: ${type}`);
    return {
      valid: false,
      message: `Tipe challenge "${type}" tidak didukung`,
    };
  }

  const valid = validator(landmarks, proof);

  return {
    valid,
    message: valid ? `Challenge ${type} berhasil` : `Challenge ${type} gagal`,
  };
};

module.exports = {
  CHALLENGE_TYPES,
  validateChallenge,
  VALIDATORS,
};
