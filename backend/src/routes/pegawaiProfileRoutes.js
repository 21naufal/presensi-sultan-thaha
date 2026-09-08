const express = require("express");
const router = express.Router();
const pegawaiProfileController = require("../controllers/pegawaiProfileController");
const { verifyToken, pegawaiOnly } = require("../middleware/authMiddleware");
const uploadPhoto = require("../middleware/uploadPhoto");

// Semua route wajib login sebagai pegawai
router.use(verifyToken, pegawaiOnly);

// GET Profil
router.get("/profile", pegawaiProfileController.getProfile);

// PUT Ubah Password
router.put("/change-password", pegawaiProfileController.changePassword);

// POST Upload Foto Profil
router.post(
  "/upload-photo",
  uploadPhoto.single("foto"), // Gunakan uploadPhoto
  pegawaiProfileController.uploadPhoto,
);

// DELETE Hapus Foto Profil
router.delete("/photo", pegawaiProfileController.deletePhoto);

module.exports = router;
