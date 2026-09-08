const { success, error, serverError } = require("../utils/responseHelper");
const unitModel = require("../models/unitModel");
const logModel = require("../models/logModel");

// ambil list semua unit
exports.getUnits = async (req, res) => {
  try {
    const searchQuery = req.query.search || "";
    const units = await unitModel.getAllUnits(searchQuery);

    return success(res, "Data unit berhasil diambil", units);
  } catch (err) {
    return serverError(res, err, "getUnits");
  }
};

// ambil detail unit
exports.getUnitById = async (req, res) => {
  try {
    const { id } = req.params;
    const unit = await unitModel.getUnitById(id);

    if (!unit) {
      return error(res, "Unit tidak ditemukan", 404);
    }

    return success(res, "Data unit berhasil diambil", unit);
  } catch (err) {
    return serverError(res, err, "getUnitById");
  }
};

// tambah unit baru
exports.createUnit = async (req, res) => {
  try {
    const { namaUnit, lokasiUnit, latitude, longitude, radius } = req.body;

    // cek duplikat nama unit
    const existing = await unitModel.getAllUnits(namaUnit);
    if (
      existing.some((u) => u.namaUnit.toLowerCase() === namaUnit.toLowerCase())
    ) {
      return error(res, "Nama unit sudah terdaftar", 409);
    }

    const newData = await unitModel.createUnit(
      { nama_unit: namaUnit },
      { nama_lokasi: lokasiUnit, latitude, longitude, radius },
    );

    // LOG: Create unit
    await logModel.create(
      req.user.id_user,
      "CREATE_UNIT",
      JSON.stringify({
        namaUnit,
        lokasiUnit,
        latitude,
        longitude,
        radius,
        message: "Unit berhasil ditambahkan",
      }),
    );

    return success(res, "Unit berhasil ditambahkan", newData, 201);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return error(res, "Nama unit sudah terdaftar", 409);
    }
    return serverError(res, err, "createUnit");
  }
};

// update unit
exports.updateUnit = async (req, res) => {
  try {
    const { id } = req.params;
    const { namaUnit, lokasiUnit, latitude, longitude, radius } = req.body;

    // cek apakah unit ada
    const existing = await unitModel.getUnitById(id);
    if (!existing) {
      return error(res, "Unit tidak ditemukan", 404);
    }

    // cek duplikat nama (kecuali nama sendiri)
    if (namaUnit !== existing.namaUnit) {
      const duplicates = await unitModel.getAllUnits(namaUnit);
      if (
        duplicates.some(
          (u) => u.namaUnit.toLowerCase() === namaUnit.toLowerCase(),
        )
      ) {
        return error(res, "Nama unit sudah terdaftar", 409);
      }
    }

    const updatedData = await unitModel.updateUnit(
      id,
      { nama_unit: namaUnit },
      { nama_lokasi: lokasiUnit, latitude, longitude, radius },
    );

    // LOG: Update unit
    await logModel.create(
      req.user.id_user,
      "EDIT_UNIT",
      JSON.stringify({
        id,
        namaUnitLama: existing.namaUnit,
        namaUnitBaru: namaUnit,
        lokasiUnit,
        latitude,
        longitude,
        radius,
        message: "Unit berhasil diperbarui",
      }),
    );

    return success(res, "Unit berhasil diperbarui", updatedData);
  } catch (err) {
    if (err.message === "Unit tidak ditemukan") {
      return error(res, "Unit tidak ditemukan", 404);
    }
    return serverError(res, err, "updateUnit");
  }
};

// hapus unit
exports.deleteUnit = async (req, res) => {
  try {
    const { id } = req.params;

    const unit = await unitModel.getUnitById(id);

    await unitModel.deleteUnit(id);

    await logModel.create(
      req.user.id_user,
      "DELETE_UNIT",
      JSON.stringify({
        id,
        namaUnit: unit?.namaUnit || `Unit ID ${id}`,
        message: "Unit berhasil dihapus",
      }),
    );

    // PERBAIKAN: Ubah 204 → 200 agar response body terkirim
    return success(res, "Unit berhasil dihapus", null, 200);
  } catch (err) {
    if (err.message.includes("masih digunakan")) {
      return error(
        res,
        "Unit tidak dapat dihapus karena masih digunakan di data lain",
        400,
      );
    }
    return serverError(res, err, "deleteUnit");
  }
};
