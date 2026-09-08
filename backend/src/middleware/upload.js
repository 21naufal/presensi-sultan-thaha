const multer = require("multer");
const path = require("path");
const fs = require("fs");

// pastikan folder uploads ada
const uploadsDir = path.join(__dirname, "../uploads/bukti-perubahan");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// konfigurasi storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "bukti-" + uniqueSuffix + path.extname(file.originalname));
  },
});

// filter file (hanya image & PDF)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase(),
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Hanya file gambar (JPEG, JPG, PNG) dan PDF yang diperbolehkan!",
      ),
    );
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // max 5MB
  fileFilter: fileFilter,
});

module.exports = upload;
