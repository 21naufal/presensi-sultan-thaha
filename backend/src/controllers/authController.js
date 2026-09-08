const db = require("../config/db");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { sendOTPEmail } = require("../utils/emailService");
const otpModel = require("../models/otpModel");
const jwt = require("jsonwebtoken");
const { success, error, serverError } = require("../utils/responseHelper");

exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    // validasi input dasar
    if (!identifier || !password) {
      return res.status(400).json({
        message: "Username/no. HP dan kata sandi wajib diisi",
      });
    }

    // query utama
    const query = `
      SELECT 
        u.id_user, u.username, u.password, u.role, u.status, u.pegawai_id,
        p.nama, p.no_hp
      FROM users u
      LEFT JOIN pegawai p ON u.pegawai_id = p.id_pegawai
      WHERE u.username = ? OR p.no_hp = ?
    `;

    const [results] = await db.query(query, [identifier, identifier]);

    if (results.length === 0) {
      return res.status(401).json({
        message: "Nama Pengguna atau No. HP tidak ditemukan",
      });
    }

    const user = results[0];

    // cek status akun
    if (user.status !== "aktif") {
      return res.status(403).json({
        message: "Akun Anda tidak aktif. Silahkan hubungi admin.",
      });
    }

    // verifikasi password dengan bcrypt
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Kata sandi salah" });
    }

    // cek registrasi wajah (hanya untuk pegawai)
    let faceRegistered = true;
    if (user.role === "pegawai" && user.pegawai_id) {
      const faceQuery = `
        SELECT id_wajah 
        FROM data_wajah 
        WHERE pegawai_id = ?
        LIMIT 1
      `;
      const [faceResults] = await db.query(faceQuery, [user.pegawai_id]);
      faceRegistered = faceResults.length > 0;
    }

    // generate JWT Token
    const tokenPayload = {
      id_user: user.id_user,
      role: user.role,
      pegawai_id: user.pegawai_id || null,
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: user.role === "admin" ? "30d" : "365d",
    });

    // response sukses
    return res.json({
      message: "Login berhasil",
      token,
      user: {
        id_user: user.id_user,
        username: user.username,
        role: user.role,
        pegawai_id: user.pegawai_id,
        nama: user.nama || user.username,
        faceRegistered,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);

    // handle error spesifik
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({
        message: "Data referensi tidak valid. Hubungi admin.",
      });
    }

    return res.status(500).json({
      message: "Terjadi kesalahan pada server",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// fitur lupa kata sandi
// Generate kode OTP 6 digit
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Kirim OTP ke email user
exports.lupaPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Validasi email
    if (!email) {
      return error(res, "Email wajib diisi", 400);
    }

    // Cek apakah email terdaftar
    const [users] = await db.query(
      "SELECT id_user, email FROM users WHERE email = ?",
      [email],
    );

    if (users.length === 0) {
      // Jangan kasih tahu email tidak terdaftar (untuk keamanan)
      return success(res, "Jika email terdaftar, kode OTP telah dikirim");
    }

    // Rate limiting: max 3 OTP per jam
    const recentCount = await otpModel.countRecentOTP(email, 60);
    if (recentCount >= 3) {
      return error(
        res,
        "Terlalu banyak permintaan. Silakan coba lagi dalam 1 jam",
        429,
      );
    }

    // Generate OTP
    const kodeOTP = generateOTP();

    // Set expired time 5 menit dari sekarang
    const expiredAt = new Date();
    expiredAt.setMinutes(expiredAt.getMinutes() + 5);

    // Simpan OTP ke database
    await otpModel.saveOTP(email, kodeOTP, expiredAt);

    // Kirim email
    const emailResult = await sendOTPEmail(email, kodeOTP);

    if (!emailResult.success) {
      console.error("Gagal kirim email:", emailResult.error);
      return error(res, "Gagal mengirim email OTP", 500);
    }

    return success(res, "Kode OTP berhasil dikirim ke email Anda");
  } catch (err) {
    console.error("[lupaPassword] Error:", err);
    return serverError(res, err, "lupaPassword");
  }
};

// Verifikasi kode OTP
exports.verifikasiOTP = async (req, res) => {
  try {
    const { email, kodeOTP } = req.body;

    // Validasi
    if (!email || !kodeOTP) {
      return error(res, "Email dan kode OTP wajib diisi", 400);
    }

    if (kodeOTP.length !== 6) {
      return error(res, "Kode OTP harus 6 digit", 400);
    }

    // Verifikasi OTP
    const otpData = await otpModel.verifyOTP(email, kodeOTP);

    if (!otpData) {
      return error(res, "Kode OTP tidak valid atau sudah kadaluarsa", 400);
    }

    // Tandai OTP sebagai sudah digunakan
    await otpModel.markOTPAsUsed(otpData.id_otp);

    return success(res, "Kode OTP valid", {
      email: otpData.email,
    });
  } catch (err) {
    console.error("[verifikasiOTP] Error:", err);
    return serverError(res, err, "verifikasiOTP");
  }
};

// Reset password setelah OTP diverifikasi
exports.resetPassword = async (req, res) => {
  try {
    const { email, passwordBaru, konfirmasiPassword } = req.body;

    // Validasi
    if (!email || !passwordBaru || !konfirmasiPassword) {
      return error(res, "Semua field wajib diisi", 400);
    }

    if (passwordBaru.length < 8) {
      return error(res, "Password minimal 8 karakter", 400);
    }

    if (passwordBaru !== konfirmasiPassword) {
      return error(res, "Konfirmasi password tidak sama", 400);
    }

    // Cek apakah email terdaftar
    const [users] = await db.query(
      "SELECT id_user FROM users WHERE email = ?",
      [email],
    );

    if (users.length === 0) {
      return error(res, "Email tidak terdaftar", 404);
    }

    const userId = users[0].id_user;

    // Hash password baru
    const hashedPassword = await bcrypt.hash(passwordBaru, 10);

    // Update password di database
    await db.query(
      "UPDATE users SET password = ?, updated_at = NOW() WHERE id_user = ?",
      [hashedPassword, userId],
    );

    return success(res, "Password berhasil diubah");
  } catch (err) {
    console.error("[resetPassword] Error:", err);
    return serverError(res, err, "resetPassword");
  }
};
