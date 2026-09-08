const db = require("../config/db");

// ambil semua unit + detail lokasi
exports.getAllUnits = async (searchQuery = "") => {
  const query = `
    SELECT 
      u.id_unit as id,
      u.nama_unit as namaUnit,
      l.nama_lokasi as lokasiUnit,
      l.latitude,
      l.longitude,
      l.radius
    FROM unit u
    JOIN lokasi l ON u.lokasi_id = l.id_lokasi
    WHERE u.nama_unit LIKE ? OR l.nama_lokasi LIKE ?
    ORDER BY u.nama_unit ASC
  `;
  const searchTerm = `%${searchQuery}%`;

  const [results] = await db.query(query, [searchTerm, searchTerm]);
  return results;
};

// ambil unit by id
exports.getUnitById = async (id) => {
  const query = `
    SELECT 
      u.id_unit as id,
      u.nama_unit as namaUnit,
      l.nama_lokasi as lokasiUnit,
      l.latitude,
      l.longitude,
      l.radius
    FROM unit u
    JOIN lokasi l ON u.lokasi_id = l.id_lokasi
    WHERE u.id_unit = ?
  `;

  const [results] = await db.query(query, [id]);
  return results[0] || null;
};

// tambah unit + lokasi dengan TRANSACTION
exports.createUnit = async (unitData, lokasiData) => {
  // ambil koneksi dari pool untuk transaction
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 1. insert lokasi dulu
    const [lokasiResult] = await connection.execute(
      `INSERT INTO lokasi (nama_lokasi, latitude, longitude, radius) 
       VALUES (?, ?, ?, ?)`,
      [
        lokasiData.nama_lokasi,
        lokasiData.latitude,
        lokasiData.longitude,
        lokasiData.radius,
      ],
    );

    const lokasiId = lokasiResult.insertId;

    // 2. insert unit dengan lokasi_id
    const [unitResult] = await connection.execute(
      `INSERT INTO unit (nama_unit, lokasi_id) VALUES (?, ?)`,
      [unitData.nama_unit, lokasiId],
    );

    await connection.commit();

    return {
      id: unitResult.insertId,
      namaUnit: unitData.nama_unit,
      lokasiUnit: lokasiData.nama_lokasi,
      latitude: lokasiData.latitude,
      longitude: lokasiData.longitude,
      radius: lokasiData.radius,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// update unit + lokasi dengan TRANSACTION
exports.updateUnit = async (id, unitData, lokasiData) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 1. ambil lokasi_id dari unit
    const [unitRows] = await connection.execute(
      `SELECT lokasi_id FROM unit WHERE id_unit = ?`,
      [id],
    );

    if (unitRows.length === 0) {
      throw new Error("Unit tidak ditemukan");
    }

    const lokasiId = unitRows[0].lokasi_id;

    // 2. update lokasi
    await connection.execute(
      `UPDATE lokasi SET nama_lokasi = ?, latitude = ?, longitude = ?, radius = ? 
       WHERE id_lokasi = ?`,
      [
        lokasiData.nama_lokasi,
        lokasiData.latitude,
        lokasiData.longitude,
        lokasiData.radius,
        lokasiId,
      ],
    );

    // 3. update unit
    await connection.execute(
      `UPDATE unit SET nama_unit = ? WHERE id_unit = ?`,
      [unitData.nama_unit, id],
    );

    await connection.commit();

    return {
      id,
      namaUnit: unitData.nama_unit,
      lokasiUnit: lokasiData.nama_lokasi,
      latitude: lokasiData.latitude,
      longitude: lokasiData.longitude,
      radius: lokasiData.radius,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// hapus unit dengan validasi foreign key
exports.deleteUnit = async (id) => {
  // PERBAIKAN: Cek dengan JOIN ke tabel pegawai untuk jadwal
  const checkQuery = `
    SELECT 
      (SELECT COUNT(*) FROM pegawai WHERE unit_id = ?) as pegawai_count,
      (SELECT COUNT(*) FROM shift_unit WHERE unit_id = ?) as shift_count,
      (SELECT COUNT(*) FROM jadwal j 
       JOIN pegawai p ON j.pegawai_id = p.id_pegawai 
       WHERE p.unit_id = ?) as jadwal_count
  `;

  const [counts] = await db.query(checkQuery, [id, id, id]);
  const row = counts[0];

  if (row.pegawai_count > 0 || row.shift_count > 0 || row.jadwal_count > 0) {
    throw new Error("Unit tidak dapat dihapus karena masih digunakan");
  }

  // hapus dengan transaction
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // 1. hapus unit
    await connection.execute(`DELETE FROM unit WHERE id_unit = ?`, [id]);

    // 2. hapus lokasi yang tidak terpakai
    await connection.execute(
      `DELETE l FROM lokasi l 
       LEFT JOIN unit u ON l.id_lokasi = u.lokasi_id 
       WHERE u.id_unit IS NULL`,
    );

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
