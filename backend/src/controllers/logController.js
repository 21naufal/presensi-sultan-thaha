const logModel = require("../models/logModel");

// Ambil Semua Log
exports.getAllLogs = async (req, res) => {
  try {
    const { startDate, endDate, action, search, limit, page } = req.query;

    const filters = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (action) filters.action = action;
    if (search) filters.search = search;
    if (limit) filters.limit = parseInt(limit);
    if (page) filters.page = parseInt(page);

    // Hitung total data (untuk pagination)
    const total = await logModel.countAll(filters);

    // Ambil data dengan pagination
    const logs = await logModel.getAll(filters);

    const formattedLogs = logs.map((log) => ({
      id: log.id_log,
      waktu: new Date(log.created_at).toLocaleString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      waktuRaw: log.created_at,
      admin: log.admin_name || "Unknown",
      admin_nama: log.admin_nama || log.admin_name || "Unknown",
      aktivitas: log.aksi,
      modul: extractModule(log.aksi),
      deskripsi: exports.formatLogDetail(log.aksi, log.detail),
    }));

    return res.status(200).json({
      status: "success",
      message: "Data aktivitas berhasil diambil",
      data: formattedLogs,
      total: total, // Total keseluruhan (bukan jumlah data di halaman ini)
      page: filters.page || 1,
      limit: filters.limit || 20,
    });
  } catch (err) {
    console.error("[getAllLogs] Error:", err);
    return res.status(500).json({
      status: "error",
      message: "Gagal mengambil data aktivitas",
      error: err.message,
    });
  }
};

// Ambil Daftar Aksi Unik (untuk dropdown)
exports.getActions = async (req, res) => {
  try {
    const actions = await logModel.getDistinctActions();

    // Mapping aksi ke label yang mudah dibaca
    const actionLabels = {
      CREATE_JADWAL: "Buat Jadwal",
      EDIT_JADWAL: "Edit Jadwal",
      EDIT_JADWAL_PERIODE: "Edit Periode Jadwal",
      REGENERATE_JADWAL: "Regenerate Jadwal",
      CREATE_JADWAL_PERIODE: "Buat Periode Jadwal",
      KOREKSI_PRESENSI: "Koreksi Presensi",
      CREATE_PEGAWAI: "Tambah Pegawai",
      EDIT_PEGAWAI: "Edit Pegawai",
      NONAKTIFKAN_PEGAWAI: "Nonaktifkan Pegawai",
      CREATE_UNIT: "Tambah Unit",
      EDIT_UNIT: "Edit Unit",
      DELETE_UNIT: "Hapus Unit",
      CREATE_SHIFT: "Tambah Shift",
      EDIT_SHIFT: "Edit Shift",
      DELETE_SHIFT: "Hapus Shift",
      CREATE_SHIFT_UNIT: "Kaitkan Shift ke Unit",
      DELETE_SHIFT_UNIT: "Pisahkan Shift dari Unit",
      IMPORT_JADWAL: "Import Jadwal",
      EDIT_ADMIN_NAMA: "Edit Nama Admin",
    };

    // Format response: hanya aksi yang benar-benar ada di database
    const formattedActions = actions.map((aksi) => ({
      value: aksi,
      label: actionLabels[aksi] || aksi.replace(/_/g, " "),
    }));

    return res.status(200).json({
      status: "success",
      data: formattedActions,
    });
  } catch (err) {
    console.error("[getActions] Error:", err);
    return res.status(500).json({
      status: "error",
      message: "Gagal mengambil daftar aktivitas",
      error: err.message,
    });
  }
};

// Ambil Log Saya Sendiri
exports.getMyLogs = async (req, res) => {
  try {
    const userId = req.user.id_user;
    const limit = parseInt(req.query.limit) || 50;

    const logs = await logModel.getByUserId(userId, limit);

    const formattedLogs = logs.map((log) => ({
      id: log.id_log,
      waktu: new Date(log.created_at).toLocaleString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      waktuRaw: log.created_at,
      aktivitas: log.aksi,
      deskripsi: log.detail || "-",
    }));

    return res.status(200).json({
      status: "success",
      message: "Data aktivitas Anda berhasil diambil",
      data: formattedLogs,
      total: formattedLogs.length,
    });
  } catch (err) {
    console.error("[getMyLogs] Error:", err);
    return res.status(500).json({
      status: "error",
      message: "Gagal mengambil data aktivitas",
      error: err.message,
    });
  }
};

// Helper: Ekstrak Nama Modul
const extractModule = (action) => {
  const moduleMap = {
    CREATE_JADWAL: "Jadwal",
    EDIT_JADWAL: "Jadwal",
    DELETE_JADWAL: "Jadwal",
    REGENERATE_JADWAL: "Jadwal",
    CREATE_JADWAL_PERIODE: "Jadwal",
    EDIT_JADWAL_PERIODE: "Jadwal",
    KOREKSI_PRESENSI: "Presensi",
    CHECK_IN: "Presensi",
    CHECK_OUT: "Presensi",
    CREATE_PEGAWAI: "Pegawai",
    EDIT_PEGAWAI: "Pegawai",
    DELETE_PEGAWAI: "Pegawai",
    NONAKTIFKAN_PEGAWAI: "Pegawai",
    CREATE_UNIT: "Unit",
    EDIT_UNIT: "Unit",
    DELETE_UNIT: "Unit",
    CREATE_SHIFT: "Shift",
    EDIT_SHIFT: "Shift",
    DELETE_SHIFT: "Shift",
    CREATE_SHIFT_UNIT: "Shift",
    DELETE_SHIFT_UNIT: "Shift",
    IMPORT_JADWAL: "Jadwal",
    EXPORT_JADWAL: "Jadwal",
    EDIT_ADMIN_NAMA: "Profil",
  };

  return moduleMap[action] || "Lainnya";
};

// Helper: Format Detail Log
exports.formatLogDetail = (action, detail) => {
  try {
    const detailData = typeof detail === "string" ? JSON.parse(detail) : detail;

    const templates = {
      CREATE_JADWAL: () =>
        `Membuat jadwal untuk ${detailData.pegawaiCount || 0} pegawai di periode ${detailData.namaBulan || ""} ${detailData.tahun || ""}`,

      // PERBAIKAN: Tambahkan info tanggal jika ada
      // KODE BARU (dengan nama pegawai)
      EDIT_JADWAL: () => {
        const tanggal = detailData.tanggal
          ? new Date(detailData.tanggal).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })
          : "-";
        const namaPegawai = detailData.namaPegawai || "-";
        return `Mengubah jadwal pegawai ${namaPegawai} pada tanggal ${tanggal} dari ${detailData.shiftLama || "-"} menjadi ${detailData.shiftBaru || "-"}`;
      },

      EDIT_JADWAL_PERIODE: () =>
        `Mengubah periode jadwal dari ${detailData.oldMonthName || ""} ${detailData.oldYear || ""} menjadi ${detailData.newMonthName || ""} ${detailData.newYear || ""}`,

      CREATE_JADWAL_PERIODE: () =>
        `Membuat periode jadwal baru untuk ${detailData.namaBulan || ""} ${detailData.tahun || ""} (${detailData.totalEntries || 0} jadwal)`,

      REGENERATE_JADWAL: () =>
        `Menambah placeholder jadwal untuk ${detailData.insertedCount || 0} pegawai baru di periode ${detailData.namaBulan || ""} ${detailData.tahun || ""}`,

      KOREKSI_PRESENSI: () => {
        // Gunakan message yang sudah diformat di controller
        if (detailData.message) {
          return detailData.message;
        }

        // Fallback jika message tidak ada (untuk log lama)
        const tanggal = detailData.tanggal
          ? new Date(detailData.tanggal).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })
          : "-";
        return `Koreksi presensi ${detailData.namaPegawai || "-"} pada tanggal ${tanggal} dari ${detailData.statusLama || "-"} menjadi ${detailData.statusBaru || "-"}`;
      },

      CREATE_PEGAWAI: () =>
        `Menambahkan pegawai baru: ${detailData.nama || "-"} (${detailData.noHp || "-"}) ke ${detailData.unitName || "-"}`,

      EDIT_PEGAWAI: () =>
        `Mengubah data pegawai ${detailData.namaBaru || detailData.nama || "-"} (No. HP: ${detailData.noHpBaru || detailData.noHp || "-"})`,

      NONAKTIFKAN_PEGAWAI: () =>
        `Menonaktifkan pegawai ${detailData.nama || "-"} (${detailData.noHp || "-"})`,

      CREATE_UNIT: () =>
        `Menambahkan unit baru: ${detailData.namaUnit || "-"} di lokasi ${detailData.lokasiUnit || "-"}`,

      EDIT_UNIT: () =>
        `Mengubah unit ${detailData.namaUnitBaru || detailData.namaUnit || "-"} (lokasi: ${detailData.lokasiUnit || "-"})`,

      DELETE_UNIT: () => `Menghapus unit ${detailData.namaUnit || "-"}`,

      CREATE_SHIFT: () =>
        `Menambahkan shift baru: ${detailData.namaShift || "-"} (${detailData.kodeShift || "-"}) jam ${detailData.jamMulai || "-"} - ${detailData.jamSelesai || "-"}`,

      EDIT_SHIFT: () =>
        `Mengubah shift ${detailData.namaShiftBaru || detailData.namaShift || "-"} (${detailData.kodeShiftBaru || detailData.kodeShift || "-"})`,

      DELETE_SHIFT: () => `Menghapus shift ${detailData.namaShift || "-"}`,

      CREATE_SHIFT_UNIT: () =>
        `Mengaitkan shift ${detailData.namaShift || "-"} ke unit ${detailData.namaUnit || "-"}`,

      DELETE_SHIFT_UNIT: () =>
        `Memisahkan shift ${detailData.namaShift || "-"} dari unit ${detailData.namaUnit || "-"}`,

      IMPORT_JADWAL: () =>
        `Import ${detailData.jumlahData || detailData.updatedCount || 0} jadwal dari file Excel untuk periode ${detailData.periode || detailData.namaBulan || ""} ${detailData.tahun || ""}`,

      EDIT_ADMIN_NAMA: () =>
        `Mengubah nama admin dari ${detailData.namaLama || "-"} menjadi ${detailData.namaBaru || "-"}`,
    };

    if (templates[action]) {
      return templates[action]();
    }

    if (detailData && detailData.message) {
      return detailData.message;
    }

    return detail || "-";
  } catch (err) {
    return detail || "-";
  }
};
