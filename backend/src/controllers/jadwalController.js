const db = require("../config/db");
const { success, error, serverError } = require("../utils/responseHelper");
const jadwalModel = require("../models/jadwalModel");
const unitModel = require("../models/unitModel");
const logModel = require("../models/logModel");

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

// ambil periode
exports.getPeriods = async (req, res) => {
  try {
    const periods = await jadwalModel.getAllPeriods();
    return success(res, "Data periode berhasil diambil", periods);
  } catch (err) {
    return serverError(res, err, "getPeriods");
  }
};

// buat periode
exports.createPeriod = async (req, res) => {
  try {
    const { tahun, bulan } = req.body;
    if (!tahun || !bulan) return error(res, "Tahun dan bulan wajib diisi", 400);

    const year = parseInt(tahun);
    const month = parseInt(bulan);
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return error(res, "Format tahun/bulan tidak valid", 400);
    }

    // cek apakah periode sudah ada
    const existing = await jadwalModel.getAllPeriods();
    if (existing.some((p) => p.tahun === year && p.bulan === month)) {
      return error(
        res,
        `Periode ${MONTH_NAMES[month - 1]} ${year} sudah ada`,
        409,
      );
    }

    const result = await jadwalModel.createPeriod(year, month);

    // LOG: Create periode
    await logModel.create(
      req.user.id_user,
      "CREATE_JADWAL_PERIODE",
      JSON.stringify({
        tahun: year,
        bulan: month,
        namaBulan: MONTH_NAMES[month - 1],
        totalEntries: result.insertedCount,
        message: `Berhasil membuat periode untuk ${result.insertedCount} jadwal`,
      }),
    );

    return success(
      res,
      `Berhasil membuat periode untuk ${result.insertedCount} jadwal`,
      {
        tahun: result.tahun,
        bulan: result.bulan,
        totalEntries: result.insertedCount,
      },
      201,
    );
  } catch (err) {
    if (err.message.includes("Tidak ada pegawai"))
      return error(res, err.message, 400);
    return serverError(res, err, "createPeriod");
  }
};

// ambil unit di dalam periode
exports.getUnitsInPeriod = async (req, res) => {
  try {
    const { year, month } = req.params;
    if (!year || !month) return error(res, "Tahun dan bulan wajib diisi", 400);

    const units = await jadwalModel.getUnitsInPeriod(
      parseInt(year),
      parseInt(month),
    );

    return success(res, "Data unit berhasil diambil", units);
  } catch (err) {
    console.error("[getUnitsInPeriod] Error:", err);
    return serverError(res, err, "getUnitsInPeriod");
  }
};

// ambil unit untuk isi jadwal shift
exports.getScheduleMatrix = async (req, res) => {
  try {
    const { unitId, year, month } = req.params;
    const unit = await unitModel.getUnitById(unitId);
    if (!unit) return error(res, "Unit tidak ditemukan", 404);

    const matrix = await jadwalModel.getScheduleMatrix(
      parseInt(unitId),
      parseInt(year),
      parseInt(month),
    );
    return success(res, "Data matrix jadwal berhasil diambil", {
      unit: { id: unitId, nama: unit.namaUnit },
      period: { year: parseInt(year), month: parseInt(month) },
      ...matrix,
    });
  } catch (err) {
    return serverError(res, err, "getScheduleMatrix");
  }
};

// simpan jadwal secara keseluruhan
exports.bulkSaveSchedule = async (req, res) => {
  try {
    const { unitId, year, month } = req.params;
    const { schedules } = req.body;

    if (!Array.isArray(schedules) || schedules.length === 0) {
      return error(res, "Data jadwal wajib diisi", 400);
    }

    // validasi tanggal sesuai periode
    for (const s of schedules) {
      const d = new Date(s.tanggal);
      if (
        d.getFullYear() !== parseInt(year) ||
        d.getMonth() + 1 !== parseInt(month)
      ) {
        return error(
          res,
          `Tanggal ${s.tanggal} tidak sesuai periode ${month}/${year}`,
          400,
        );
      }
    }

    const result = await jadwalModel.bulkSaveSchedule(
      parseInt(unitId),
      parseInt(year),
      parseInt(month),
      schedules,
    );

    // LOG: Bulk save jadwal
    await logModel.create(
      req.user.id_user,
      "CREATE_JADWAL",
      JSON.stringify({
        unitId,
        tahun: parseInt(year),
        bulan: parseInt(month),
        namaBulan: MONTH_NAMES[parseInt(month) - 1],
        pegawaiCount: schedules.length,
        updatedCount: result.updatedCount,
        message: `Berhasil mengupdate ${result.updatedCount} data jadwal`,
      }),
    );

    return success(
      res,
      `Berhasil mengupdate ${result.updatedCount} data jadwal`,
      { updatedCount: result.updatedCount },
    );
  } catch (err) {
    if (err.message.includes("Shift ID wajib"))
      return error(res, err.message, 400);
    return serverError(res, err, "bulkSaveSchedule");
  }
};

// ambil data jadwal pegawai dalam satu periode
exports.getPegawaiScheduleDetail = async (req, res) => {
  try {
    const { pegawaiId, year, month } = req.params;

    if (!pegawaiId || !year || !month) {
      return error(res, "pegawaiId, tahun dan bulan wajib diisi", 400);
    }

    const result = await jadwalModel.getPegawaiScheduleDetail(
      Number(pegawaiId),
      Number(year),
      Number(month),
    );

    return success(res, "Detail jadwal berhasil diambil", result);
  } catch (err) {
    if (err.message === "PEGAWAI_NOT_FOUND") {
      return error(res, "Pegawai tidak ditemukan", 404);
    }

    return serverError(res, err, "getPegawaiScheduleDetail");
  }
};

// memperbaharui periode
exports.regeneratePeriod = async (req, res) => {
  try {
    const { year, month } = req.params;

    if (!year || !month) {
      return error(res, "Tahun dan bulan wajib diisi", 400);
    }

    const result = await jadwalModel.regeneratePeriod(
      parseInt(year),
      parseInt(month),
    );

    // LOG: Regenerate periode
    await logModel.create(
      req.user.id_user,
      "REGENERATE_JADWAL",
      JSON.stringify({
        tahun: parseInt(year),
        bulan: parseInt(month),
        namaBulan: MONTH_NAMES[parseInt(month) - 1],
        insertedCount: result.insertedCount,
        message: result.message,
      }),
    );

    return success(res, result.message, {
      tahun: result.tahun,
      bulan: result.bulan,
      insertedCount: result.insertedCount,
    });
  } catch (err) {
    if (err.message.includes("Tidak ada pegawai")) {
      return error(res, err.message, 400);
    }
    return serverError(res, err, "regeneratePeriod");
  }
};

// ganti periode lama dengan yang baru
exports.replacePeriod = async (req, res) => {
  try {
    const { year: oldYear, month: oldMonth } = req.params;
    const { newYear, newMonth } = req.body;

    // validasi input
    if (!newYear || !newMonth) {
      return error(res, "Tahun Baru dan Bulan Baru wajib diisi", 400);
    }

    const result = await jadwalModel.replacePeriod(
      parseInt(oldYear),
      parseInt(oldMonth),
      parseInt(newYear),
      parseInt(newMonth),
    );

    // LOG: Replace periode
    await logModel.create(
      req.user.id_user,
      "EDIT_JADWAL_PERIODE",
      JSON.stringify({
        oldYear: parseInt(oldYear),
        oldMonth: parseInt(oldMonth),
        oldMonthName: MONTH_NAMES[parseInt(oldMonth) - 1],
        newYear: parseInt(newYear),
        newMonth: parseInt(newMonth),
        newMonthName: MONTH_NAMES[parseInt(newMonth) - 1],
        deletedCount: result.deletedCount,
        insertedCount: result.insertedCount,
        message: "Periode berhasil diubah",
      }),
    );

    return success(res, "Periode berhasil diubah", {
      oldYear,
      oldMonth,
      newYear,
      newMonth,
      deletedCount: result.deletedCount,
      insertedCount: result.insertedCount,
    });
  } catch (err) {
    // handle error spesifik untuk pesan ke user
    if (
      err.message.includes("sudah ada") ||
      err.message.includes("sudah memiliki jadwal terisi")
    ) {
      return error(res, err.message, 400);
    }
    return serverError(res, err, "replacePeriod");
  }
};

exports.editSchedule = async (req, res) => {
  try {
    const { jadwalId, shiftId, status, alasan } = req.body;

    let parsedShiftId = null;
    if (shiftId && shiftId !== "null" && shiftId !== "") {
      parsedShiftId = Number(shiftId);
      if (isNaN(parsedShiftId)) {
        return error(res, "Shift ID tidak valid", 400);
      }
    }

    let buktiFile = null;
    if (req.file) {
      buktiFile = `/uploads/bukti-perubahan/${req.file.filename}`;
    }

    // Ambil data jadwal lama untuk log
    const [[oldJadwal]] = await db.query(
      `SELECT j.*, p.nama as nama_pegawai, s.kode_shift, s.nama_shift 
       FROM jadwal j 
       LEFT JOIN pegawai p ON j.pegawai_id = p.id_pegawai
       LEFT JOIN shift s ON j.shift_id = s.id_shift 
       WHERE j.id_jadwal = ?`,
      [jadwalId],
    );

    await jadwalModel.editSchedule({
      jadwalId,
      shiftId: parsedShiftId,
      status,
      alasan,
      buktiFile,
      adminId: req.user.id_user,
    });

    // PERBAIKAN: Tambahkan field tanggal dan namaPegawai
    await logModel.create(
      req.user.id_user,
      "EDIT_JADWAL",
      JSON.stringify({
        jadwalId,
        namaPegawai: oldJadwal?.nama_pegawai,
        tanggal: oldJadwal?.tanggal,
        shiftLama: oldJadwal?.kode_shift || oldJadwal?.status,
        shiftBaru: status === "shift" ? parsedShiftId : status,
        statusLama: oldJadwal?.status,
        statusBaru: status,
        alasan,
        message: "Jadwal berhasil diperbarui",
      }),
    );

    return success(res, "Jadwal berhasil diperbarui");
  } catch (err) {
    return serverError(res, err, "editSchedule");
  }
};

// ambil riwayat perubahan
exports.getRiwayatPerubahan = async (req, res) => {
  try {
    const { jadwalId } = req.params;

    if (!jadwalId) {
      return error(res, "Jadwal ID wajib diisi", 400);
    }

    const result = await jadwalModel.getRiwayatPerubahan(Number(jadwalId));

    return success(res, "Riwayat perubahan berhasil diambil", result);
  } catch (err) {
    if (err.message === "JADWAL_NOT_FOUND") {
      return error(res, "Jadwal tidak ditemukan", 404);
    }
    return serverError(res, err, "getRiwayatPerubahan");
  }
};
