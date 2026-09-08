const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const {
  verifyToken,
  adminOnly,
  pegawaiOnly,
} = require("../middleware/authMiddleware");

// login
router.post("/login", authController.login);

// Lupa password
router.post("/lupa-password", authController.lupaPassword);

// Verifikasi OTP
router.post("/verifikasi-otp", authController.verifikasiOTP);

// Reset password
router.post("/reset-password", authController.resetPassword);

// dashboard admin
router.get("/dashboard", verifyToken, adminOnly, (req, res) => {
  res.json({ message: "Dashboard admin" });
});

// dashboard pegawai
router.get("/pegawai/dashboard", verifyToken, pegawaiOnly, (req, res) => {
  res.json({ message: "Dashboard pegawai" });
});

module.exports = router;
