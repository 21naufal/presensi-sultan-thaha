const db = require("../config/db");
const bcrypt = require("bcrypt");

// ambil semua pegawai + detail unit
exports.getAllPegawai = async (filters = {}) => {
  const { search = "", unitId = null, status = null } = filters;

  let query = `
    SELECT 
      p.id_pegawai as id,
      p.nama,
      p.jenis_kelamin as jenisKelamin,
      p.no_hp as noHp,
      p.email,
      p.foto_profil as fotoProfil,
      p.tanggal_mulai_kerja as tanggalMulaiKerja,
      p.status,
      u.nama_unit as unitName,
      u.id_unit as unitId
    FROM pegawai p
    JOIN unit u ON p.unit_id = u.id_unit
    WHERE 1=1
  `;

  const params = [];

  if (search) {
    query += ` AND (p.nama LIKE ? OR p.no_hp LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  if (unitId && unitId !== "all") {
    query += ` AND p.unit_id = ?`;
    params.push(unitId);
  }

  if (status) {
    query += ` AND p.status = ?`;
    params.push(status);
  }

  query += ` ORDER BY p.nama ASC`;

  const [results] = await db.query(query, params);
  return results;
};

// ambil pegawai by id
exports.getPegawaiById = async (id) => {
  const query = `
    SELECT 
      p.id_pegawai as id,
      p.nama,
      p.jenis_kelamin as jenisKelamin,
      p.unit_id as unitId,
      p.no_hp as noHp,
      p.email,
      p.foto_profil as fotoProfil,
      p.tanggal_mulai_kerja as tanggalMulaiKerja,
      p.status,
      u.nama_unit as unitName
    FROM pegawai p
    JOIN unit u ON p.unit_id = u.id_unit
    WHERE p.id_pegawai = ?
  `;

  const [results] = await db.query(query, [id]);
  return results[0] || null;
};

// ambil pegawai by no hp (untuk login)
exports.getPegawaiByNoHp = async (noHp) => {
  const query = `
    SELECT 
      p.id_pegawai as id,
      p.nama,
      p.no_hp as noHp,
      p.status,
      u.username,
      u.role
    FROM pegawai p
    LEFT JOIN users u ON p.id_pegawai = u.pegawai_id
    WHERE p.no_hp = ?
  `;

  const [results] = await db.query(query, [noHp]);
  return results[0] || null;
};

// tambah pegawai + users dengan TRANSACTION
exports.createPegawai = async (pegawaiData, userData, passwordPlain) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 1. insert pegawai dulu
    const [pegawaiResult] = await connection.execute(
      `INSERT INTO pegawai 
       (nama, jenis_kelamin, unit_id, no_hp, email, foto_profil, tanggal_mulai_kerja, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        pegawaiData.nama,
        pegawaiData.jenisKelamin,
        pegawaiData.unitId,
        pegawaiData.noHp,
        pegawaiData.email || null,
        pegawaiData.fotoProfil || null,
        pegawaiData.tanggalMulaiKerja,
        pegawaiData.status || "aktif",
      ],
    );

    const pegawaiId = pegawaiResult.insertId;

    // 2. hash password
    const hashedPassword = await bcrypt.hash(passwordPlain, 10);

    // 3. insert users dengan referensi ke pegawai
    await connection.execute(
      `INSERT INTO users 
   (pegawai_id, username, nama, email, password, role, status) 
   VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        pegawaiId,
        userData.username,
        pegawaiData.nama,
        pegawaiData.email || null,
        hashedPassword,
        "pegawai",
        "aktif",
      ],
    );

    await connection.commit();

    // return data lengkap
    return {
      id: pegawaiId,
      ...pegawaiData,
      unitName: userData.unitName,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// update pegawai dengan TRANSACTION untuk sinkronisasi pegawai + users
exports.updatePegawai = async (id, pegawaiData, passwordPlain = null) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 1. update data pegawai
    await connection.execute(
      `UPDATE pegawai SET 
       nama = ?, jenis_kelamin = ?, unit_id = ?, no_hp = ?, 
       email = ?, tanggal_mulai_kerja = ?, status = ?
       WHERE id_pegawai = ?`,
      [
        pegawaiData.nama,
        pegawaiData.jenisKelamin,
        pegawaiData.unitId,
        pegawaiData.noHp,
        pegawaiData.email || null,
        pegawaiData.tanggalMulaiKerja,
        pegawaiData.status,
        id,
      ],
    );

    // 2. update tabel users jika data pegawai berubah
    await connection.execute(
      `UPDATE users 
        SET username = ?, 
        nama = ?, 
        email = ?
       WHERE pegawai_id = ?`,
      [pegawaiData.noHp, pegawaiData.nama, pegawaiData.email || null, id],
    );

    // 4. update status di tabel users jika status pegawai berubah
    await connection.execute(
      `UPDATE users SET status = ? WHERE pegawai_id = ?`,
      [pegawaiData.status, id],
    );

    // 5. jika password disediakan, update juga password di users
    if (passwordPlain && passwordPlain.trim() !== "") {
      const hashedPassword = await bcrypt.hash(passwordPlain, 10);
      await connection.execute(
        `UPDATE users SET password = ? WHERE pegawai_id = ?`,
        [hashedPassword, id],
      );
    }

    await connection.commit();

    return {
      id: parseInt(id),
      ...pegawaiData,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// =update status jadi nonaktif
exports.deactivatePegawai = async (id) => {
  // cek apakah pegawai masih punya data presensi/jadwal aktif
  const checkQuery = `
    SELECT 
      (SELECT COUNT(*) FROM jadwal WHERE pegawai_id = ? AND tanggal >= CURDATE()) as jadwal_aktif,
      (SELECT COUNT(*) FROM presensi WHERE pegawai_id = ?) as presensi_total
  `;

  const [counts] = await db.query(checkQuery, [id, id]);
  const row = counts[0];

  // warning jika masih ada data, tapi tetap izinkan nonaktifkan karena di nonaktifkan tidak merusak riwayat

  const query = `UPDATE pegawai SET status = 'nonaktif' WHERE id_pegawai = ?`;
  await db.execute(query, [id]);

  // nonaktifkan juga akun users nya
  await db.execute(
    `UPDATE users SET status = 'nonaktif' WHERE pegawai_id = ?`,
    [id],
  );

  return true;
};

// ambil list unit untuk dropdown
exports.getUnitList = async () => {
  const query = `SELECT id_unit as id, nama_unit as namaUnit FROM unit ORDER BY nama_unit ASC`;
  const [results] = await db.query(query);
  return results;
};

// untuk ini nanti di implementasikan
exports.updateAdminNama = async (userId, nama) => {
  const query = `UPDATE users SET nama = ? WHERE id_user = ? AND role = 'admin'`;
  const [result] = await db.execute(query, [nama, userId]);
  return result.affectedRows > 0;
};

// ambil user by id (untuk profil)
exports.getUserById = async (userId) => {
  const query = `
    SELECT 
      u.id_user as id,
      u.username,
      u.nama,
      u.role,
      u.status,
      p.id_pegawai as pegawaiId
    FROM users u
    LEFT JOIN pegawai p ON u.pegawai_id = p.id_pegawai
    WHERE u.id_user = ?
  `;

  const [results] = await db.query(query, [userId]);
  return results[0] || null;
};
