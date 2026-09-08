const { success, error, serverError } = require("../utils/responseHelper");
const db = require("../config/db");
const bcrypt = require("bcrypt");
const path = require("path");
const fs = require("fs");

// Ambil data profil pegawai yang sedang login
exports.getProfile = async (req, res) => {
  try {
    const pegawaiId = req.user.pegawai_id;

    const query = `
      SELECT 
        p.id_pegawai,
        p.nama,
        p.jenis_kelamin as jenisKelamin,
        p.no_hp as noHp,
        p.email,
        p.foto_profil as fotoProfil,
        p.tanggal_mulai_kerja as tanggalMulaiKerja,
        p.status,
        u.id_unit as unitId,
        u.nama_unit as unitName
      FROM pegawai p
      LEFT JOIN unit u ON p.unit_id = u.id_unit
      WHERE p.id_pegawai = ?
    `;

    const [rows] = await db.query(query, [pegawaiId]);

    if (rows.length === 0) {
      return error(res, "Pegawai tidak ditemukan", 404);
    }

    const pegawai = rows[0];

    return success(res, "Data profil berhasil diambil", {
      id: pegawai.id_pegawai,
      nama: pegawai.nama,
      jenisKelamin: pegawai.jenisKelamin,
      noHp: pegawai.noHp,
      email: pegawai.email || "-",
      fotoProfil: pegawai.fotoProfil
        ? `${process.env.APP_URL || ""}${pegawai.fotoProfil}`
        : null,
      tanggalMulaiKerja: pegawai.tanggalMulaiKerja,
      status: pegawai.status,
      unit: {
        id: pegawai.unitId,
        nama: pegawai.unitName,
      },
    });
  } catch (err) {
    console.error("[getProfile] Error:", err);
    return serverError(res, err, "getProfile");
  }
};

// Ubah kata sandi pegawai
exports.changePassword = async (req, res) => {
  try {
    const pegawaiId = req.user.pegawai_id;
    const { sandiLama, sandiBaru, konfirmasiSandiBaru } = req.body;

    // Validasi
    if (!sandiLama || !sandiBaru || !konfirmasiSandiBaru) {
      return error(res, "Semua field password wajib diisi", 400);
    }

    if (sandiBaru.length < 8) {
      return error(res, "Password baru minimal 8 karakter", 400);
    }

    if (sandiBaru !== konfirmasiSandiBaru) {
      return error(res, "Konfirmasi password baru tidak sama", 400);
    }

    // Ambil password lama dari database (dari tabel users)
    const [users] = await db.query(
      `SELECT u.password FROM users u WHERE u.pegawai_id = ?`,
      [pegawaiId],
    );

    if (users.length === 0) {
      return error(res, "User tidak ditemukan", 404);
    }

    const user = users[0];

    // Verifikasi password lama
    const match = await bcrypt.compare(sandiLama, user.password);
    if (!match) {
      return error(res, "Kata Sandi lama salah", 401);
    }

    // Hash password baru
    const hashedPassword = await bcrypt.hash(sandiBaru, 10);

    // Update password
    await db.query(
      `UPDATE users SET password = ?, updated_at = NOW() WHERE pegawai_id = ?`,
      [hashedPassword, pegawaiId],
    );

    return success(res, "Password berhasil diubah");
  } catch (err) {
    console.error("[changePassword] Error:", err);
    return serverError(res, err, "changePassword");
  }
};

// Upload foto profil
exports.uploadPhoto = async (req, res) => {
  try {
    const pegawaiId = req.user.pegawai_id;

    if (!req.file) {
      return error(res, "File foto wajib diupload", 400);
    }

    // Path foto yang baru
    const fotoPath = `/uploads/foto-profil/${req.file.filename}`;

    // Hapus foto lama jika ada
    const [[oldData]] = await db.query(
      `SELECT foto_profil FROM pegawai WHERE id_pegawai = ?`,
      [pegawaiId],
    );

    if (oldData && oldData.foto_profil) {
      const oldPath = path.join(__dirname, "..", "..", oldData.foto_profil);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Update database
    await db.query(
      `UPDATE pegawai SET foto_profil = ?, updated_at = NOW() WHERE id_pegawai = ?`,
      [fotoPath, pegawaiId],
    );

    return success(res, "Foto profil berhasil diupload", {
      fotoProfil: `${process.env.APP_URL || ""}${fotoPath}`,
    });
  } catch (err) {
    console.error("[uploadPhoto] Error:", err);
    return serverError(res, err, "uploadPhoto");
  }
};

// Hapus foto profil
exports.deletePhoto = async (req, res) => {
  try {
    const pegawaiId = req.user.pegawai_id;

    // Ambil foto lama
    const [[oldData]] = await db.query(
      `SELECT foto_profil FROM pegawai WHERE id_pegawai = ?`,
      [pegawaiId],
    );

    if (oldData && oldData.foto_profil) {
      const oldPath = path.join(__dirname, "..", "..", oldData.foto_profil);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Hapus dari database
    await db.query(
      `UPDATE pegawai SET foto_profil = NULL, updated_at = NOW() WHERE id_pegawai = ?`,
      [pegawaiId],
    );

    return success(res, "Foto profil berhasil dihapus");
  } catch (err) {
    console.error("[deletePhoto] Error:", err);
    return serverError(res, err, "deletePhoto");
  }
};
