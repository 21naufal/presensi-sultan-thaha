const express = require("express");
const router = express.Router();

const shiftController = require("../controllers/shiftController");
const { verifyToken, adminOnly } = require("../middleware/authMiddleware");

// semua route dilindungi harus login + role admin
router.use(verifyToken, adminOnly);

// SHIFT UTAMA
// list semua shift
router.get("/shifts", shiftController.getShifts);
// detail shift by ID
router.get("/shifts/:id", shiftController.getShiftById);
// tambah shift baru
router.post("/shifts", shiftController.createShift);
// update shift
router.put("/shifts/:id", shiftController.updateShift);
// hapus shift
router.delete("/shifts/:id", shiftController.deleteShift);

// SHIFT UNIT (RELASI)
// shift yang aktif di unit tertentu atau semua shift_unit
router.get("/shift-units", shiftController.getShiftsByUnit);
// link shift ke unit
router.post("/shift-units", shiftController.createShiftUnit);
// unlink shift dari unit
router.delete("/shift-units/:shiftId/:unitId", shiftController.deleteShiftUnit);

module.exports = router;
