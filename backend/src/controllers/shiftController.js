const { success, error, serverError } = require("../utils/responseHelper");
const shiftModel = require("../models/shiftModel");
const unitModel = require("../models/unitModel");
const logModel = require("../models/logModel");

// ambil list semua shift master
exports.getShifts = async (req, res) => {
  try {
    const shifts = await shiftModel.getAllShifts();
    return success(res, "Data shift berhasil diambil", shifts);
  } catch (err) {
    return serverError(res, err, "getShifts");
  }
};

// ambil detail shift
exports.getShiftById = async (req, res) => {
  try {
    const { id } = req.params;
    const shift = await shiftModel.getShiftById(id);

    if (!shift) {
      return error(res, "Shift tidak ditemukan", 404);
    }

    return success(res, "Data shift berhasil diambil", shift);
  } catch (err) {
    return serverError(res, err, "getShiftById");
  }
};

// ambil shift yang aktif di unit tertentu
exports.getShiftsByUnit = async (req, res) => {
  try {
    const { unit_id } = req.query;

    if (!unit_id) {
      // jika tidak ada filter, return semua shift unit
      const shiftUnits = await shiftModel.getAllShiftUnits();
      return success(res, "Data shift unit berhasil diambil", shiftUnits);
    }

    const shifts = await shiftModel.getShiftsByUnit(unit_id);
    return success(res, "Data shift unit berhasil diambil", shifts);
  } catch (err) {
    return serverError(res, err, "getShiftsByUnit");
  }
};

// tambah shift master baru
exports.createShift = async (req, res) => {
  try {
    const { namaShift, kodeShift, jamMulai, jamSelesai } = req.body;

    // validasi required fields
    if (!namaShift || !kodeShift || !jamMulai || !jamSelesai) {
      return error(res, "Semua field wajib diisi", 400);
    }

    // validasi: kode shift unik
    const existingShifts = await shiftModel.getAllShifts();
    if (
      existingShifts.some(
        (s) => s.kodeShift.toLowerCase() === kodeShift.toLowerCase(),
      )
    ) {
      return error(res, "Kode shift sudah terdaftar", 409);
    }

    // validasi format waktu (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(jamMulai) || !timeRegex.test(jamSelesai)) {
      return error(res, "Format waktu harus HH:MM (contoh: 08:00)", 400);
    }

    const newShift = await shiftModel.createShift({
      namaShift,
      kodeShift,
      jamMulai,
      jamSelesai,
    });

    // LOG: Create shift
    await logModel.create(
      req.user.id_user,
      "CREATE_SHIFT",
      JSON.stringify({
        namaShift,
        kodeShift,
        jamMulai,
        jamSelesai,
        message: "Shift berhasil ditambahkan",
      }),
    );

    return success(res, "Shift berhasil ditambahkan", newShift, 201);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return error(res, "Kode shift sudah terdaftar", 409);
    }
    return serverError(res, err, "createShift");
  }
};

// update shift master
exports.updateShift = async (req, res) => {
  try {
    const { id } = req.params;
    const { namaShift, kodeShift, jamMulai, jamSelesai } = req.body;

    // cek apakah shift ada
    const existing = await shiftModel.getShiftById(id);
    if (!existing) {
      return error(res, "Shift tidak ditemukan", 404);
    }

    // validasi kode shift unik (kecuali kode sendiri)
    if (kodeShift !== existing.kodeShift) {
      const allShifts = await shiftModel.getAllShifts();
      if (
        allShifts.some(
          (s) =>
            s.kodeShift.toLowerCase() === kodeShift.toLowerCase() &&
            s.id !== parseInt(id),
        )
      ) {
        return error(res, "Kode shift sudah terdaftar", 409);
      }
    }

    const updatedShift = await shiftModel.updateShift(id, {
      namaShift,
      kodeShift,
      jamMulai,
      jamSelesai,
    });

    // LOG: Update shift
    await logModel.create(
      req.user.id_user,
      "EDIT_SHIFT",
      JSON.stringify({
        id,
        namaShiftLama: existing.namaShift,
        namaShiftBaru: namaShift,
        kodeShiftLama: existing.kodeShift,
        kodeShiftBaru: kodeShift,
        jamMulai,
        jamSelesai,
        message: "Shift berhasil diperbarui",
      }),
    );

    return success(res, "Shift berhasil diperbarui", updatedShift);
  } catch (err) {
    if (err.message === "Shift tidak ditemukan") {
      return error(res, "Shift tidak ditemukan", 404);
    }
    return serverError(res, err, "updateShift");
  }
};

// hapus shift master
exports.deleteShift = async (req, res) => {
  try {
    const { id } = req.params;

    // Ambil data shift sebelum dihapus
    const shift = await shiftModel.getShiftById(id);

    await shiftModel.deleteShift(id);

    // LOG: Delete shift
    await logModel.create(
      req.user.id_user,
      "DELETE_SHIFT",
      JSON.stringify({
        id,
        namaShift: shift?.namaShift || `Shift ID ${id}`,
        kodeShift: shift?.kodeShift,
        message: "Shift berhasil dihapus",
      }),
    );

    return success(res, "Shift berhasil dihapus", null, 204);
  } catch (err) {
    if (err.message.includes("masih digunakan")) {
      return error(
        res,
        "Shift tidak dapat dihapus karena masih digunakan",
        400,
      );
    }
    return serverError(res, err, "deleteShift");
  }
};

// link shift ke unit
exports.createShiftUnit = async (req, res) => {
  try {
    const { shiftId, unitId } = req.body;

    if (!shiftId || !unitId) {
      return error(res, "Shift ID dan Unit ID wajib diisi", 400);
    }

    // cek apakah shift dan unit ada
    const shift = await shiftModel.getShiftById(shiftId);
    if (!shift) {
      return error(res, "Shift tidak ditemukan", 404);
    }

    const unit = await unitModel.getUnitById(unitId);
    if (!unit) {
      return error(res, "Unit tidak ditemukan", 404);
    }

    const result = await shiftModel.createShiftUnit(shiftId, unitId);

    // return data lengkap untuk frontend
    const shiftUnitDetail = await shiftModel.getAllShiftUnits(unitId);
    const newEntry = shiftUnitDetail.find((su) => su.id === result.id);

    // LOG: Link shift ke unit
    await logModel.create(
      req.user.id_user,
      "CREATE_SHIFT_UNIT",
      JSON.stringify({
        shiftId,
        unitId,
        namaShift: shift.namaShift,
        namaUnit: unit.namaUnit,
        message: "Shift berhasil dikaitkan ke unit",
      }),
    );

    return success(res, "Shift berhasil dikaitkan ke unit", newEntry, 201);
  } catch (err) {
    if (err.message.includes("sudah terhubung")) {
      return error(res, "Shift ini sudah terhubung ke unit tersebut", 409);
    }
    return serverError(res, err, "createShiftUnit");
  }
};

// hapus atau unlink shift dari unit
exports.deleteShiftUnit = async (req, res) => {
  try {
    const { shiftId, unitId } = req.params;

    const shift = await shiftModel.getShiftById(shiftId);
    const unit = await unitModel.getUnitById(unitId);

    await shiftModel.deleteShiftUnit(shiftId, unitId);

    await logModel.create(
      req.user.id_user,
      "DELETE_SHIFT_UNIT",
      JSON.stringify({
        shiftId,
        unitId,
        namaShift: shift?.namaShift,
        namaUnit: unit?.namaUnit,
        message: "Shift berhasil dipisahkan dari unit",
      }),
    );

    // PERBAIKAN: Ubah 204 → 200 agar response body terkirim
    return success(res, "Shift berhasil dipisahkan dari unit", null, 200);
  } catch (err) {
    if (err.message.includes("masih digunakan")) {
      return error(
        res,
        "Tidak dapat menghapus: Shift ini masih digunakan dalam jadwal aktif",
        400,
      );
    }
    return serverError(res, err, "deleteShiftUnit");
  }
};
