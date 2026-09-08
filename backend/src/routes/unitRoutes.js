const express = require("express");
const router = express.Router();

const unitController = require("../controllers/unitController");
const { validateUnitInput } = require("../middleware/validationMiddleware");
const { verifyToken, adminOnly } = require("../middleware/authMiddleware");

// semua route dilindungi harus login + role admin
router.use(verifyToken, adminOnly);

// list & Detail
router.get("/", unitController.getUnits);
router.get("/:id", unitController.getUnitById);

// create
router.post("/", validateUnitInput, unitController.createUnit);

// update
router.put("/:id", validateUnitInput, unitController.updateUnit);

// delete
router.delete("/:id", unitController.deleteUnit);

module.exports = router;
