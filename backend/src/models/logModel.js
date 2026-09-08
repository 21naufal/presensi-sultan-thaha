const db = require("../config/db");

// catat aktivitas admin ke tabel log
exports.create = async (userId, action, detail) => {
  const query = `
    INSERT INTO log (user_id, aksi, detail, created_at) 
    VALUES (?, ?, ?, NOW())
  `;
  const [results] = await db.query(query, [userId, action, detail]);
  return { insertId: results.insertId, affectedRows: results.affectedRows };
};

// Ambil daftar aksi unik untuk dropdown
exports.getDistinctActions = async () => {
  const query = `
    SELECT DISTINCT aksi 
    FROM log 
    WHERE aksi IS NOT NULL 
    ORDER BY aksi ASC
  `;
  const [results] = await db.query(query);
  return results.map((row) => row.aksi);
};

// Hitung total log (tanpa limit) untuk pagination
exports.countAll = async (filters = {}) => {
  let query = `
    SELECT COUNT(*) as total
    FROM log l
    JOIN users u ON l.user_id = u.id_user
    WHERE 1=1
  `;
  const params = [];

  if (filters.startDate) {
    query += ` AND DATE(l.created_at) >= ?`;
    params.push(filters.startDate);
  }
  if (filters.endDate) {
    query += ` AND DATE(l.created_at) <= ?`;
    params.push(filters.endDate);
  }
  if (filters.action) {
    query += ` AND l.aksi = ?`;
    params.push(filters.action);
  }
  if (filters.search) {
    query += ` AND (u.username LIKE ? OR l.detail LIKE ? OR l.aksi LIKE ? OR u.nama LIKE ?)`;
    const searchParam = `%${filters.search}%`;
    params.push(searchParam, searchParam, searchParam, searchParam);
  }

  const [results] = await db.query(query, params);
  return results[0].total;
};

// ambil semua log (dengan pagination)
exports.getAll = async (filters = {}) => {
  let query = `
    SELECT 
      l.id_log,
      l.aksi,
      l.detail,
      l.created_at,
      u.username as admin_name,
      u.nama as admin_nama
    FROM log l
    JOIN users u ON l.user_id = u.id_user
    WHERE 1=1
  `;
  const params = [];

  if (filters.startDate) {
    query += ` AND DATE(l.created_at) >= ?`;
    params.push(filters.startDate);
  }
  if (filters.endDate) {
    query += ` AND DATE(l.created_at) <= ?`;
    params.push(filters.endDate);
  }
  if (filters.action) {
    query += ` AND l.aksi = ?`;
    params.push(filters.action);
  }
  if (filters.search) {
    query += ` AND (u.username LIKE ? OR l.detail LIKE ? OR l.aksi LIKE ? OR u.nama LIKE ?)`;
    const searchParam = `%${filters.search}%`;
    params.push(searchParam, searchParam, searchParam, searchParam);
  }

  query += ` ORDER BY l.created_at DESC`;

  // Pagination: LIMIT & OFFSET
  const limit = filters.limit || 20;
  const page = filters.page || 1;
  const offset = (page - 1) * limit;

  query += ` LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const [results] = await db.query(query, params);
  return results;
};

// ambil log spesifik untuk satu admin
exports.getByUserId = async (userId, limit = 50) => {
  const query = `
    SELECT 
      l.id_log,
      l.aksi,
      l.detail,
      l.created_at
    FROM log l
    WHERE l.user_id = ?
    ORDER BY l.created_at DESC
    LIMIT ?
  `;
  const [results] = await db.query(query, [userId, limit]);
  return results;
};
