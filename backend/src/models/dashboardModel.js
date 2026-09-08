const db = require("../config/db");

// Ambil Semua Pegawai dengan Jadwal Hari Ini
exports.getTodayAttendance = async (todayDate) => {
  const query = `
    SELECT 
      pg.id_pegawai,
      pg.nama,
      pg.foto_profil,
      u.nama_unit,
      j.status as jadwal_status,
      s.jam_mulai,
      s.jam_selesai,
      s.nama_shift,
      p.id_presensi,
      p.jam_masuk,
      p.jam_keluar,
      p.status as status_presensi,
      p.is_late,
      p.is_overtime,
      p.keterangan_sistem,
      p.no_checkout,
      p.foto_masuk,
      p.foto_keluar,
      p.lokasi_masuk_latitude,
      p.lokasi_masuk_longitude,
      l.nama_lokasi,
      (SELECT s2.jam_mulai 
       FROM jadwal j2 LEFT JOIN shift s2 ON j2.shift_id = s2.id_shift 
       WHERE j2.pegawai_id = j.pegawai_id 
       AND j2.tanggal = DATE_ADD(j.tanggal, INTERVAL 1 DAY)
       AND j2.status = 'shift'
       LIMIT 1) as jam_masuk_besok
    FROM jadwal j
    JOIN pegawai pg ON j.pegawai_id = pg.id_pegawai
    JOIN unit u ON pg.unit_id = u.id_unit
    LEFT JOIN shift s ON j.shift_id = s.id_shift
    LEFT JOIN presensi p ON j.id_jadwal = p.jadwal_id
    LEFT JOIN lokasi l ON u.lokasi_id = l.id_lokasi
    WHERE DATE(j.tanggal) = ?
    AND pg.status = 'aktif'
    ORDER BY 
      CASE 
        WHEN p.jam_masuk IS NULL AND j.status = 'shift' THEN 0 
        WHEN p.status = 'terlambat' OR p.is_late = 1 THEN 1
        ELSE 2 
      END,
      pg.nama ASC
  `;

  const [rows] = await db.query(query, [todayDate]);
  return rows;
};

// Ambil Summary Hari Ini
exports.getTodaySummary = async (todayDate) => {
  // Total pegawai yang hadir hari ini (punya jam_masuk)
  const [hadirResult] = await db.query(
    `SELECT COUNT(DISTINCT p.pegawai_id) as total 
     FROM presensi p 
     WHERE DATE(p.tanggal) = ? 
     AND p.jam_masuk IS NOT NULL`,
    [todayDate],
  );

  // Total yang terlambat (status='terlambat' atau is_late=1)
  const [terlambatResult] = await db.query(
    `SELECT COUNT(*) as total 
     FROM presensi p 
     WHERE DATE(p.tanggal) = ? 
     AND (p.status = 'terlambat' OR p.is_late = 1)`,
    [todayDate],
  );

  // Total pegawai yang seharusnya hadir tapi tidak check-in (alpa)
  // = pegawai dengan jadwal shift hari ini tapi tidak ada record presensi
  const [alpaResult] = await db.query(
    `SELECT COUNT(DISTINCT j.pegawai_id) as total
     FROM jadwal j
     LEFT JOIN presensi p ON j.id_jadwal = p.jadwal_id AND p.jam_masuk IS NOT NULL
     WHERE DATE(j.tanggal) = ?
     AND j.status = 'shift'
     AND p.id_presensi IS NULL`,
    [todayDate],
  );

  // Total pegawai aktif
  const [totalPegawaiResult] = await db.query(
    `SELECT COUNT(*) as total FROM pegawai WHERE status = 'aktif'`,
  );

  return {
    totalHadir: hadirResult[0].total || 0,
    totalTerlambat: terlambatResult[0].total || 0,
    totalAlpa: alpaResult[0].total || 0,
    totalPegawai: totalPegawaiResult[0].total || 0,
  };
};

// Ambil Daftar Unit
exports.getUnitList = async () => {
  const [rows] = await db.query(
    `SELECT id_unit, nama_unit FROM unit ORDER BY nama_unit ASC`,
  );
  return rows;
};
