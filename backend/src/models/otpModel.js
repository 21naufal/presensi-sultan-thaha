const db = require("../config/db");

// Simpan OTP ke database
exports.saveOTP = async (email, kodeOTP, expiredAt) => {
  const query = `
    INSERT INTO otp_verifikasi (email, kode_otp, tipe, expired_at, digunakan)
    VALUES (?, ?, 'reset_password', ?, FALSE)
  `;

  const [result] = await db.query(query, [email, kodeOTP, expiredAt]);
  return result.insertId;
};

// Verifikasi OTP
exports.verifyOTP = async (email, kodeOTP) => {
  const query = `
    SELECT * FROM otp_verifikasi
    WHERE email = ? 
    AND kode_otp = ?
    AND tipe = 'reset_password'
    AND digunakan = FALSE
    AND expired_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1
  `;

  const [rows] = await db.query(query, [email, kodeOTP]);
  return rows[0] || null;
};

// Tandai OTP sebagai sudah digunakan
exports.markOTPAsUsed = async (idOTP) => {
  const query = `
    UPDATE otp_verifikasi
    SET digunakan = TRUE
    WHERE id_otp = ?
  `;

  await db.query(query, [idOTP]);
};

// Hapus OTP yang sudah expired (cleanup)
exports.deleteExpiredOTP = async () => {
  const query = `
    DELETE FROM otp_verifikasi
    WHERE expired_at < NOW()
  `;

  const [result] = await db.query(query);
  return result.affectedRows;
};

// Cek berapa OTP yang sudah dikirim dalam 1 jam terakhir (untuk rate limiting)
exports.countRecentOTP = async (email, minutes = 60) => {
  const query = `
    SELECT COUNT(*) as count
    FROM otp_verifikasi
    WHERE email = ?
    AND created_at >= DATE_SUB(NOW(), INTERVAL ? MINUTE)
  `;

  const [rows] = await db.query(query, [email, minutes]);
  return rows[0].count;
};
