const db = require("../config/db");

// BAGIAN ADMIN: Rekap Laporan & Koreksi
// 1. Ambil detail presensi per pegawai (Untuk Halaman DetailPresensiKaryawan)
exports.getPegawaiPresensiDetail = async (pegawaiId, year, month) => {
  // Ambil data dasar pegawai dan unit kerjanya
  const [[pegawai]] = await db.query(
    `SELECT p.id_pegawai, p.nama, p.status as status_pegawai, u.id_unit, u.nama_unit 
     FROM pegawai p LEFT JOIN unit u ON p.unit_id = u.id_unit WHERE p.id_pegawai = ?`,
    [pegawaiId],
  );

  if (!pegawai) throw new Error("PEGAWAI_NOT_FOUND");

  // Ambil data presensi, jadwal, dan subquery untuk mendapatkan jam masuk shift besok
  const [rows] = await db.query(
    `SELECT j.id_jadwal, j.tanggal, j.status as jadwal_status,
            pr.sudah_diedit,
            s.kode_shift, s.nama_shift, s.jam_mulai, s.jam_selesai,
            pr.id_presensi, pr.jam_masuk, pr.jam_keluar, pr.status as presensi_status,
            pr.keterangan_sistem, pr.is_late, pr.is_overtime, pr.no_checkout,
            (SELECT COUNT(*) > 0 FROM koreksi_presensi kp WHERE kp.jadwal_id = j.id_jadwal) as pernah_dikoreksi,
            (SELECT s2.jam_mulai 
             FROM jadwal j2 LEFT JOIN shift s2 ON j2.shift_id = s2.id_shift 
             WHERE j2.pegawai_id = j.pegawai_id 
             AND j2.tanggal = DATE_ADD(j.tanggal, INTERVAL 1 DAY)
             AND j2.status = 'shift'
             LIMIT 1) as jam_masuk_besok
     FROM jadwal j
     LEFT JOIN shift s ON j.shift_id = s.id_shift
     LEFT JOIN presensi pr ON j.id_jadwal = pr.jadwal_id
     WHERE j.pegawai_id = ? AND YEAR(j.tanggal) = ? AND MONTH(j.tanggal) = ?
     ORDER BY j.tanggal ASC`,
    [pegawaiId, year, month],
  );

  const now = new Date();
  const currentDateTime = now.getTime();

  // Format dan mapping data untuk kebutuhan frontend
  const presensiList = rows.map((row) => {
    const tanggal = new Date(row.tanggal).toLocaleDateString("id-ID", {
      day: "2-digit",
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

    // Tentukan status presensi berdasarkan prioritas
    let status = "Alpha";
    if (row.jadwal_status === "libur") status = "Libur";
    else if (row.jadwal_status === "izin") status = "Izin";
    else if (row.jadwal_status === "cuti") status = "Cuti";
    else if (row.presensi_status === "terlambat") status = "Terlambat";
    else if (row.presensi_status === "hadir") status = "Hadir";

    // Logika: Tandai noCheckout otomatis jika sudah lewat 1 jam sebelum shift besok
    let showNoCheckout = false;

    if (row.jam_masuk && !row.jam_keluar && row.jam_masuk_besok) {
      const tanggalJadwal = new Date(row.tanggal);
      const [besokHour, besokMin, besokSec = 0] = row.jam_masuk_besok
        .split(":")
        .map(Number);

      // Batas waktu = jam_mulai besok - 1 jam
      let batasHour = besokHour - 1;
      let batasTanggal = new Date(tanggalJadwal);

      if (batasHour < 0) {
        // Shift besok mulai sebelum jam 01:00, batas mundur ke hari ini jam 23:xx
        batasHour = 23;
      } else {
        // Shift besok mulai setelah jam 01:00, batas di hari besok
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
      // Fallback: Tidak ada shift besok, batas +12 jam dari jam_selesai
      if (row.jam_selesai) {
        const [endHour, endMin] = row.jam_selesai.split(":").map(Number);
        const tanggalJadwal = new Date(row.tanggal);
        const isNightShift =
          endHour < parseInt(row.jam_mulai?.split(":")[0] || "0");
        const tanggalSelesai = new Date(tanggalJadwal);
        if (isNightShift) tanggalSelesai.setDate(tanggalSelesai.getDate() + 1);

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

    // Gabungkan: showNoCheckout dari logika waktu ATAU no_checkout dari database (koreksi admin)
    const finalNoCheckout = showNoCheckout || row.no_checkout === 1;

    return {
      tanggal,
      kodeShift: row.kode_shift || "-",
      jamKerja,
      jamMasuk,
      jamPulang,
      status,
      keterangan: row.keterangan_sistem || null,
      jadwalId: row.id_jadwal,
      pernahDikoreksi: row.pernah_dikoreksi === 1,
      sudahDiedit: row.sudah_diedit === 1,
      isLate: row.is_late === 1,
      isOvertime: row.is_overtime === 1,
      noCheckout: finalNoCheckout,
    };
  });

  return {
    pegawai: {
      id: pegawai.id_pegawai,
      nama: pegawai.nama,
      status: pegawai.status_pegawai,
      unit: { id: pegawai.id_unit, nama: pegawai.nama_unit },
    },
    presensi: presensiList,
  };
};

// 2. Ambil matrix presensi per unit (Untuk Halaman RekapKehadiran)
exports.getUnitPresensiMatrix = async (unitId, year, month) => {
  const daysInMonth = new Date(year, month, 0).getDate();

  // Ambil daftar pegawai aktif di unit tersebut
  const [pegawai] = await db.query(
    `SELECT id_pegawai, nama FROM pegawai WHERE unit_id = ? AND status = 'aktif' ORDER BY nama ASC`,
    [unitId],
  );

  // Ambil data presensi, jadwal, dan jam masuk shift besok untuk semua pegawai di unit
  const [rows] = await db.query(
    `SELECT 
      j.id_jadwal, j.pegawai_id, j.tanggal, j.status as jadwal_status,
      pr.sudah_diedit,
      s.jam_mulai as jam_masuk_hari_ini, s.jam_selesai,
      pr.id_presensi, pr.jam_masuk, pr.jam_keluar, 
      pr.status as presensi_status, pr.keterangan_sistem,
      pr.is_late, pr.is_overtime, pr.no_checkout,
      (SELECT s2.jam_mulai 
       FROM jadwal j2 LEFT JOIN shift s2 ON j2.shift_id = s2.id_shift 
       WHERE j2.pegawai_id = j.pegawai_id 
       AND j2.tanggal = DATE_ADD(j.tanggal, INTERVAL 1 DAY)
       AND j2.status = 'shift'
       LIMIT 1) as jam_masuk_besok
     FROM jadwal j 
     LEFT JOIN shift s ON j.shift_id = s.id_shift
     LEFT JOIN presensi pr ON j.id_jadwal = pr.jadwal_id
     WHERE j.pegawai_id IN (?) AND YEAR(j.tanggal) = ? AND MONTH(j.tanggal) = ?`,
    [pegawai.map((p) => p.id_pegawai), year, month],
  );

  // Inisialisasi struktur matrix kosong
  const schedules = {};
  pegawai.forEach((p) => {
    schedules[p.id_pegawai] = {};
    for (let d = 1; d <= daysInMonth; d++) schedules[p.id_pegawai][d] = null;
  });

  const now = new Date();
  const currentDateTime = now.getTime();

  // Isi matrix dengan data presensi yang ada
  rows.forEach((row) => {
    const day = new Date(row.tanggal).getDate();
    let status = row.jadwal_status;

    if (row.jadwal_status === "shift" && row.presensi_status) {
      status = row.presensi_status;
    }

    // Logika: Tandai noCheckout otomatis jika sudah lewat 1 jam sebelum shift besok
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
      // Fallback: Tidak ada shift besok, batas +12 jam dari jam_selesai
      if (row.jam_selesai) {
        const [endHour, endMin] = row.jam_selesai.split(":").map(Number);
        const tanggalJadwal = new Date(row.tanggal);
        const isNightShift =
          endHour < parseInt(row.jam_masuk_hari_ini?.split(":")[0] || "0");
        const tanggalSelesai = new Date(tanggalJadwal);
        if (isNightShift) tanggalSelesai.setDate(tanggalSelesai.getDate() + 1);

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

    // Tentukan marker berdasarkan keterangan_sistem dan noCheckout
    let markerKanan = null;
    if (row.keterangan_sistem === "!") markerKanan = "!";
    else if (row.keterangan_sistem === "+") markerKanan = "+";
    else if (row.keterangan_sistem === "-") markerKanan = "-";
    else if (finalNoCheckout) markerKanan = "-"; // Override jika noCheckout otomatis

    schedules[row.pegawai_id][day] = {
      jadwalId: row.id_jadwal,
      presensiId: row.id_presensi,
      status,
      isLate: row.is_late === 1,
      isOvertime: row.is_overtime === 1,
      noCheckout: finalNoCheckout,
      sudahDiedit: row.sudah_diedit === 1,
      keteranganSistem: row.keterangan_sistem,
      markerKanan,
      isEdited: row.sudah_diedit === 1,
      jamMasuk: row.jam_masuk
        ? new Date(row.jam_masuk).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : null,
      jamPulang: row.jam_keluar
        ? new Date(row.jam_keluar).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : null,
    };
  });

  return {
    pegawai,
    dates: Array.from({ length: daysInMonth }, (_, i) => i + 1),
    schedules,
  };
};

// 3. Koreksi status presensi oleh Admin (Menggunakan Transaction)
exports.correctAttendance = async ({
  jadwalId,
  statusBaru,
  keterangan,
  alasan,
  dokumen,
  adminId,
}) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Ambil data presensi dan jadwal saat ini
    const [[currentData]] = await connection.query(
      `SELECT j.*, pr.id_presensi, pr.status as presensi_status, 
              pr.keterangan_sistem, pr.is_late, pr.is_overtime
       FROM jadwal j LEFT JOIN presensi pr ON j.id_jadwal = pr.jadwal_id WHERE j.id_jadwal = ?`,
      [jadwalId],
    );

    if (!currentData) throw new Error("JADWAL_NOT_FOUND");

    // Jika statusBaru kosong, gunakan status lama
    const finalStatusBaru =
      statusBaru || currentData.presensi_status || currentData.status;

    const statusUntukJadwal = ["shift", "libur", "izin", "cuti", "alpa"];
    const statusUntukPresensi = ["hadir", "terlambat"];

    // Hanya update tabel jadwal jika status final termasuk kategori jadwal
    if (statusUntukJadwal.includes(finalStatusBaru)) {
      await connection.query(
        `UPDATE jadwal SET status = ?, updated_at = NOW() WHERE id_jadwal = ?`,
        [finalStatusBaru, jadwalId],
      );
    }

    // Mapping keterangan untuk simbol dan flag
    let keteranganSimbol = null;
    let isLateFlag = currentData.is_late || 0;
    let isOvertimeFlag = currentData.is_overtime || 0;
    let noCheckoutFlag = 0;

    if (keterangan === "melebihi_jam") {
      keteranganSimbol = "!";
      isLateFlag = 1;
      isOvertimeFlag = 0;
    } else if (keterangan === "lembur") {
      keteranganSimbol = "+";
      isOvertimeFlag = 1;
    } else if (keterangan === "tidak_pulang") {
      keteranganSimbol = "-";
      noCheckoutFlag = 1;
      isLateFlag = 0;
      isOvertimeFlag = 0;
    } else {
      isLateFlag = 0;
      isOvertimeFlag = 0;
      noCheckoutFlag = 0;
    }

    let presensiIdForLog = currentData.id_presensi;

    // Update atau Insert data presensi
    if (currentData.id_presensi) {
      await connection.query(
        `UPDATE presensi SET 
          status = ?, 
          keterangan_sistem = ?, 
          is_late = ?,
          is_overtime = ?,
          no_checkout = ?,
          sudah_diedit = 1,
          updated_at = NOW() 
         WHERE id_presensi = ?`,
        [
          finalStatusBaru,
          keteranganSimbol,
          isLateFlag,
          isOvertimeFlag,
          noCheckoutFlag,
          currentData.id_presensi,
        ],
      );
    } else {
      if (statusUntukPresensi.includes(finalStatusBaru)) {
        const [result] = await connection.query(
          `INSERT INTO presensi 
            (jadwal_id, pegawai_id, tanggal, status, keterangan_sistem, sudah_diedit) 
           VALUES (?, ?, ?, ?, ?, 1)`,
          [
            jadwalId,
            currentData.pegawai_id,
            currentData.tanggal,
            finalStatusBaru,
            keteranganSimbol,
          ],
        );

        presensiIdForLog = result.insertId;
      }
    }

    // Konversi status sebelum: ubah 'shift' menjadi 'alpa' untuk log koreksi
    let statusSebelum = currentData.presensi_status || currentData.status;
    if (statusSebelum === "shift") {
      statusSebelum = "alpa";
    }

    // Catat riwayat koreksi ke tabel koreksi_presensi
    await connection.query(
      `INSERT INTO koreksi_presensi 
        (presensi_id, jadwal_id, status_sebelum, keterangan_sebelum, status_sesudah, keterangan_sesudah, alasan_perubahan, dokumen_bukti, dikoreksi_oleh) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        presensiIdForLog,
        jadwalId,
        statusSebelum,
        currentData.keterangan_sistem,
        finalStatusBaru,
        keteranganSimbol,
        alasan,
        dokumen || null,
        adminId,
      ],
    );

    await connection.commit();
    return true;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

// 4. Ambil detail riwayat koreksi untuk modal history
exports.getKoreksiDetail = async (jadwalId) => {
  // Ambil data dasar jadwal dan presensi
  const [[jadwal]] = await db.query(
    `SELECT j.id_jadwal, j.tanggal, j.status, j.pegawai_id, s.kode_shift, s.jam_mulai, s.jam_selesai, p.nama as nama_pegawai, pr.jam_masuk, pr.jam_keluar, pr.keterangan_sistem
     FROM jadwal j LEFT JOIN shift s ON j.shift_id = s.id_shift LEFT JOIN pegawai p ON j.pegawai_id = p.id_pegawai LEFT JOIN presensi pr ON j.id_jadwal = pr.jadwal_id
     WHERE j.id_jadwal = ?`,
    [jadwalId],
  );

  if (!jadwal) throw new Error("JADWAL_NOT_FOUND");

  // Ambil riwayat koreksi terakhir
  const [koreksiRows] = await db.query(
    `SELECT kp.*, u.nama as nama_admin FROM koreksi_presensi kp LEFT JOIN users u ON kp.dikoreksi_oleh = u.id_user WHERE kp.jadwal_id = ? ORDER BY kp.created_at DESC LIMIT 1`,
    [jadwalId],
  );

  const koreksi = koreksiRows[0];

  return {
    nama: jadwal.nama_pegawai,
    tanggal: new Date(jadwal.tanggal).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    jamKerja:
      jadwal.jam_mulai && jadwal.jam_selesai
        ? `${jadwal.jam_mulai.substring(0, 5)} - ${jadwal.jam_selesai.substring(0, 5)}`
        : "-",
    jamMasuk: jadwal.jam_masuk
      ? new Date(jadwal.jam_masuk).toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "-",
    jamPulang: jadwal.jam_keluar
      ? new Date(jadwal.jam_keluar).toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "-",
    statusSistem: koreksi?.status_sebelum || jadwal.status || "-",
    keteranganSistem:
      koreksi?.keterangan_sebelum || jadwal.keterangan_sistem || null,
    statusFinal: koreksi?.status_sesudah || jadwal.status || "-",
    keteranganFinal: koreksi?.keterangan_sesudah || null,
    alasanPerubahan: koreksi?.alasan_perubahan || "-",
    dokumen: koreksi?.dokumen_bukti,
    dibuatOleh: koreksi?.nama_admin || "Unknown",
    tanggalDibuat: koreksi?.created_at
      ? new Date(koreksi.created_at).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "-",
  };
};

// BAGIAN PEGAWAI: Presensi (Check-in & Check-out)
// 5. Fungsi Utama: Simpan Presensi (Check-in ATAU Check-out)
exports.recordAttendance = async ({
  pegawaiId,
  jadwalId,
  tanggal,
  tipe,
  jam,
  latitude,
  longitude,
  foto,
  isLate = false,
  statusPresensi = "hadir",
  jam_selesai = null,
}) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Cek apakah sudah ada data presensi untuk jadwal ini
    const [[existing]] = await connection.query(
      `SELECT id_presensi, jam_masuk, jam_keluar FROM presensi WHERE jadwal_id = ?`,
      [jadwalId],
    );

    let presensiId = existing?.id_presensi;
    const jamWaktu = new Date(jam);

    // Logika untuk Check-in (Masuk)
    if (tipe === "masuk") {
      if (existing && existing.jam_masuk) {
        await connection.rollback();
        throw new Error("SUDAH_CHECK_IN");
      }

      if (existing) {
        // Update jika record sudah ada tapi jam_masuk masih kosong
        await connection.query(
          `UPDATE presensi SET 
            jam_masuk = ?, lokasi_masuk_latitude = ?, lokasi_masuk_longitude = ?, 
            foto_masuk = ?, status = ?
           WHERE id_presensi = ?`,
          [
            jamWaktu,
            latitude,
            longitude,
            foto || null,
            statusPresensi,
            presensiId,
          ],
        );
      } else {
        // Insert record presensi baru
        const [result] = await connection.query(
          `INSERT INTO presensi 
            (pegawai_id, jadwal_id, tanggal, jam_masuk, lokasi_masuk_latitude, lokasi_masuk_longitude, foto_masuk, status) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            pegawaiId,
            jadwalId,
            tanggal,
            jamWaktu,
            latitude,
            longitude,
            foto || null,
            statusPresensi,
          ],
        );
        presensiId = result.insertId;
      }
    }
    // Logika untuk Check-out (Pulang)
    else if (tipe === "pulang") {
      if (!existing) {
        await connection.rollback();
        throw new Error("BELUM_CHECK_IN");
      }
      if (existing.jam_keluar) {
        await connection.rollback();
        throw new Error("SUDAH_CHECK_OUT");
      }

      let keteranganSistem = null;
      let isLateFinal = isLate;

      // Deteksi otomatis jika pulang melebihi 1 jam dari jam selesai (lembur)
      if (jam_selesai && jam_selesai !== "00:00:00") {
        const [endHour, endMin] = jam_selesai.split(":").map(Number);

        const tanggalJadwal = new Date(tanggal);
        const jamSelesaiTime = new Date(
          tanggalJadwal.getFullYear(),
          tanggalJadwal.getMonth(),
          tanggalJadwal.getDate(),
          endHour,
          endMin,
          0,
        );

        const selisihMs = jamWaktu.getTime() - jamSelesaiTime.getTime();
        const selisihMenit = selisihMs / (1000 * 60);

        if (selisihMenit > 60) {
          keteranganSistem = "!";
          isLateFinal = true;
        }
      }

      // Update data check-out
      await connection.query(
        `UPDATE presensi SET 
          jam_keluar = ?, lokasi_keluar_latitude = ?, lokasi_keluar_longitude = ?, 
          foto_keluar = ?, is_late = ?, keterangan_sistem = ?
         WHERE id_presensi = ?`,
        [
          jamWaktu,
          latitude,
          longitude,
          foto || null,
          isLateFinal ? 1 : 0,
          keteranganSistem,
          presensiId,
        ],
      );
    }

    await connection.commit();
    return { presensiId, status: "success", tipe, isLate: isLate };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

// 6. Hitung status otomatis (Hadir/Terlambat) berdasarkan jam masuk dan jam shift
exports.calculateAttendanceStatus = async (pegawaiId, tanggal, jamMasuk) => {
  // Ambil jam mulai shift dari jadwal
  const [[jadwal]] = await db.query(
    `SELECT j.status as jadwal_status, s.jam_mulai 
     FROM jadwal j 
     LEFT JOIN shift s ON j.shift_id = s.id_shift 
     WHERE j.pegawai_id = ? AND j.tanggal = ?`,
    [pegawaiId, tanggal],
  );

  if (!jadwal || jadwal.jadwal_status !== "shift") {
    return { status: jadwal?.jadwal_status || "alpa", isLate: false };
  }

  if (!jadwal.jam_mulai || !jamMasuk) return { status: "alpa", isLate: false };

  // Bandingkan waktu masuk dengan waktu mulai shift
  const [shiftHour, shiftMinute, shiftSecond = 0] = jadwal.jam_mulai
    .split(":")
    .map(Number);

  const jadwalDate = new Date(tanggal);

  const shiftTimeWIB = new Date(
    jadwalDate.getFullYear(),
    jadwalDate.getMonth(),
    jadwalDate.getDate(),
    shiftHour,
    shiftMinute,
    shiftSecond,
    0,
  );

  const masukTime = new Date(jamMasuk);

  const isLate = masukTime.getTime() > shiftTimeWIB.getTime();

  console.log(`[calculateAttendanceStatus]`);
  console.log(`  shiftTimeWIB: ${shiftTimeWIB.toISOString()}`);
  console.log(`  masukTime: ${masukTime.toISOString()}`);
  console.log(`  isLate: ${isLate}`);

  return {
    status: isLate ? "terlambat" : "hadir",
    isLate,
    shiftStart: jadwal.jam_mulai,
    actualIn: masukTime,
  };
};
