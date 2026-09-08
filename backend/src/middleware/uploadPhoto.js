const multer = require("multer");
const path = require("path");
const fs = require("fs");

// pastikan folder foto-profil ada
const fotoProfilDir = path.join(__dirname, "../uploads/foto-profil");
if (!fs.existsSync(fotoProfilDir)) {
  fs.mkdirSync(fotoProfilDir, { recursive: true });
}

// konfigurasi storage untuk foto profil
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, fotoProfilDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "profil-" + uniqueSuffix + path.extname(file.originalname));
  },
});

// filter file (hanya image)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase(),
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Hanya file gambar (JPEG, JPG, PNG) yang diperbolehkan!"));
  }
};

const uploadPhoto = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // max 5MB
  fileFilter: fileFilter,
});

module.exports = uploadPhoto;
