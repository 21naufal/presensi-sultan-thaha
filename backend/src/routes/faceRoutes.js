const express = require("express");
const router = express.Router();

const { verifyToken, pegawaiOnly } = require("../middleware/authMiddleware");

const { faceLimiter } = require("../middleware/rateLimiter");

const faceController = require("../controllers/faceController");

// Semua route di bawah ini wajib pegawai
router.use(verifyToken, pegawaiOnly);

router.post("/register", verifyToken, faceController.registerFace);
router.get("/me", verifyToken, faceController.getFaceByUserId);
router.post("/verify", verifyToken, faceController.verifyFace);
router.post("/validate-location", verifyToken, faceController.validateLocation);

module.exports = router;
