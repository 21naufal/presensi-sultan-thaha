const { success, error, serverError } = require("../utils/responseHelper");
const presensiModel = require("../models/presensiModel");
const db = require("../config/db");
const {
  getWIBDate,
  getWIBTime,
  getWIBDateTime,
} = require("../utils/dateHelper");
const { saveBase64Photo } = require("../utils/photoHelper");
const logModel = require("../models/logModel");

// BAGIAN ADMIN: Laporan & Koreksi
exports.getPegawaiPresensiDetail = async (req, res) => {
  try {
    const { pegawaiId, year, month } = req.params;
    if (!pegawaiId || !year || !month)
      return error(res, "ID Pegawai, Tahun, dan Bulan wajib diisi", 400);

    const result = await presensiModel.getPegawaiPresensiDetail(
      Number(pegawaiId),
      Number(year),
      Number(month),
    );
    return success(res, "Detail presensi berhasil diambil", result);
  } catch (err) {
    if (err.message === "PEGAWAI_NOT_FOUND")
      return error(res, "Pegawai tidak ditemukan", 404);
    console.error("[getPegawaiPresensiDetail] Error:", err);
    return serverError(res, err, "getPegawaiPresensiDetail");
  }
};

exports.getUnitPresensiMatrix = async (req, res) => {
  try {
    const { unitId, year, month } = req.params;
    if (!unitId || !year || !month)
      return error(res, "Unit ID, Tahun, dan Bulan wajib diisi", 400);

    const result = await presensiModel.getUnitPresensiMatrix(
      Number(unitId),
      Number(year),
      Number(month),
    );
    return success(res, "Matrix presensi berhasil diambil", result);
  } catch (err) {
    console.error("[getUnitPresensiMatrix] Error:", err);
    return serverError(res, err, "getUnitPresensiMatrix");
  }
};

exports.correctAttendance = async (req, res) => {
  try {
    const { jadwalId, statusBaru, keterangan, alasan } = req.body;
    if (!jadwalId || !statusBaru)
      return error(res, "Jadwal ID dan Status Baru wajib diisi", 400);

    let dokumenPath = null;
    if (req.file) dokumenPath = `/uploads/bukti-perubahan/${req.file.filename}`;

    // Ambil data presensi lama untuk log (termasuk keterangan_sistem)
    const [[oldPresensi]] = await db.query(
      `SELECT j.*, p.nama as nama_pegawai, pr.status as presensi_status, pr.keterangan_sistem
       FROM jadwal j
       LEFT JOIN pegawai p ON j.pegawai_id = p.id_pegawai
       LEFT JOIN presensi pr ON j.id_jadwal = pr.jadwal_id
       WHERE j.id_jadwal = ?`,
      [jadwalId],
    );

    await presensiModel.correctAttendance({
      jadwalId,
      statusBaru,
      keterangan,
      alasan,
      dokumen: dokumenPath,
      adminId: req.user.id_user,
    });

    // Helper: Konversi keterangan ke teks yang mudah dibaca
    const formatKeterangan = (ket) => {
      if (ket === "lembur" || ket === "+") return "Lembur";
      if (ket === "melebihi_jam" || ket === "!") return "Melebihi jam kerja";
      if (ket === "tidak_pulang" || ket === "-") return "Tidak absen pulang";
      if (ket === "normal" || ket === null || ket === "") return "Normal";
      return ket || "Normal";
    };

    // Format status + keterangan lama
    const statusLama =
      oldPresensi?.presensi_status || oldPresensi?.status || "-";
    const keteranganLama = formatKeterangan(oldPresensi?.keterangan_sistem);

    // Format status + keterangan baru
    const statusBaruFinal = statusBaru || statusLama;
    const keteranganBaru = formatKeterangan(keterangan);

    // Format tanggal
    const tanggalFormatted = oldPresensi?.tanggal
      ? new Date(oldPresensi.tanggal).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "-";

    // Format message yang lebih deskriptif
    let message = `Koreksi presensi ${oldPresensi?.nama_pegawai || "Pegawai"} pada tanggal ${tanggalFormatted}`;

    // Jika status berubah
    if (statusLama !== statusBaruFinal) {
      message += ` | Status: ${statusLama} jadi ${statusBaruFinal}`;
    }

    // Jika keterangan berubah
    if (keteranganLama !== keteranganBaru) {
      message += ` | Keterangan: ${keteranganLama} jadi ${keteranganBaru}`;
    }

    // Jika tidak ada perubahan (edge case)
    if (statusLama === statusBaruFinal && keteranganLama === keteranganBaru) {
      message += ` | Tidak ada perubahan (hanya alasan: ${alasan || "-"})`;
    }

    // LOG: Koreksi presensi dengan format yang lebih lengkap
    await logModel.create(
      req.user.id_user,
      "KOREKSI_PRESENSI",
      JSON.stringify({
        jadwalId,
        namaPegawai: oldPresensi?.nama_pegawai,
        tanggal: tanggalFormatted,
        statusLama: statusLama,
        keteranganLama: keteranganLama,
        statusBaru: statusBaruFinal,
        keteranganBaru: keteranganBaru,
        alasan: alasan || "-",
        dokumen: dokumenPath,
        message: message,
      }),
    );

    return success(res, "Koreksi kehadiran berhasil disimpan");
  } catch (err) {
    if (err.message === "JADWAL_NOT_FOUND")
      return error(res, "Data jadwal tidak ditemukan", 404);
    console.error("[correctAttendance] Error:", err);
    return serverError(res, err, "correctAttendance");
  }
};

exports.getKoreksiDetail = async (req, res) => {
  try {
    const { jadwalId } = req.params;
    if (!jadwalId) return error(res, "Jadwal ID wajib diisi", 400);

    const result = await presensiModel.getKoreksiDetail(Number(jadwalId));
    return success(res, "Detail koreksi berhasil diambil", result);
  } catch (err) {
    if (err.message === "JADWAL_NOT_FOUND")
      return error(res, "Data jadwal tidak ditemukan", 404);
    console.error("[getKoreksiDetail] Error:", err);
    return serverError(res, err, "getKoreksiDetail");
  }
};

// BAGIAN PEGAWAI: Check-in & Check-out
exports.recordAttendance = async (req, res) => {
  try {
    const { tipe, latitude, longitude, foto, waktuWIB } = req.body;
    const pegawaiId = req.user.pegawai_id;

    if (!tipe) return error(res, "Tipe (masuk/pulang) wajib diisi", 400);
    if (!["masuk", "pulang"].includes(tipe))
      return error(res, "Tipe harus 'masuk' atau 'pulang'", 400);

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return error(res, "Data lokasi tidak valid", 400);
    }

    const today = getWIBDate();
    const currentTime = getWIBTime();
    const now = waktuWIB ? new Date(waktuWIB) : new Date();

    let [[jadwal]] = await db.query(
      `SELECT j.id_jadwal, j.status, j.tanggal, s.jam_mulai, s.jam_selesai
       FROM jadwal j 
       LEFT JOIN shift s ON j.shift_id = s.id_shift
       WHERE j.pegawai_id = ? AND DATE(j.tanggal) = DATE(?)`,
      [pegawaiId, today],
    );

    let isNightShift = false;
    if (!jadwal && tipe === "pulang") {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = getWIBDate(yesterday);

      [[jadwal]] = await db.query(
        `SELECT j.id_jadwal, j.status, j.tanggal, s.jam_mulai, s.jam_selesai
         FROM jadwal j 
         LEFT JOIN shift s ON j.shift_id = s.id_shift
         WHERE j.pegawai_id = ? 
         AND DATE(j.tanggal) = DATE(?)
         AND s.jam_selesai < s.jam_mulai`,
        [pegawaiId, yesterdayStr],
      );

      if (jadwal) isNightShift = true;
    }

    if (!jadwal)
      return error(res, "Anda tidak memiliki jadwal untuk hari ini", 400);

    if (jadwal.status !== "shift")
      return error(
        res,
        `Status jadwal hari ini adalah ${jadwal.status}, presensi tidak dapat dilakukan.`,
        400,
      );

    const [[lokasiUnit]] = await db.query(
      `SELECT l.latitude, l.longitude, l.radius, l.nama_lokasi, u.nama_unit
       FROM pegawai p
       JOIN unit u ON p.unit_id = u.id_unit
       JOIN lokasi l ON u.lokasi_id = l.id_lokasi
       WHERE p.id_pegawai = ?`,
      [pegawaiId],
    );

    if (!lokasiUnit) {
      return error(res, "Lokasi unit kerja tidak ditemukan", 400);
    }

    const { calculateDistance } = require("../utils/locationHelpers");
    const jarakKeUnit = calculateDistance(
      latitude,
      longitude,
      parseFloat(lokasiUnit.latitude),
      parseFloat(lokasiUnit.longitude),
    );

    if (jarakKeUnit > lokasiUnit.radius) {
      return error(
        res,
        `Anda berada di luar area presensi ${lokasiUnit.nama_unit}. Jarak Anda: ${Math.round(jarakKeUnit)} meter (maksimum ${lokasiUnit.radius} meter).`,
        400,
      );
    }

    console.log(
      `[RECORD] ${tipe} - User di ${lokasiUnit.nama_unit}, jarak: ${Math.round(jarakKeUnit)}m / ${lokasiUnit.radius}m`,
    );

    const { jam_mulai, jam_selesai } = jadwal;

    if (tipe === "masuk") {
      const [startHour, startMin, startSec] = jam_mulai.split(":").map(Number);
      let checkInHour = startHour - 1;
      if (checkInHour < 0) checkInHour = 23;

      const checkInOpenTime = `${String(checkInHour).padStart(2, "0")}:${String(startMin).padStart(2, "0")}:${String(startSec || 0).padStart(2, "0")}`;

      if (currentTime < checkInOpenTime) {
        return error(
          res,
          `Presensi masuk baru dibuka pukul ${checkInOpenTime.substring(0, 5)} WIB`,
          400,
        );
      }

      const [[existingPresensi]] = await db.query(
        `SELECT jam_masuk FROM presensi WHERE jadwal_id = ?`,
        [jadwal.id_jadwal],
      );

      if (existingPresensi?.jam_masuk) {
        return error(res, "Anda sudah melakukan check-in hari ini", 400);
      }
    }

    if (tipe === "pulang") {
      const [[existingPresensi]] = await db.query(
        `SELECT jam_masuk, jam_keluar FROM presensi WHERE jadwal_id = ?`,
        [jadwal.id_jadwal],
      );

      if (!existingPresensi?.jam_masuk) {
        return error(
          res,
          "Anda belum melakukan check-in, tidak bisa check-out",
          400,
        );
      }

      if (existingPresensi.jam_keluar) {
        return error(res, "Anda sudah melakukan check-out hari ini", 400);
      }

      if (currentTime < jam_selesai) {
        return error(
          res,
          `Presensi pulang baru dibuka pukul ${jam_selesai.substring(0, 5)} WIB. Saat ini baru ${currentTime.substring(0, 5)} WIB.`,
          400,
        );
      }

      // Ambil jadwal besok untuk hitung batas check-out
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = getWIBDate(tomorrow);

      const [[jadwalBesok]] = await db.query(
        `SELECT s.jam_mulai
         FROM jadwal j 
         LEFT JOIN shift s ON j.shift_id = s.id_shift
         WHERE j.pegawai_id = ? AND DATE(j.tanggal) = DATE(?) AND j.status = 'shift'`,
        [pegawaiId, tomorrowStr],
      );

      let batasCheckOutStr = null;
      let lewatBatas = false;

      if (jadwalBesok?.jam_mulai) {
        // Ada shift besok, batas = jam_masuk_besok - 1 jam
        const [besokHour, besokMin] = jadwalBesok.jam_mulai
          .split(":")
          .map(Number);
        let batasHour = besokHour - 1;

        if (batasHour < 0) {
          // Shift besok mulai sebelum jam 01:00, batas di hari ini jam 23:xx
          batasHour = 23;
          batasCheckOutStr = `${String(batasHour).padStart(2, "0")}:${String(besokMin).padStart(2, "0")}:00`;
          lewatBatas = currentTime > batasCheckOutStr;
        } else {
          // Shift besok mulai setelah jam 01:00, batas di hari besok
          batasCheckOutStr = `${String(batasHour).padStart(2, "0")}:${String(besokMin).padStart(2, "0")}:00`;
          lewatBatas = false; // Akan divalidasi lebih ketat di model
        }
      } else {
        // Tidak ada shift besok, fallback +12 jam dari jam_selesai
        const [endHour, endMin] = jam_selesai.split(":").map(Number);
        const maxCheckOutHour = endHour + 12;
        const maxCheckOutStr = `${String(maxCheckOutHour % 24).padStart(2, "0")}:${String(endMin).padStart(2, "0")}:00`;

        if (maxCheckOutHour < 24) {
          lewatBatas = currentTime > maxCheckOutStr;
        } else {
          lewatBatas = false;
        }
      }

      if (lewatBatas) {
        return error(
          res,
          `Batas waktu check-out telah terlewat. Silakan hubungi admin jika ada kendala.`,
          400,
        );
      }
    }

    let statusPresensi = "hadir";
    let isLate = false;

    if (tipe === "masuk") {
      const statusResult = await presensiModel.calculateAttendanceStatus(
        pegawaiId,
        jadwal.tanggal,
        now,
      );
      statusPresensi = statusResult.status;
      console.log(`[recordAttendance] CHECK-IN: status=${statusPresensi}`);
    } else if (tipe === "pulang") {
      isLate = false;
      console.log(
        `[recordAttendance] CHECK-OUT: jam_selesai=${jam_selesai}, isLate akan dihitung di model`,
      );
    }

    let fotoPath = null;
    if (foto) {
      const prefix = tipe === "masuk" ? "masuk" : "keluar";
      fotoPath = await saveBase64Photo(foto, prefix, pegawaiId);

      if (!fotoPath) {
        console.warn("Foto gagal disimpan, lanjut tanpa foto");
      } else {
        console.log(`Foto ${tipe} tersimpan:`, fotoPath);
      }
    }

    const result = await presensiModel.recordAttendance({
      pegawaiId,
      jadwalId: jadwal.id_jadwal,
      tanggal: jadwal.tanggal,
      tipe,
      jam: now,
      latitude,
      longitude,
      foto: fotoPath,
      isLate,
      statusPresensi,
      jam_selesai: jam_selesai,
    });

    const pesan =
      tipe === "masuk"
        ? "Check-in berhasil disimpan"
        : "Check-out berhasil disimpan";
    const waktu = now.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    });

    return success(res, pesan, {
      tipe: result.tipe,
      waktu,
      isNightShift,
      isLate,
      statusPresensi,
      fotoUrl: fotoPath ? `${process.env.APP_URL || ""}${fotoPath}` : null,
    });
  } catch (err) {
    if (err.message === "SUDAH_CHECK_IN")
      return error(res, "Anda sudah melakukan check-in hari ini", 400);
    if (err.message === "SUDAH_CHECK_OUT")
      return error(res, "Anda sudah melakukan check-out hari ini", 400);
    if (err.message === "BELUM_CHECK_IN")
      return error(
        res,
        "Anda belum melakukan check-in, tidak bisa check-out",
        400,
      );

    console.error("[recordAttendance] Error:", err);
    return serverError(res, err, "recordAttendance");
  }
};

// BAGIAN PEGAWAI: Status Presensi Hari Ini
exports.getTodayAttendanceStatus = async (req, res) => {
  try {
    const pegawaiId = req.user.pegawai_id;
    const today = getWIBDate();
    const currentTime = getWIBTime();
    const now = new Date();

    let [[jadwal]] = await db.query(
      `SELECT j.id_jadwal, j.status, j.tanggal, 
              s.jam_mulai, s.jam_selesai, s.nama_shift,
              u.nama_unit,
              l.nama_lokasi, l.latitude, l.longitude, l.radius
       FROM jadwal j 
       LEFT JOIN shift s ON j.shift_id = s.id_shift
       LEFT JOIN pegawai p ON j.pegawai_id = p.id_pegawai
       LEFT JOIN unit u ON p.unit_id = u.id_unit
       LEFT JOIN lokasi l ON u.lokasi_id = l.id_lokasi
       WHERE j.pegawai_id = ? AND DATE(j.tanggal) = DATE(?)`,
      [pegawaiId, today],
    );

    let isNightShiftCheckout = false;
    if (!jadwal) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = getWIBDate(yesterday);

      [[jadwal]] = await db.query(
        `SELECT j.id_jadwal, j.status, j.tanggal, 
                s.jam_mulai, s.jam_selesai, s.nama_shift,
                u.nama_unit,
                l.nama_lokasi, l.latitude, l.longitude, l.radius
         FROM jadwal j 
         LEFT JOIN shift s ON j.shift_id = s.id_shift
         LEFT JOIN pegawai p ON j.pegawai_id = p.id_pegawai
         LEFT JOIN unit u ON p.unit_id = u.id_unit
         LEFT JOIN lokasi l ON u.lokasi_id = l.id_lokasi
         WHERE j.pegawai_id = ? 
         AND DATE(j.tanggal) = DATE(?)
         AND s.jam_selesai < s.jam_mulai`,
        [pegawaiId, yesterdayStr],
      );

      if (jadwal) isNightShiftCheckout = true;
    }

    if (!jadwal || jadwal.status !== "shift") {
      return success(res, "Status presensi hari ini", {
        hasSchedule: false,
        shiftInfo: null,
        hasCheckedIn: false,
        hasCheckedOut: false,
        canCheckIn: false,
        canCheckOut: false,
        canCheckInBesok: false,
        jamMasukBesok: null,
        message: jadwal
          ? `Status jadwal hari ini adalah ${jadwal.status}`
          : "Tidak ada jadwal untuk hari ini",
      });
    }

    const [[presensi]] = await db.query(
      `SELECT jam_masuk, jam_keluar FROM presensi WHERE jadwal_id = ?`,
      [jadwal.id_jadwal],
    );

    const hasCheckedIn = !!presensi?.jam_masuk;
    const hasCheckedOut = !!presensi?.jam_keluar;

    const { jam_mulai, jam_selesai } = jadwal;
    let canCheckIn = false;
    let canCheckOut = false;
    let canCheckInBesok = false;
    let jamMasukBesok = null;

    // Ambil jadwal besok untuk hitung batas check-out
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = getWIBDate(tomorrow);

    const [[jadwalBesok]] = await db.query(
      `SELECT s.jam_mulai
       FROM jadwal j 
       LEFT JOIN shift s ON j.shift_id = s.id_shift
       WHERE j.pegawai_id = ? AND DATE(j.tanggal) = DATE(?) AND j.status = 'shift'`,
      [pegawaiId, tomorrowStr],
    );

    if (jadwalBesok) {
      jamMasukBesok = jadwalBesok.jam_mulai;
    }

    if (!isNightShiftCheckout) {
      // SHIFT NORMAL
      const [startHour, startMin] = jam_mulai.split(":").map(Number);
      const checkInHour = startHour - 1 < 0 ? 23 : startHour - 1;
      const checkInStartStr = `${String(checkInHour).padStart(2, "0")}:${String(startMin).padStart(2, "0")}:00`;

      canCheckIn = !hasCheckedIn && currentTime >= checkInStartStr;

      // VALIDASI CHECK-OUT: Batas = 1 jam sebelum shift besok
      if (hasCheckedIn && !hasCheckedOut) {
        if (currentTime >= jam_selesai) {
          if (jamMasukBesok) {
            // Ada shift besok, batas = jam_masuk_besok - 1 jam
            const [besokHour, besokMin] = jamMasukBesok.split(":").map(Number);
            let batasHour = besokHour - 1;

            if (batasHour < 0) {
              // Shift besok mulai sebelum jam 01:00, batas di hari ini jam 23:xx
              batasHour = 23;
              const batasStr = `${String(batasHour).padStart(2, "0")}:${String(besokMin).padStart(2, "0")}:00`;
              canCheckOut = currentTime <= batasStr;

              // Cek apakah sudah lewat batas untuk tampilkan button check-in besok
              canCheckInBesok = currentTime > batasStr;
            } else {
              // Shift besok mulai setelah jam 01:00, batas di hari besok
              canCheckOut = true;
              canCheckInBesok = false; // Belum lewat batas
            }
          } else {
            // Tidak ada shift besok, fallback +12 jam dari jam_selesai
            const [endHour, endMin] = jam_selesai.split(":").map(Number);
            const maxCheckOutHour = endHour + 12;
            const maxCheckOutStr = `${String(maxCheckOutHour % 24).padStart(2, "0")}:${String(endMin).padStart(2, "0")}:00`;

            if (maxCheckOutHour < 24) {
              canCheckOut = currentTime <= maxCheckOutStr;
              canCheckInBesok = currentTime > maxCheckOutStr;
            } else {
              canCheckOut = true;
              canCheckInBesok = false;
            }
          }
        }
      }
    } else {
      // SHIFT MALAM (checkout untuk jadwal kemarin)
      if (hasCheckedIn && !hasCheckedOut) {
        if (currentTime >= jam_selesai) {
          if (jamMasukBesok) {
            const [besokHour, besokMin] = jamMasukBesok.split(":").map(Number);
            let batasHour = besokHour - 1;

            if (batasHour < 0) {
              batasHour = 23;
              const batasStr = `${String(batasHour).padStart(2, "0")}:${String(besokMin).padStart(2, "0")}:00`;
              canCheckOut = currentTime <= batasStr;
              canCheckInBesok = currentTime > batasStr;
            } else {
              canCheckOut = true;
              canCheckInBesok = false;
            }
          } else {
            const [endHour, endMin] = jam_selesai.split(":").map(Number);
            const maxCheckOutHour = endHour + 12;
            const maxCheckOutStr = `${String(maxCheckOutHour % 24).padStart(2, "0")}:${String(endMin).padStart(2, "0")}:00`;

            if (maxCheckOutHour < 24) {
              canCheckOut = currentTime <= maxCheckOutStr;
              canCheckInBesok = currentTime > maxCheckOutStr;
            } else {
              canCheckOut = true;
              canCheckInBesok = false;
            }
          }
        }
      }
      canCheckIn = false;
    }

    return success(res, "Status presensi hari ini", {
      hasSchedule: true,
      shiftInfo: {
        namaShift: jadwal.nama_shift,
        jamMulai: jam_mulai,
        jamSelesai: jam_selesai,
        isNightShift: jam_selesai < jam_mulai,
        tanggalJadwal: jadwal.tanggal,
        namaUnit: jadwal.nama_unit,
        namaLokasi: jadwal.nama_lokasi,
        latitude: jadwal.latitude,
        longitude: jadwal.longitude,
        radius: jadwal.radius,
      },
      hasCheckedIn,
      hasCheckedOut,
      canCheckIn,
      canCheckOut,
      canCheckInBesok, // Field baru untuk check-in besok
      jamMasukBesok, // Field baru untuk jam masuk besok
      isNightShiftCheckout,
      currentTime,
    });
  } catch (err) {
    console.error("[getTodayAttendanceStatus] Error:", err);
    return serverError(res, err, "getTodayAttendanceStatus");
  }
};

// Ambil riwayat presensi pegawai untuk bulan ini
exports.getMonthlyHistory = async (req, res) => {
  try {
    const pegawaiId = req.user.pegawai_id;
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1; // 1-12

    const query = `
      SELECT 
        p.id_presensi,
        p.tanggal,
        p.jam_masuk,
        p.jam_keluar,
        p.status as presensi_status,
        p.is_late,
        j.status as jadwal_status,
        s.nama_shift,
        s.jam_mulai as shift_mulai,
        s.jam_selesai as shift_selesai
      FROM presensi p
      JOIN jadwal j ON p.jadwal_id = j.id_jadwal
      LEFT JOIN shift s ON j.shift_id = s.id_shift
      WHERE p.pegawai_id = ?
      AND YEAR(p.tanggal) = ?
      AND MONTH(p.tanggal) = ?
      ORDER BY p.tanggal DESC, p.jam_masuk DESC
    `;

    const [rows] = await db.query(query, [pegawaiId, year, month]);

    // Format data: pisahkan check-in dan check-out menjadi card terpisah
    const history = [];

    rows.forEach((row) => {
      const tanggal = new Date(row.tanggal).toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      const shiftName = row.nama_shift || "Shift";
      const shiftTime =
        row.shift_mulai && row.shift_selesai
          ? `${row.shift_mulai.substring(0, 5)} - ${row.shift_selesai.substring(0, 5)}`
          : "-";

      // Card untuk Check-In (jika ada)
      if (row.jam_masuk) {
        const jamMasuk = new Date(row.jam_masuk).toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });

        // Cek status untuk masuk terlambat
        let status = "Normal";
        let statusType = "ontime";

        if (row.presensi_status === "terlambat") {
          status = "Terlambat";
          statusType = "late";
        }

        history.push({
          id: `${row.id_presensi}-in`,
          tanggal: row.tanggal,
          tanggalDisplay: tanggal,
          shift: `${shiftName} (${shiftTime})`,
          tipe: "Masuk",
          waktu: jamMasuk,
          status: status,
          statusType: statusType,
          isCheckIn: true,
        });
      }

      // Card untuk Check-Out (jika ada)
      if (row.jam_keluar) {
        const jamKeluar = new Date(row.jam_keluar).toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });

        // Cek is_late untuk pulang terlambat
        let status = "Normal";
        let statusType = "ontime";

        if (row.is_late === 1) {
          status = "Terlambat";
          statusType = "late";
        }

        history.push({
          id: `${row.id_presensi}-out`,
          tanggal: row.tanggal,
          tanggalDisplay: tanggal,
          shift: `${shiftName} (${shiftTime})`,
          tipe: "Keluar",
          waktu: jamKeluar,
          status: status,
          statusType: statusType,
          isCheckIn: false,
        });
      }
    });

    // Urutkan berdasarkan tanggal (terbaru dulu)
    history.sort((a, b) => {
      const dateA = new Date(a.tanggal);
      const dateB = new Date(b.tanggal);
      return dateB - dateA;
    });

    return res.json({
      status: "success",
      message: "Riwayat presensi berhasil diambil",
      data: history,
    });
  } catch (err) {
    console.error("[getMonthlyHistory] Error:", err);
    return res.status(500).json({
      status: "error",
      message: "Gagal mengambil riwayat presensi",
      error: err.message,
    });
  }
};

// Ambil ringkasan presensi bulan ini
exports.getMonthlySummary = async (req, res) => {
  try {
    const pegawaiId = req.user.pegawai_id;
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;

    const query = `
      SELECT 
        COUNT(DISTINCT CASE 
          WHEN p.jam_masuk IS NOT NULL 
          AND p.status != 'terlambat' 
          THEN p.id_presensi 
        END) as total_hadir,
        COUNT(DISTINCT CASE 
          WHEN p.status = 'terlambat' 
          THEN p.id_presensi 
        END) as total_terlambat,
        COUNT(DISTINCT j.id_jadwal) as total_jadwal
      FROM jadwal j
      LEFT JOIN presensi p ON j.id_jadwal = p.jadwal_id
      WHERE j.pegawai_id = ?
      AND YEAR(j.tanggal) = ?
      AND MONTH(j.tanggal) = ?
      AND j.status = 'shift'
    `;

    const [rows] = await db.query(query, [pegawaiId, year, month]);
    const summary = rows[0];

    return res.json({
      status: "success",
      message: "Ringkasan presensi berhasil diambil",
      data: {
        hadir: summary.total_hadir || 0,
        terlambat: summary.total_terlambat || 0,
        tanpaKeterangan:
          (summary.total_jadwal || 0) -
          (summary.total_hadir || 0) -
          (summary.total_terlambat || 0),
      },
    });
  } catch (err) {
    console.error("[getMonthlySummary] Error:", err);
    return res.status(500).json({
      status: "error",
      message: "Gagal mengambil ringkasan presensi",
      error: err.message,
    });
  }
};

// Ambil riwayat presensi detail per bulan (untuk halaman Riwayat)
exports.getRiwayatBulanan = async (req, res) => {
  try {
    const pegawaiId = req.user.pegawai_id;

    // Ambil year dan month dari query
    const today = new Date();
    const year = parseInt(req.query.year) || today.getFullYear();
    const month = parseInt(req.query.month) || today.getMonth() + 1;

    const tanggalBulan = new Date(year, month - 1, 1);
    const monthName = tanggalBulan.toLocaleDateString("id-ID", {
      month: "long",
      year: "numeric",
    });

    // Tambahkan subquery jam_masuk_besok untuk hitung noCheckout
    const query = `
      SELECT
        j.id_jadwal,
        j.tanggal,
        j.status as jadwal_status,
        s.nama_shift,
        s.jam_mulai,
        s.jam_selesai,
        pr.id_presensi,
        pr.jam_masuk,
        pr.jam_keluar,
        pr.status as presensi_status,
        pr.keterangan_sistem,
        pr.is_late,
        pr.is_overtime,
        pr.no_checkout,
        pr.sudah_diedit,
        (SELECT s2.jam_mulai 
         FROM jadwal j2 LEFT JOIN shift s2 ON j2.shift_id = s2.id_shift 
         WHERE j2.pegawai_id = j.pegawai_id 
         AND j2.tanggal = DATE_ADD(j.tanggal, INTERVAL 1 DAY)
         AND j2.status = 'shift'
         LIMIT 1) as jam_masuk_besok
      FROM jadwal j
      LEFT JOIN shift s ON j.shift_id = s.id_shift
      LEFT JOIN presensi pr ON j.id_jadwal = pr.jadwal_id
      WHERE j.pegawai_id = ?
      AND YEAR(j.tanggal) = ?
      AND MONTH(j.tanggal) = ?
      ORDER BY j.tanggal DESC
    `;

    const [rows] = await db.query(query, [pegawaiId, year, month]);

    // Waktu sekarang untuk perhitungan noCheckout otomatis
    const now = new Date();
    const currentDateTime = now.getTime();

    const riwayatList = rows.map((row) => {
      const tanggal = new Date(row.tanggal);

      const tanggalDisplay = tanggal.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      const jamKerja =
        row.jam_mulai && row.jam_selesai
          ? `${row.jam_mulai.substring(0, 5)} - ${row.jam_selesai.substring(0, 5)}`
          : "-";

      const jamMasuk = row.jam_masuk
        ? new Date(row.jam_masuk).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "-";

      const jamPulang = row.jam_keluar
        ? new Date(row.jam_keluar).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "-";

      // LOGIKA: Hitung noCheckout otomatis (1 jam sebelum shift besok)
      let showNoCheckout = false;

      if (row.jam_masuk && !row.jam_keluar && row.jam_masuk_besok) {
        const tanggalJadwal = new Date(row.tanggal);
        const [besokHour, besokMin, besokSec = 0] = row.jam_masuk_besok
          .split(":")
          .map(Number);

        let batasHour = besokHour - 1;
        let batasTanggal = new Date(tanggalJadwal);

        if (batasHour < 0) {
          batasHour = 23;
        } else {
          batasTanggal = new Date(tanggalJadwal);
          batasTanggal.setDate(batasTanggal.getDate() + 1);
        }

        const waktuBatas = new Date(
          batasTanggal.getFullYear(),
          batasTanggal.getMonth(),
          batasTanggal.getDate(),
          batasHour,
          besokMin,
          besokSec,
        );

        if (currentDateTime >= waktuBatas.getTime()) {
          showNoCheckout = true;
        }
      } else if (row.jam_masuk && !row.jam_keluar && !row.jam_masuk_besok) {
        // Fallback: tidak ada shift besok, +12 jam dari jam_selesai
        if (row.jam_selesai) {
          const [endHour, endMin] = row.jam_selesai.split(":").map(Number);
          const tanggalJadwal = new Date(row.tanggal);
          const isNightShift =
            endHour < parseInt(row.jam_mulai?.split(":")[0] || "0");
          const tanggalSelesai = new Date(tanggalJadwal);
          if (isNightShift)
            tanggalSelesai.setDate(tanggalSelesai.getDate() + 1);

          const waktuBatas = new Date(
            tanggalSelesai.getFullYear(),
            tanggalSelesai.getMonth(),
            tanggalSelesai.getDate(),
            endHour + 12,
            endMin,
            0,
          );

          if (currentDateTime >= waktuBatas.getTime()) {
            showNoCheckout = true;
          }
        }
      }

      // Gabungkan: showNoCheckout dari logika waktu ATAU no_checkout dari database
      const finalNoCheckout = showNoCheckout || row.no_checkout === 1;

      // STATUS AKHIR
      let status = "Alpha";
      let statusBadge = "bg-red-500";

      if (row.jadwal_status === "libur") {
        status = "Libur";
        statusBadge = "bg-gray-400";
      } else if (row.jadwal_status === "izin") {
        status = "Izin";
        statusBadge = "bg-blue-500";
      } else if (row.jadwal_status === "cuti") {
        status = "Cuti";
        statusBadge = "bg-green-500";
      } else if (row.presensi_status === "terlambat") {
        status = "Terlambat";
        statusBadge = "bg-yellow-400";
      } else if (row.presensi_status === "hadir") {
        status = "Hadir";
        statusBadge = "bg-green-500";
      }

      // STATUS MASUK
      let statusMasuk = "-";

      if (row.jam_masuk) {
        statusMasuk =
          row.presensi_status === "terlambat" ? "Terlambat" : "Normal";
      }

      // STATUS PULANG
      let statusPulang = "-";

      if (row.jam_keluar) {
        // Cek is_late untuk badge Presensi Pulang
        statusPulang = row.is_late === 1 ? "Terlambat" : "Normal";
      } else if (finalNoCheckout) {
        statusPulang = "Tidak Presensi";
      }

      // KETERANGAN PULANG
      let keteranganPulang = "-";

      // Cek is_overtime untuk info lembur di Status Akhir
      if (row.is_overtime === 1 || row.keterangan_sistem === "+") {
        keteranganPulang = "Lembur";
      } else if (row.keterangan_sistem === "!") {
        keteranganPulang = "Melebihi Jam";
      } else if (row.keterangan_sistem === "-" || finalNoCheckout) {
        keteranganPulang = "Tidak Presensi Pulang";
      } else if (row.jam_keluar) {
        keteranganPulang = "Normal";
      }

      // GABUNGKAN STATUS + KETERANGAN PULANG

      if (status === "Hadir") {
        if (keteranganPulang === "Lembur") {
          status = "Hadir | Lembur";
        } else if (keteranganPulang === "Melebihi Jam") {
          status = "Hadir | Melebihi Jam";
        } else if (keteranganPulang === "Tidak Presensi Pulang") {
          status = "Hadir | Tidak Presensi Pulang";
        }
      }

      if (status === "Terlambat") {
        if (keteranganPulang === "Lembur") {
          status = "Terlambat | Lembur";
        } else if (keteranganPulang === "Melebihi Jam") {
          status = "Terlambat | Melebihi Jam";
        } else if (keteranganPulang === "Tidak Presensi Pulang") {
          status = "Terlambat | Tidak Presensi Pulang";
        }
      }

      return {
        tanggal: row.tanggal,
        tanggalDisplay,
        shift: row.nama_shift || "-",
        jamKerja,
        jamMasuk,
        jamPulang,
        statusMasuk,
        statusPulang,
        status,
        statusBadge,
        jadwalId: row.id_jadwal,
      };
    });

    return res.json({
      status: "success",
      message: "Riwayat presensi berhasil diambil",
      data: {
        year,
        month,
        monthName,
        riwayat: riwayatList,
      },
    });
  } catch (err) {
    console.error("[getRiwayatBulanan] Error:", err);
    return res.status(500).json({
      status: "error",
      message: "Gagal mengambil riwayat presensi",
      error: err.message,
    });
  }
};
