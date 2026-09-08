const express = require("express");
const router = express.Router();
const jadwalController = require("../controllers/jadwalController");
const { verifyToken, adminOnly } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

router.use(verifyToken, adminOnly);

// manajemen periode
router.get("/periods", jadwalController.getPeriods);
router.post("/periods", jadwalController.createPeriod);
router.put("/periods/:year/:month", jadwalController.regeneratePeriod);
router.put("/periods/:year/:month/rename", jadwalController.replacePeriod);

// unit dalam periode
router.get("/periods/:year/:month/units", jadwalController.getUnitsInPeriod);

// jadwal unit detail
router.get("/units/:unitId/:year/:month", jadwalController.getScheduleMatrix);
router.post("/units/:unitId/:year/:month", jadwalController.bulkSaveSchedule);
router.put("/edit", upload.single("buktiFile"), jadwalController.editSchedule);

// jadwal unit karyawan
router.get(
  "/pegawai/:pegawaiId/:year/:month",
  jadwalController.getPegawaiScheduleDetail,
);
router.get("/riwayat/:jadwalId", jadwalController.getRiwayatPerubahan);

module.exports = router;
