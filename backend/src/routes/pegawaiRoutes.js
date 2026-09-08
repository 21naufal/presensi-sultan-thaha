const express = require("express");
const router = express.Router();

const pegawaiController = require("../controllers/pegawaiController");
const { verifyToken, adminOnly } = require("../middleware/authMiddleware");

// semua route dilindungi harus login + role admin
router.use(verifyToken, adminOnly);

// list unit untuk dropdown
router.get("/units-list", pegawaiController.getUnitList);

// ROUTE PROFIL ADMIN
router.get("/profile", pegawaiController.getAdminProfile);
router.put("/profile", pegawaiController.updateAdminProfile);
router.put("/profile/change-password", pegawaiController.changeAdminPassword);

// routes untuk update nama admin
router.put("/admin/:userId/update-nama", pegawaiController.updateAdminNama);
router.get("/user/:userId", pegawaiController.getUserById);

// list pegawai dengan filter
router.get("/", pegawaiController.getPegawai);

// detail pegawai by ID
router.get("/:id", pegawaiController.getPegawaiById);

// tambah pegawai baru
router.post("/", pegawaiController.createPegawai);

// update pegawai
router.put("/:id", pegawaiController.updatePegawai);

// nonaktifkan pegawai
router.delete("/:id", pegawaiController.deactivatePegawai);

module.exports = router;
