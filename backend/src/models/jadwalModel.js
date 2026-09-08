const db = require("../config/db");

// helper functions
const getDaysInMonth = (year, month) => new Date(year, month, 0).getDate();
const formatDate = (year, month, day) =>
  `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
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
const getDayFromDate = (dateVal) =>
  dateVal instanceof Date ? dateVal.getDate() : parseInt(dateVal.split("-")[2]);

// ambil semua periode yang sudah dibuat
exports.getAllPeriods = async () => {
  // 1. ambil daftar periode (tahun & bulan) yang sudah ada jadwalnya
  const [rows] = await db.query(`
    SELECT YEAR(tanggal) as tahun, MONTH(tanggal) as bulan, MAX(updated_at) as terakhirDiubah
    FROM jadwal
    GROUP BY YEAR(tanggal), MONTH(tanggal)
    ORDER BY tahun DESC, bulan DESC
  `);

  // 2. ambil total unit yang ada di database
  const [[{ totalUnits }]] = await db.query(
    `SELECT COUNT(*) as totalUnits FROM unit`,
  );

  // 3. hitung jumlah unit yang sudah lengkap + cek apakah ada jadwal terisi
  const periods = await Promise.all(
    rows.map(async (r) => {
      // query hitung unit yang semua pegawainya tidak ada yang status 'belum_diisi'
      const [unitResults] = await db.query(
        `
      SELECT u.id_unit
      FROM unit u
      JOIN pegawai p ON u.id_unit = p.unit_id AND p.status = 'aktif'
      LEFT JOIN jadwal j ON p.id_pegawai = j.pegawai_id 
        AND YEAR(j.tanggal) = ? AND MONTH(j.tanggal) = ? 
        AND j.status = 'belum_diisi'
      GROUP BY u.id_unit
      HAVING COUNT(j.id_jadwal) = 0
    `,
        [r.tahun, r.bulan],
      );

      // yuery tambahan untuk cek apakah ada jadwal yang sudah diisi (status != 'belum_diisi')
      const [[{ filledCount }]] = await db.query(
        `SELECT COUNT(*) as filledCount FROM jadwal 
         WHERE YEAR(tanggal) = ? AND MONTH(tanggal) = ? AND status != 'belum_diisi'`,
        [r.tahun, r.bulan],
      );

      // completedUnits = jumlah unit yang sudah lengkap
      const completedUnits = unitResults.length;
      const hasAnyFilledSchedule = filledCount > 0;

      return { ...r, totalUnits, completedUnits, hasAnyFilledSchedule };
    }),
  );

  // 4. format data agar mudah dibaca frontend
  return periods.map((r) => ({
    id: `${r.tahun}-${r.bulan}`,
    periode: `${MONTH_NAMES[r.bulan - 1]} ${r.tahun}`,
    tahun: r.tahun,
    bulan: r.bulan,
    status:
      r.bulan === new Date().getMonth() + 1 &&
      r.tahun === new Date().getFullYear()
        ? "Aktif"
        : "Nonaktif",
    totalUnits: totalUnits,
    completedUnits: r.completedUnits,
    hasAnyFilledSchedule: r.hasAnyFilledSchedule,
    terakhirDiubah: r.terakhirDiubah
      ? new Date(r.terakhirDiubah).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "-",
  }));
};

// buat periode + generate placeholder untuk semua pegawai aktif
exports.createPeriod = async (year, month) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const days = getDaysInMonth(year, month);

    // 1. ambil semua pegawai aktif
    const [employees] = await connection.execute(
      `SELECT id_pegawai FROM pegawai WHERE status = 'aktif'`,
    );

    if (employees.length === 0) {
      throw new Error("Tidak ada pegawai aktif untuk dijadwalkan");
    }

    // 2. siapkan data untuk bulk insert
    const values = [];
    for (const emp of employees) {
      for (let d = 1; d <= days; d++) {
        values.push([
          emp.id_pegawai,
          formatDate(year, month, d),
          null,
          "belum_diisi",
        ]);
      }
    }

    // 3. bulk insert dengan query manual
    const placeholders = values.map(() => "(?, ?, ?, ?)").join(", ");
    const flatValues = values.flat();

    const sql = `
      INSERT IGNORE INTO jadwal (pegawai_id, tanggal, shift_id, status)
      VALUES ${placeholders}
    `;

    const [result] = await connection.execute(sql, flatValues);
    const inserted = result.affectedRows;

    await connection.commit();

    return {
      tahun: year,
      bulan: month,
      insertedCount: inserted,
    };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

// ambil list unit + progress dalam periode tertentu
exports.getUnitsInPeriod = async (year, month) => {
  // LANGKAH 1: Hitung total jadwal per pegawai
  const [pegawaiStats] = await db.query(
    `
    SELECT 
      p.id_pegawai,
      p.unit_id,
      COUNT(*) as total_jadwal,
      SUM(CASE WHEN j.status = 'belum_diisi' OR j.status IS NULL OR j.status = '' THEN 1 ELSE 0 END) as jumlah_belum
    FROM pegawai p
    LEFT JOIN jadwal j ON p.id_pegawai = j.pegawai_id 
      AND YEAR(j.tanggal) = ? 
      AND MONTH(j.tanggal) = ?
    WHERE p.status = 'aktif'
    GROUP BY p.id_pegawai, p.unit_id
    `,
    [year, month],
  );

  pegawaiStats.forEach((p) => {
    console.log({
      pegawai: p.id_pegawai,
      unit: p.unit_id,
      total_jadwal: p.total_jadwal,
      jumlah_belum: p.jumlah_belum,
    });
  });

  // LANGKAH 2: Kelompokkan by unit dan hitung pegawai selesai
  const unitMap = {};

  pegawaiStats.forEach((p) => {
    if (!unitMap[p.unit_id]) {
      unitMap[p.unit_id] = {
        totalPegawai: 0,
        pegawaiSelesai: 0,
      };
    }

    unitMap[p.unit_id].totalPegawai++;

    // Pegawai selesai jika: punya jadwal DAN semua sudah diisi
    if (Number(p.total_jadwal) > 0 && Number(p.jumlah_belum) === 0) {
      unitMap[p.unit_id].pegawaiSelesai++;
    }
  });

  // LANGKAH 3: Ambil nama unit
  const [units] = await db.query(
    `SELECT id_unit, nama_unit FROM unit ORDER BY nama_unit ASC`,
  );

  // LANGKAH 4: Format response
  return units.map((u) => {
    const stats = unitMap[u.id_unit] || { totalPegawai: 0, pegawaiSelesai: 0 };

    return {
      id: u.id_unit,
      namaUnit: u.nama_unit,
      totalPegawai: stats.totalPegawai,
      pegawaiSelesai: stats.pegawaiSelesai,
      progress:
        stats.totalPegawai > 0
          ? Math.round((stats.pegawaiSelesai / stats.totalPegawai) * 100)
          : 0,
      isCompleted:
        stats.pegawaiSelesai === stats.totalPegawai && stats.totalPegawai > 0,
    };
  });
};

// ambil matrix jadwal untuk unit tertentu
exports.getScheduleMatrix = async (unitId, year, month) => {
  const days = getDaysInMonth(year, month);

  const [pegawai] = await db.query(
    `SELECT id_pegawai, nama FROM pegawai WHERE unit_id = ? AND status = 'aktif' ORDER BY nama ASC`,
    [unitId],
  );

  const [shifts] = await db.query(
    `SELECT s.id_shift, s.kode_shift, s.nama_shift, s.jam_mulai, s.jam_selesai 
     FROM shift s JOIN shift_unit su ON s.id_shift = su.shift_id 
     WHERE su.unit_id = ? ORDER BY s.jam_mulai ASC`,
    [unitId],
  );

  const [existing] = await db.query(
    `
    SELECT
      j.id_jadwal,
      j.pegawai_id,
      j.tanggal,
      j.shift_id,
      j.status,
      j.sudah_diedit,
      s.kode_shift,
      s.nama_shift,
      s.jam_mulai,
      s.jam_selesai
    FROM jadwal j
    LEFT JOIN shift s
      ON j.shift_id = s.id_shift
    WHERE j.pegawai_id IN (?)
      AND YEAR(j.tanggal)=?
      AND MONTH(j.tanggal)=?
    `,
    [pegawai.map((p) => p.id_pegawai), year, month],
  );

  // format response untuk matrix frontend
  const schedules = {};
  pegawai.forEach((p) => {
    schedules[p.id_pegawai] = {};
    for (let d = 1; d <= days; d++) schedules[p.id_pegawai][d] = null;
  });

  existing.forEach((row) => {
    const day = getDayFromDate(row.tanggal);

    schedules[row.pegawai_id][day] = {
      jadwalId: row.id_jadwal,
      shiftId: row.shift_id,
      status: row.status,
      isEdited: row.sudah_diedit === 1,
      kodeShift: row.kode_shift,
      namaShift: row.nama_shift,
      jamMulai: row.jam_mulai ? row.jam_mulai.substring(0, 5) : null,

      jamSelesai: row.jam_selesai ? row.jam_selesai.substring(0, 5) : null,
    };
  });

  return {
    pegawai,
    shifts,
    dates: Array.from({ length: days }, (_, i) => i + 1),
    schedules,
  };
};

// bulk update jadwal
exports.bulkSaveSchedule = async (unitId, year, month, schedules) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    let updated = 0;

    for (const s of schedules) {
      if (s.status === "shift" && !s.shiftId)
        throw new Error(
          `Shift ID wajib untuk status 'shift' pada ${s.tanggal}`,
        );
      if (s.status !== "shift") s.shiftId = null;

      const sql = `INSERT INTO jadwal (pegawai_id, tanggal, shift_id, status) 
                   VALUES (?, ?, ?, ?)
                   ON DUPLICATE KEY UPDATE shift_id = VALUES(shift_id), status = VALUES(status)`;
      await connection.execute(sql, [
        s.pegawaiId,
        s.tanggal,
        s.shiftId,
        s.status,
      ]);
      updated++;
    }

    await connection.commit();
    return { updatedCount: updated };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

// ambil detail jadwal per pegawai
exports.getPegawaiScheduleDetail = async (pegawaiId, year, month) => {
  const [[pegawai]] = await db.query(
    `
    SELECT
      p.id_pegawai,
      p.nama,
      p.status,
      u.id_unit,
      u.nama_unit
    FROM pegawai p
    LEFT JOIN unit u ON p.unit_id = u.id_unit
    WHERE p.id_pegawai = ?
    `,
    [pegawaiId],
  );

  if (!pegawai) {
    throw new Error("PEGAWAI_NOT_FOUND");
  }

  const days = getDaysInMonth(year, month);

  const [rows] = await db.query(
    `
    SELECT
      j.id_jadwal,
      j.tanggal,
      j.shift_id,
      j.status,
      j.sudah_diedit,
      s.kode_shift,
      s.nama_shift,
      s.jam_mulai,
      s.jam_selesai
    FROM jadwal j
    LEFT JOIN shift s ON j.shift_id = s.id_shift
    WHERE j.pegawai_id = ?
      AND YEAR(j.tanggal) = ?
      AND MONTH(j.tanggal) = ?
    ORDER BY j.tanggal ASC
    `,
    [pegawaiId, year, month],
  );

  const jadwal = [];

  for (let d = 1; d <= days; d++) {
    const t = formatDate(year, month, d);
    const row = rows.find((r) => getDayFromDate(r.tanggal) === d);

    jadwal.push({
      tanggal: t,
      hari: new Date(t).toLocaleDateString("id-ID", {
        weekday: "long",
      }),
      jadwalId: row?.id_jadwal,
      sudahDiedit: row?.sudah_diedit === 1,
      shift: row?.kode_shift || "-",
      shiftNama: row?.nama_shift || "-",
      jamMulai: row?.jam_mulai ? row.jam_mulai.substring(0, 5) : "-",
      jamSelesai: row?.jam_selesai ? row.jam_selesai.substring(0, 5) : "-",
      status: row?.status || "belum_diisi",
    });
  }

  return {
    pegawai: {
      id: pegawai.id_pegawai,
      nama: pegawai.nama,
      status: pegawai.status,
      unit: {
        id: pegawai.id_unit,
        nama: pegawai.nama_unit,
      },
    },
    period: {
      year,
      month,
    },
    jadwal,
  };
};

// regenerate placeholder untuk periode yang sudah ada (misal jika ada pegawai baru ditambahkan setelah periode dibuat)
exports.regeneratePeriod = async (year, month) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const days = getDaysInMonth(year, month);

    // 1. ambil semua pegawai aktif (termasuk yang baru ditambahkan)
    const [employees] = await connection.execute(
      `SELECT id_pegawai FROM pegawai WHERE status = 'aktif'`,
    );

    if (employees.length === 0) {
      throw new Error("Tidak ada pegawai aktif untuk dijadwalkan");
    }

    // 2. siapkan data untuk insert (hanya yang belum ada)
    const values = [];
    for (const emp of employees) {
      for (let d = 1; d <= days; d++) {
        values.push([
          emp.id_pegawai,
          formatDate(year, month, d),
          null,
          "belum_diisi",
        ]);
      }
    }

    // 3. insert hanya yang belum ada (abaikan jika sudah ada)
    const placeholders = values.map(() => "(?, ?, ?, ?)").join(", ");
    const flatValues = values.flat();

    const sql = `
      INSERT IGNORE INTO jadwal (pegawai_id, tanggal, shift_id, status)
      VALUES ${placeholders}
    `;

    const [result] = await connection.execute(sql, flatValues);
    const inserted = result.affectedRows;

    await connection.commit();

    return {
      tahun: year,
      bulan: month,
      insertedCount: inserted,
      message: `${inserted} entri placeholder ditambahkan (yang sudah ada diabaikan)`,
    };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

// ganti periode dengan hapus periode lama, generate placeholder untuk periode baru
exports.replacePeriod = async (oldYear, oldMonth, newYear, newMonth) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // 1. cek apakah periode tujuan sudah ada
    const [[existing]] = await connection.query(
      `SELECT COUNT(*) as count FROM jadwal WHERE YEAR(tanggal) = ? AND MONTH(tanggal) = ? LIMIT 1`,
      [newYear, newMonth],
    );
    if (existing.count > 0) {
      throw new Error(
        `Periode ${MONTH_NAMES[newMonth - 1]} ${newYear} sudah ada`,
      );
    }

    // 2. cek apakah semua data periode lama masih 'belum_diisi'
    const [[stats]] = await connection.query(
      `SELECT COUNT(*) as filled FROM jadwal 
       WHERE YEAR(tanggal) = ? AND MONTH(tanggal) = ? AND status != 'belum_diisi'`,
      [oldYear, oldMonth],
    );
    if (stats.filled > 0) {
      throw new Error(
        "Tidak dapat mengubah periode yang sudah memiliki jadwal terisi.",
      );
    }

    // 3. hapus seluruh entri periode lama
    await connection.execute(
      `DELETE FROM jadwal WHERE YEAR(tanggal) = ? AND MONTH(tanggal) = ?`,
      [oldYear, oldMonth],
    );

    // 4. buat placeholder untuk periode baru
    const days = getDaysInMonth(newYear, newMonth);
    const [employees] = await connection.execute(
      `SELECT id_pegawai FROM pegawai WHERE status = 'aktif'`,
    );

    if (employees.length === 0) {
      throw new Error("Tidak ada pegawai aktif untuk dijadwalkan");
    }

    // siapkan data untuk bulk insert
    const values = [];
    for (const emp of employees) {
      for (let d = 1; d <= days; d++) {
        values.push([
          emp.id_pegawai,
          formatDate(newYear, newMonth, d),
          null,
          "belum_diisi",
        ]);
      }
    }

    // bulk insert
    const placeholders = values.map(() => "(?, ?, ?, ?)").join(", ");
    const flatValues = values.flat();

    const sql = `
      INSERT INTO jadwal (pegawai_id, tanggal, shift_id, status)
      VALUES ${placeholders}
    `;

    await connection.execute(sql, flatValues);

    await connection.commit();

    return {
      oldYear,
      oldMonth,
      newYear,
      newMonth,
      deletedCount: employees.length * getDaysInMonth(oldYear, oldMonth),
      insertedCount: employees.length * days,
    };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

exports.editSchedule = async ({
  jadwalId,
  shiftId,
  status,
  alasan,
  buktiFile,
  adminId,
}) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [[oldSchedule]] = await connection.query(
      `
      SELECT *
      FROM jadwal
      WHERE id_jadwal = ?
      `,
      [jadwalId],
    );

    if (!oldSchedule) {
      throw new Error("JADWAL_NOT_FOUND");
    }

    const pernahDisimpan = oldSchedule.status !== "belum_diisi";

    await connection.query(
      `
      UPDATE jadwal
      SET
        shift_id = ?,
        status = ?,
        sudah_diedit = ?
      WHERE id_jadwal = ?
      `,
      [
        status === "shift" ? shiftId : null,
        status,
        pernahDisimpan ? 1 : 0,
        jadwalId,
      ],
    );

    if (pernahDisimpan) {
      await connection.query(
        `
        INSERT INTO riwayat_perubahan_jadwal
        (
          jadwal_id,
          shift_lama_id,
          shift_baru_id,
          status_lama,
          status_baru,
          alasan,
          lampiran,
          diubah_oleh
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          jadwalId,
          oldSchedule.shift_id,
          shiftId,
          oldSchedule.status,
          status,
          alasan,
          buktiFile,
          adminId,
        ],
      );
    }

    await connection.commit();

    return true;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

exports.getRiwayatPerubahan = async (jadwalId) => {
  const [[jadwal]] = await db.query(
    `
    SELECT 
      j.id_jadwal,
      j.pegawai_id,
      j.tanggal,
      p.nama as nama_pegawai,
      s.kode_shift,
      s.nama_shift
    FROM jadwal j
    LEFT JOIN pegawai p ON j.pegawai_id = p.id_pegawai
    LEFT JOIN shift s ON j.shift_id = s.id_shift
    WHERE j.id_jadwal = ?
    `,
    [jadwalId],
  );

  if (!jadwal) {
    throw new Error("JADWAL_NOT_FOUND");
  }

  const [riwayatRows] = await db.query(
    `
    SELECT 
      r.*,
      u.nama as nama_admin,
      s_lama.kode_shift as kode_shift_lama,
      s_lama.nama_shift as nama_shift_lama,
      s_baru.kode_shift as kode_shift_baru,
      s_baru.nama_shift as nama_shift_baru
    FROM riwayat_perubahan_jadwal r
    LEFT JOIN users u ON r.diubah_oleh = u.id_user 
    LEFT JOIN pegawai pg ON u.pegawai_id = pg.id_pegawai 
    LEFT JOIN shift s_lama ON r.shift_lama_id = s_lama.id_shift
    LEFT JOIN shift s_baru ON r.shift_baru_id = s_baru.id_shift
    WHERE r.jadwal_id = ?
    ORDER BY r.created_at DESC
    LIMIT 1
    `,
    [jadwalId],
  );

  if (riwayatRows.length === 0) {
    return {
      nama: jadwal.nama_pegawai,
      tanggal: new Date(jadwal.tanggal).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      jadwalSebelumnya: "-",
      jadwalBaru: jadwal.kode_shift || jadwal.status || "-",
      alasan: null,
      lampiran: null,
      diubahOleh: "-",
      tanggalPerubahan: "-",
    };
  }

  const riwayat = riwayatRows[0];

  // format jadwal sebelumnya
  let jadwalSebelumnya = "-";
  if (riwayat.status_lama === "shift" && riwayat.kode_shift_lama) {
    jadwalSebelumnya = `${riwayat.kode_shift_lama} - ${riwayat.nama_shift_lama || "-"}`;
  } else if (riwayat.status_lama) {
    const statusMap = {
      libur: "L - libur",
      izin: "I - Izin",
      cuti: "C - Cuti",
    };
    jadwalSebelumnya = statusMap[riwayat.status_lama] || riwayat.status_lama;
  }

  // format jadwal baru
  let jadwalBaru = "-";
  if (riwayat.status_baru === "shift" && riwayat.kode_shift_baru) {
    jadwalBaru = `${riwayat.kode_shift_baru} - ${riwayat.nama_shift_baru || "-"}`;
  } else if (riwayat.status_baru) {
    const statusMap = {
      libur: "L - libur",
      izin: "I - Izin",
      cuti: "C - Cuti",
    };
    jadwalBaru = statusMap[riwayat.status_baru] || riwayat.status_baru;
  }

  return {
    nama: jadwal.nama_pegawai,
    tanggal: new Date(jadwal.tanggal).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    jadwalSebelumnya,
    jadwalBaru,
    alasan: riwayat.alasan,
    lampiran: riwayat.lampiran,

    diubahOleh: riwayat.nama_admin || riwayat.username || "Unknown",
    tanggalPerubahan: new Date(riwayat.created_at).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
  };
};
