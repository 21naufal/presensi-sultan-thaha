const db = require("../config/db");

// elper hitung durasi dalam menit dari jam_mulai dan jam_selesai
const calculateDuration = (startTime, endTime) => {
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);

  let startMinutes = startH * 60 + startM;
  let endMinutes = endH * 60 + endM;

  // handle shift malam yang melewati tengah malam
  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60;
  }

  return endMinutes - startMinutes;
};

// helper format durasi menit ke string "X jam Y menit"
const formatDuration = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours} jam ${mins.toString().padStart(2, "0")} menit`;
};

// ambil semua master shift
exports.getAllShifts = async () => {
  const query = `
    SELECT 
      id_shift as id,
      nama_shift as namaShift,
      kode_shift as kodeShift,
      jam_mulai as jamMulai,
      jam_selesai as jamSelesai,
      durasi,
      CONCAT(FLOOR(durasi/60), ' jam ', LPAD(durasi%60, 2, '0'), ' menit') as durasiFormatted
    FROM shift
    ORDER BY nama_shift ASC
  `;

  const [results] = await db.query(query);
  return results;
};

// ambil shift by ID
exports.getShiftById = async (id) => {
  const query = `
    SELECT 
      id_shift as id,
      nama_shift as namaShift,
      kode_shift as kodeShift,
      jam_mulai as jamMulai,
      jam_selesai as jamSelesai,
      durasi
    FROM shift
    WHERE id_shift = ?
  `;

  const [results] = await db.query(query, [id]);
  return results[0] || null;
};

// ambil shift yang aktif di unit tertentu
exports.getShiftsByUnit = async (unitId) => {
  const query = `
    SELECT 
      s.id_shift as id,
      s.nama_shift as namaShift,
      s.kode_shift as kodeShift,
      s.jam_mulai as jamMulai,
      s.jam_selesai as jamSelesai,
      s.durasi,
      CONCAT(FLOOR(s.durasi/60), ' jam ', LPAD(s.durasi%60, 2, '0'), ' menit') as durasiFormatted,
      u.nama_unit as unitName
    FROM shift s
    JOIN shift_unit su ON s.id_shift = su.shift_id
    JOIN unit u ON su.unit_id = u.id_unit
    WHERE su.unit_id = ?
    ORDER BY s.jam_mulai ASC
  `;

  const [results] = await db.query(query, [unitId]);
  return results;
};

// tambah shift master
exports.createShift = async (shiftData) => {
  const { namaShift, kodeShift, jamMulai, jamSelesai } = shiftData;

  // validasi jam_mulai < jam_selesai (untuk shift normal) untuk shift malam (21:00-05:00), backend handle khusus
  const duration = calculateDuration(jamMulai, jamSelesai);

  const query = `
    INSERT INTO shift (nama_shift, kode_shift, jam_mulai, jam_selesai, durasi)
    VALUES (?, ?, ?, ?, ?)
  `;

  const [result] = await db.execute(query, [
    namaShift,
    kodeShift,
    jamMulai,
    jamSelesai,
    duration,
  ]);

  return {
    id: result.insertId,
    namaShift,
    kodeShift,
    jamMulai,
    jamSelesai,
    durasi: duration,
    durasiFormatted: formatDuration(duration),
  };
};

// update shift master
exports.updateShift = async (id, shiftData) => {
  const { namaShift, kodeShift, jamMulai, jamSelesai } = shiftData;
  const duration = calculateDuration(jamMulai, jamSelesai);

  const query = `
    UPDATE shift 
    SET nama_shift = ?, kode_shift = ?, jam_mulai = ?, jam_selesai = ?, durasi = ?
    WHERE id_shift = ?
  `;

  await db.execute(query, [
    namaShift,
    kodeShift,
    jamMulai,
    jamSelesai,
    duration,
    id,
  ]);

  return {
    id: parseInt(id),
    namaShift,
    kodeShift,
    jamMulai,
    jamSelesai,
    durasi: duration,
    durasiFormatted: formatDuration(duration),
  };
};

// hapus shift master
exports.deleteShift = async (id) => {
  // cek apakah shift masih digunakan di shift_unit atau jadwal
  const checkQuery = `
    SELECT 
      (SELECT COUNT(*) FROM shift_unit WHERE shift_id = ?) as unit_count,
      (SELECT COUNT(*) FROM jadwal WHERE shift_id = ?) as jadwal_count
  `;

  const [counts] = await db.query(checkQuery, [id, id]);
  const row = counts[0];

  if (row.unit_count > 0 || row.jadwal_count > 0) {
    throw new Error("Shift tidak dapat dihapus karena masih digunakan");
  }

  const query = `DELETE FROM shift WHERE id_shift = ?`;
  await db.execute(query, [id]);
  return true;
};

// tambah shift unit (link shift ke unit)
exports.createShiftUnit = async (shiftId, unitId) => {
  // cek apakah relasi sudah ada
  const checkQuery = `SELECT id_shift_unit FROM shift_unit WHERE shift_id = ? AND unit_id = ?`;
  const [existing] = await db.query(checkQuery, [shiftId, unitId]);

  if (existing.length > 0) {
    throw new Error("Shift ini sudah terhubung ke unit tersebut");
  }

  const query = `INSERT INTO shift_unit (shift_id, unit_id) VALUES (?, ?)`;
  const [result] = await db.execute(query, [shiftId, unitId]);

  return { id: result.insertId, shiftId, unitId };
};

// hapus shift unit (unlink shift dari unit)
exports.deleteShiftUnit = async (shiftId, unitId) => {
  // cek apakah shift_unit masih dipakai di jadwal
  const checkQuery = `SELECT COUNT(*) as count FROM jadwal WHERE shift_id = ? AND pegawai_id IN (SELECT id_pegawai FROM pegawai WHERE unit_id = ?)`;
  const [counts] = await db.query(checkQuery, [shiftId, unitId]);

  if (counts[0].count > 0) {
    throw new Error(
      "Tidak dapat menghapus: Shift ini masih digunakan dalam jadwal aktif",
    );
  }

  const query = `DELETE FROM shift_unit WHERE shift_id = ? AND unit_id = ?`;
  const [result] = await db.execute(query, [shiftId, unitId]);

  return result.affectedRows > 0;
};

// ambil semua shift_unit dengan detail
exports.getAllShiftUnits = async (unitId = null) => {
  let query = `
    SELECT 
      su.id_shift_unit as id,
      s.id_shift as shiftId,
      s.nama_shift as namaShift,
      s.kode_shift as kodeShift,
      s.jam_mulai as jamMulai,
      s.jam_selesai as jamSelesai,
      s.durasi,
      CONCAT(FLOOR(s.durasi/60), ' jam ', LPAD(s.durasi%60, 2, '0'), ' menit') as durasiFormatted,
      u.id_unit as unitId,
      u.nama_unit as unitName
    FROM shift_unit su
    JOIN shift s ON su.shift_id = s.id_shift
    JOIN unit u ON su.unit_id = u.id_unit
  `;

  const params = [];

  if (unitId) {
    query += ` WHERE su.unit_id = ?`;
    params.push(unitId);
  }

  query += ` ORDER BY u.nama_unit ASC, s.jam_mulai ASC`;

  const [results] = await db.query(query, params);
  return results;
};
