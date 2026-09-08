const express = require("express");
const router = express.Router();
const logController = require("../controllers/logController");
const { verifyToken, adminOnly } = require("../middleware/authMiddleware");

router.use(verifyToken);
router.use(adminOnly);

// Ambil daftar aksi unik (untuk dropdown)
router.get("/actions", logController.getActions);

// Ambil semua log
router.get("/", logController.getAllLogs);

// Ambil log saya sendiri
router.get("/me", logController.getMyLogs);

module.exports = router;
