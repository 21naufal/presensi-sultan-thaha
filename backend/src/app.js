// Set zona waktu server ke WIB (Asia/Jakarta) agar konsisten dengan frontend
process.env.TZ = "Asia/Jakarta";

const express = require("express");
const cors = require("cors");
const path = require("path");

// Import semua rute (routes) API
const authRoutes = require("./routes/authRoutes");
const faceRoutes = require("./routes/faceRoutes");
const unitRoutes = require("./routes/unitRoutes");
const shiftRoutes = require("./routes/shiftRoutes");
const pegawaiRoutes = require("./routes/pegawaiRoutes");
const jadwalRoutes = require("./routes/jadwalRoutes");
const presensiPegawaiRoutes = require("./routes/presensiPegawaiRoutes");
const presensiAdminRoutes = require("./routes/presensiAdminRoutes");
const logRoutes = require("./routes/logRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const pegawaiProfileRoutes = require("./routes/pegawaiProfileRoutes");
const pegawaiJadwalRoutes = require("./routes/pegawaiJadwalRoutes");

const app = express();

// Middleware: Izinkan akses lintas domain (CORS) dan parsing JSON (limit 10MB untuk foto)
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Health check endpoint
app.get("/", (req, res) => {
  res.send("API Sistem Presensi non-BUMN Sultan Thaha berjalan");
});

// RUTE API UNTUK PEGAWAI (MOBILE/FRONTEND)
app.use("/api/presensi", presensiPegawaiRoutes);
app.use("/api/pegawai/jadwal", pegawaiJadwalRoutes);
app.use("/api/pegawai", pegawaiProfileRoutes);

// RUTE API AUTENTIKASI & MASTER DATA
app.use("/api/auth", authRoutes);
app.use("/api/face", faceRoutes);
app.use("/api/units", unitRoutes);
app.use("/api", shiftRoutes);
app.use("/api/employees", pegawaiRoutes);
app.use("/api/schedules", jadwalRoutes);

// RUTE API KHUSUS ADMIN
app.use("/api/admin/presensi", presensiAdminRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Serve file statis dari folder uploads (untuk foto presensi)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

module.exports = app;
