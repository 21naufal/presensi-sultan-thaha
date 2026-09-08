const express = require("express");
const router = express.Router();
const presensiController = require("../controllers/presensiController");
const { verifyToken, pegawaiOnly } = require("../middleware/authMiddleware");

// Semua route di bawah ini wajib pegawai
router.use(verifyToken, pegawaiOnly);

// GET Status Presensi Hari Ini
router.get("/status", presensiController.getTodayAttendanceStatus);

// POST Record Attendance (Check-in & Check-out)
router.post("/record", presensiController.recordAttendance);

// GET Riwayat Presensi Bulanan
router.get("/pegawai/history", presensiController.getMonthlyHistory);

// GET Ringkasan Presensi Bulanan
router.get("/pegawai/summary", presensiController.getMonthlySummary);

// GET Riwayat Presensi Detail (List view - halaman riwayat)
router.get("/pegawai/riwayat", presensiController.getRiwayatBulanan);

module.exports = router;
