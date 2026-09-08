const fs = require("fs").promises;
const path = require("path");

const saveBase64Photo = async (base64Data, prefix, pegawaiId) => {
  if (!base64Data) return null;

  try {
    // Buat folder uploads/foto-presensi jika belum ada
    const uploadDir = path.join(__dirname, "../uploads/foto-presensi");
    await fs.mkdir(uploadDir, { recursive: true });

    // Generate nama file unik
    // Format: masuk_7_1717452345678_a1b2c3.jpg
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const fileName = `${prefix}_${pegawaiId}_${timestamp}_${randomStr}.jpg`;
    const filePath = path.join(uploadDir, fileName);

    // Convert base64 ke buffer dan simpan ke file
    const buffer = Buffer.from(base64Data, "base64");
    await fs.writeFile(filePath, buffer);

    // Return path relatif (untuk disimpan di database & diakses via URL)
    return `/uploads/foto-presensi/${fileName}`;
  } catch (err) {
    console.error("[saveBase64Photo] Error:", err.message);
    return null;
  }
};

module.exports = { saveBase64Photo };
