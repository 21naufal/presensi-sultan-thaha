const { success, error, serverError } = require("../utils/responseHelper");
const pegawaiModel = require("../models/pegawaiModel");
const db = require("../config/db");
const logModel = require("../models/logModel");

// ambil list semua pegawai dengan filter
exports.getPegawai = async (req, res) => {
  try {
    const { search, unit_id, status } = req.query;

    const filters = {
      search: search || "",
      unitId: unit_id || null,
      status: status || null,
    };

    const pegawai = await pegawaiModel.getAllPegawai(filters);
    return success(res, "Data pegawai berhasil diambil", pegawai);
  } catch (err) {
    return serverError(res, err, "getPegawai");
  }
};

// ambil detail per pegawai
exports.getPegawaiById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await pegawaiModel.getPegawaiById(id);

    if (!data) {
      return error(res, "Pegawai tidak ditemukan", 404);
    }

    return success(res, "Data pegawai berhasil diambil", data);
  } catch (err) {
    return serverError(res, err, "getPegawaiById");
  }
};

// tambah pegawai baru + akun user untuk login
exports.createPegawai = async (req, res) => {
  try {
    const {
      nama,
      jenisKelamin,
      unitId,
      noHp,
      email,
      tanggalMulaiKerja,
      password,
      status,
    } = req.body;

    // validasi required fields
    if (
      !nama ||
      !jenisKelamin ||
      !unitId ||
      !noHp ||
      !tanggalMulaiKerja ||
      !password
    ) {
      return error(
        res,
        "Nama, Jenis Kelamin, Unit, No HP, Tanggal Mulai Kerja, dan Password wajib diisi",
        400,
      );
    }

    // validasi format no hp (Indonesia)
    const phoneRegex = /^08[0-9]{8,11}$/;
    if (!phoneRegex.test(noHp)) {
      return error(
        res,
        "Format No. HP tidak valid (contoh: 081234567890)",
        400,
      );
    }

    // validasi password minimal 8 karakter
    if (password.length < 8) {
      return error(res, "Password minimal 8 karakter", 400);
    }

    // cek duplikat no hp atau email
    const existing = await pegawaiModel.getAllPegawai({ search: noHp });
    if (existing.some((p) => p.noHp === noHp)) {
      return error(res, "No. HP sudah terdaftar", 409);
    }

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return error(res, "Format email tidak valid", 400);
      }
      if (existing.some((p) => p.email === email)) {
        return error(res, "Email sudah terdaftar", 409);
      }
    }

    // cek apakah unit ada
    const unitList = await pegawaiModel.getUnitList();
    if (!unitList.some((u) => u.id === parseInt(unitId))) {
      return error(res, "Unit tidak ditemukan", 404);
    }

    const newPegawai = await pegawaiModel.createPegawai(
      {
        nama,
        jenisKelamin,
        unitId: parseInt(unitId),
        noHp,
        email: email || null,
        fotoProfil: null,
        tanggalMulaiKerja,
        status: status || "aktif",
      },
      {
        username: noHp, // username = no_hp untuk login pegawai
        unitName: unitList.find((u) => u.id === parseInt(unitId))?.namaUnit,
      },
      password,
    );

    // LOG: Create pegawai
    await logModel.create(
      req.user.id_user,
      "CREATE_PEGAWAI",
      JSON.stringify({
        nama,
        noHp,
        email,
        unitId,
        unitName: unitList.find((u) => u.id === parseInt(unitId))?.namaUnit,
        jenisKelamin,
        tanggalMulaiKerja,
        message: "Pegawai berhasil ditambahkan",
      }),
    );

    return success(res, "Pegawai berhasil ditambahkan", newPegawai, 201);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      if (err.sqlMessage?.includes("no_hp")) {
        return error(res, "No. HP sudah terdaftar", 409);
      }
      if (err.sqlMessage?.includes("email")) {
        return error(res, "Email sudah terdaftar", 409);
      }
    }
    return serverError(res, err, "createPegawai");
  }
};

// update data pegawai
exports.updatePegawai = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nama,
      jenisKelamin,
      unitId,
      noHp,
      email,
      tanggalMulaiKerja,
      password,
      status,
    } = req.body;

    // cek apakah pegawai ada
    const existing = await pegawaiModel.getPegawaiById(id);
    if (!existing) {
      return error(res, "Pegawai tidak ditemukan", 404);
    }

    // validasi no hp unik (kecuali milik sendiri)
    if (noHp !== existing.noHp) {
      const phoneRegex = /^08[0-9]{8,11}$/;
      if (!phoneRegex.test(noHp)) {
        return error(res, "Format No. HP tidak valid", 400);
      }
      const allPegawai = await pegawaiModel.getAllPegawai();
      if (allPegawai.some((p) => p.noHp === noHp && p.id !== parseInt(id))) {
        return error(res, "No. HP sudah terdaftar", 409);
      }
    }

    // validasi username baru tidak boleh dipakai user lain
    if (noHp !== existing.noHp) {
      // cek di tabel users apakah username sudah dipakai
      const [userCheck] = await db.query(
        `SELECT id_user FROM users WHERE username = ? AND pegawai_id != ?`,
        [noHp, id],
      );

      if (userCheck.length > 0) {
        return error(res, "No. HP sudah terdaftar", 409);
      }
    }

    // validasi password jika diisi
    if (password && password.trim() !== "") {
      if (password.length < 8) {
        return error(res, "Password minimal 8 karakter", 400);
      }
    }

    if (email && email !== existing.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(email)) {
        return error(res, "Format email tidak valid", 400);
      }

      const [emailCheck] = await db.query(
        `
      SELECT p.id_pegawai
      FROM pegawai p
      WHERE p.email = ?
      AND p.id_pegawai != ?
    `,
        [email, id],
      );

      if (emailCheck.length > 0) {
        return error(res, "Email sudah terdaftar", 409);
      }
    }

    const updatedPegawai = await pegawaiModel.updatePegawai(
      id,
      {
        nama,
        jenisKelamin,
        unitId: parseInt(unitId),
        noHp,
        email: email || null,
        tanggalMulaiKerja,
        status,
      },
      password?.trim() || null,
    );

    // LOG: Update pegawai
    await logModel.create(
      req.user.id_user,
      "EDIT_PEGAWAI",
      JSON.stringify({
        id,
        namaLama: existing.nama,
        namaBaru: nama,
        noHpLama: existing.noHp,
        noHpBaru: noHp,
        unitId,
        email,
        status,
        passwordDiubah: password && password.trim() !== "",
        message: "Pegawai berhasil diperbarui",
      }),
    );

    return success(res, "Pegawai berhasil diperbarui", updatedPegawai);
  } catch (err) {
    if (err.message === "Pegawai tidak ditemukan") {
      return error(res, "Pegawai tidak ditemukan", 404);
    }
    if (err.code === "ER_DUP_ENTRY") {
      return error(res, "No. HP atau Email sudah terdaftar", 409);
    }
    return serverError(res, err, "updatePegawai");
  }
};

// nonaktifkan pegawai
exports.deactivatePegawai = async (req, res) => {
  try {
    const { id } = req.params;

    // cek apakah pegawai ada dan masih aktif
    const existing = await pegawaiModel.getPegawaiById(id);
    if (!existing) {
      return error(res, "Pegawai tidak ditemukan", 404);
    }

    if (existing.status === "nonaktif") {
      return error(res, "Pegawai sudah nonaktif", 400);
    }

    await pegawaiModel.deactivatePegawai(id);

    // LOG: Nonaktifkan pegawai
    await logModel.create(
      req.user.id_user,
      "NONAKTIFKAN_PEGAWAI",
      JSON.stringify({
        id,
        nama: existing.nama,
        noHp: existing.noHp,
        statusLama: existing.status,
        statusBaru: "nonaktif",
        message: "Pegawai berhasil dinonaktifkan",
      }),
    );

    return success(res, "Pegawai berhasil dinonaktifkan", null, 204);
  } catch (err) {
    return serverError(res, err, "deactivatePegawai");
  }
};

// ambil list unit untuk dropdown dalam form
exports.getUnitList = async (req, res) => {
  try {
    const units = await pegawaiModel.getUnitList();
    return success(res, "Data unit berhasil diambil", units);
  } catch (err) {
    return serverError(res, err, "getUnitList");
  }
};

// update nama admin (untuk halaman profil)
exports.updateAdminNama = async (req, res) => {
  try {
    const { userId } = req.params;
    const { nama } = req.body;

    // validasi
    if (!nama || nama.trim() === "") {
      return error(res, "Nama wajib diisi", 400);
    }

    // cek apakah user ada dan role admin
    const [users] = await db.query(
      `SELECT * FROM users WHERE id_user = ? AND role = 'admin'`,
      [userId],
    );

    if (users.length === 0) {
      return error(res, "Admin tidak ditemukan", 404);
    }

    const updated = await pegawaiModel.updateAdminNama(userId, nama.trim());

    if (!updated) {
      return error(res, "Gagal update nama admin", 500);
    }

    // LOG: Update nama admin
    await logModel.create(
      userId,
      "EDIT_ADMIN_NAMA",
      JSON.stringify({
        userId,
        namaLama: users[0].nama,
        namaBaru: nama.trim(),
        message: "Nama admin berhasil diperbarui",
      }),
    );

    return success(res, "Nama admin berhasil diperbarui", {
      nama: nama.trim(),
    });
  } catch (err) {
    return serverError(res, err, "updateAdminNama");
  }
};

// ambil user detail (untuk profil)
exports.getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const data = await pegawaiModel.getUserById(userId);

    if (!data) {
      return error(res, "User tidak ditemukan", 404);
    }

    return success(res, "Data user berhasil diambil", data);
  } catch (err) {
    return serverError(res, err, "getUserById");
  }
};

// BAGIAN ADMIN: Profil Admin
// ambil profil admin yang sedang login
exports.getAdminProfile = async (req, res) => {
  try {
    const userId = req.user.id_user;

    // cek apakah user adalah admin
    const [users] = await db.query(
      `SELECT id_user, username, nama, email, no_hp, role, status 
       FROM users 
       WHERE id_user = ? AND role = 'admin'`,
      [userId],
    );

    if (users.length === 0) {
      return error(res, "Admin tidak ditemukan", 404);
    }

    const user = users[0];

    return success(res, "Data profil berhasil diambil", {
      id: user.id_user,
      username: user.username,
      nama: user.nama || "-",
      email: user.email || "-",
      noHp: user.no_hp || "-",
      role: user.role,
      status: user.status,
    });
  } catch (err) {
    console.error("[getAdminProfile] Error:", err);
    return serverError(res, err, "getAdminProfile");
  }
};

// update profil admin (nama, email, no_hp)
exports.updateAdminProfile = async (req, res) => {
  try {
    const userId = req.user.id_user;
    const { nama, email, noHp } = req.body;

    // validasi
    if (!nama || nama.trim() === "") {
      return error(res, "Nama wajib diisi", 400);
    }

    // validasi email jika diisi
    if (email && email.trim() !== "") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return error(res, "Format email tidak valid", 400);
      }

      // cek email duplikat (kecuali milik sendiri)
      const [emailCheck] = await db.query(
        `SELECT id_user FROM users WHERE email = ? AND id_user != ?`,
        [email, userId],
      );
      if (emailCheck.length > 0) {
        return error(res, "Email sudah terdaftar", 409);
      }
    }

    // validasi no_hp jika diisi
    if (noHp && noHp.trim() !== "") {
      const phoneRegex = /^08[0-9]{8,11}$/;
      if (!phoneRegex.test(noHp)) {
        return error(
          res,
          "Format No. HP tidak valid (contoh: 081234567890)",
          400,
        );
      }

      // cek no_hp duplikat (kecuali milik sendiri)
      const [phoneCheck] = await db.query(
        `SELECT id_user FROM users WHERE no_hp = ? AND id_user != ?`,
        [noHp, userId],
      );
      if (phoneCheck.length > 0) {
        return error(res, "No. HP sudah terdaftar", 409);
      }
    }

    // update data
    await db.query(
      `UPDATE users SET 
        nama = ?, 
        email = ?, 
        no_hp = ?,
        updated_at = NOW()
       WHERE id_user = ?`,
      [nama.trim(), email?.trim() || null, noHp?.trim() || null, userId],
    );

    // LOG: Update profil admin
    await logModel.create(
      userId,
      "EDIT_ADMIN_PROFILE",
      JSON.stringify({
        userId,
        nama: nama.trim(),
        email: email?.trim() || null,
        noHp: noHp?.trim() || null,
        message: "Profil admin berhasil diperbarui",
      }),
    );

    return success(res, "Profil berhasil diperbarui", {
      nama: nama.trim(),
      email: email?.trim() || null,
      noHp: noHp?.trim() || null,
    });
  } catch (err) {
    console.error("[updateAdminProfile] Error:", err);
    return serverError(res, err, "updateAdminProfile");
  }
};

// ubah password admin
exports.changeAdminPassword = async (req, res) => {
  try {
    const userId = req.user.id_user;
    const { sandiLama, sandiBaru, konfirmasiSandiBaru } = req.body;

    // validasi
    if (!sandiLama || !sandiBaru || !konfirmasiSandiBaru) {
      return error(res, "Semua field password wajib diisi", 400);
    }

    if (sandiBaru.length < 8) {
      return error(res, "Password baru minimal 8 karakter", 400);
    }

    if (sandiBaru !== konfirmasiSandiBaru) {
      return error(res, "Konfirmasi password baru tidak sama", 400);
    }

    // ambil password lama dari database
    const [users] = await db.query(
      `SELECT password FROM users WHERE id_user = ?`,
      [userId],
    );

    if (users.length === 0) {
      return error(res, "User tidak ditemukan", 404);
    }

    const user = users[0];

    // verifikasi password lama
    const match = await bcrypt.compare(sandiLama, user.password);
    if (!match) {
      return error(res, "Kata sandi lama salah", 401);
    }

    // hash password baru
    const hashedPassword = await bcrypt.hash(sandiBaru, 10);

    // update password
    await db.query(
      `UPDATE users SET password = ?, updated_at = NOW() WHERE id_user = ?`,
      [hashedPassword, userId],
    );

    // LOG: Ubah password
    await logModel.create(
      userId,
      "CHANGE_PASSWORD",
      JSON.stringify({
        userId,
        message: "Password berhasil diubah",
      }),
    );

    return success(res, "Password berhasil diubah");
  } catch (err) {
    console.error("[changeAdminPassword] Error:", err);
    return serverError(res, err, "changeAdminPassword");
  }
};
