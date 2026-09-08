const express = require("express");
const router = express.Router();
const presensiController = require("../controllers/presensiController");
const { verifyToken, adminOnly } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

// Semua route di bawah ini wajib admin
router.use(verifyToken, adminOnly);

// GET Detail Presensi per Pegawai
router.get(
  "/detail/admin/:pegawaiId/:year/:month",
  presensiController.getPegawaiPresensiDetail,
);

// GET Matrix Presensi per Unit
router.get(
  "/admin/matrix/:unitId/:year/:month",
  presensiController.getUnitPresensiMatrix,
);

// GET Detail Riwayat Koreksi
router.get(
  "/admin/koreksi-detail/:jadwalId",
  presensiController.getKoreksiDetail,
);

// PUT Koreksi Kehadiran
router.put(
  "/admin/koreksi",
  upload.single("buktiFile"),
  presensiController.correctAttendance,
);

module.exports = router;
