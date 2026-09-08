const express = require("express");
const router = express.Router();
const pegawaiJadwalController = require("../controllers/pegawaiJadwalController");
const { verifyToken, pegawaiOnly } = require("../middleware/authMiddleware");

// Semua route wajib login sebagai pegawai
router.use(verifyToken, pegawaiOnly);

// GET Jadwal Bulanan
router.get("/:year/:month", pegawaiJadwalController.getJadwalBulanan);

module.exports = router;
