const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const { verifyToken, adminOnly } = require("../middleware/authMiddleware");

// Semua route dashboard wajib admin
router.use(verifyToken, adminOnly);

// GET /api/dashboard/today - Ambil data dashboard hari ini
router.get("/today", dashboardController.getTodayDashboard);

module.exports = router;
