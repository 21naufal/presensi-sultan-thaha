const { success, error, serverError } = require("../utils/responseHelper");
const db = require("../config/db");

// Ambil jadwal pegawai untuk bulan tertentu
exports.getJadwalBulanan = async (req, res) => {
  try {
    const pegawaiId = req.user.pegawai_id;
    const year = parseInt(req.params.year);
    const month = parseInt(req.params.month);

    const query = `
      SELECT 
        j.id_jadwal,
        j.tanggal,
        j.status,
        s.nama_shift,
        s.jam_mulai,
        s.jam_selesai,
        u.nama_unit,
        l.nama_lokasi,
        l.latitude,
        l.longitude,
        l.radius
      FROM jadwal j
      LEFT JOIN shift s ON j.shift_id = s.id_shift
      LEFT JOIN pegawai p ON j.pegawai_id = p.id_pegawai
      LEFT JOIN unit u ON p.unit_id = u.id_unit
      LEFT JOIN lokasi l ON u.lokasi_id = l.id_lokasi
      WHERE j.pegawai_id = ?
      AND YEAR(j.tanggal) = ?
      AND MONTH(j.tanggal) = ?
      ORDER BY j.tanggal ASC
    `;

    const [rows] = await db.query(query, [pegawaiId, year, month]);

    const jadwalList = rows.map((row) => ({
      tanggal: row.tanggal,
      status: row.status, // 'shift', 'libur', 'izin', 'cuti'
      namaShift: row.nama_shift || "-",
      jamMulai: row.jam_mulai ? row.jam_mulai.substring(0, 5) : "-",
      jamSelesai: row.jam_selesai ? row.jam_selesai.substring(0, 5) : "-",
      lokasi: row.nama_lokasi || "-",
      latitude: row.latitude,
      longitude: row.longitude,
      radius: row.radius,
    }));

    return success(res, "Jadwal berhasil diambil", jadwalList);
  } catch (err) {
    console.error("[getJadwalBulanan] Error:", err);
    return serverError(res, err, "getJadwalBulanan");
  }
};
