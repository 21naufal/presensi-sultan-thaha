import { Navigate, Routes, Route } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AdminLayout from "../components/layout/AdminLayout";
import { lazy, Suspense } from "react";

// Komponen loading (spinner) saat halaman sedang dimuat
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0984E3]"></div>
  </div>
);

// Lazy load halaman & form admin (untuk optimasi performa awal)
const AdminDashboard = lazy(() => import("../pages/admin/Dashboard"));
const UnitKerja = lazy(() => import("../pages/admin/UnitKerja"));
const ShiftUnit = lazy(() => import("../pages/admin/ShiftUnit"));
const Pegawai = lazy(() => import("../pages/admin/Pegawai"));
const JadwalUnit = lazy(() => import("../pages/admin/JadwalUnit"));
const RekapLaporan = lazy(() => import("../pages/admin/RekapLaporan"));
const Panduan = lazy(() => import("../pages/admin/Panduan"));
const Profil = lazy(() => import("../pages/admin/Profil"));
const Aktivitas = lazy(() => import("../pages/admin/Aktivitas"));

const FormUnitKerja = lazy(() => import("../components/admin/FormUnitKerja"));
const FormShiftUnit = lazy(() => import("../components/admin/FormShiftUnit"));
const FormPegawai = lazy(() => import("../components/admin/FormPegawai"));
const JadwalUnitList = lazy(() => import("../components/admin/JadwalUnitList"));
const JadwalUnitDetail = lazy(
  () => import("../components/admin/JadwalUnitDetail"),
);
const JadwalKaryawanDetail = lazy(
  () => import("../components/admin/JadwalKaryawanDetail"),
);
const EditProfil = lazy(() => import("../components/admin/EditProfil"));
const PeriodeLaporan = lazy(() => import("../components/admin/PeriodeLaporan"));
const UnitKerjaLaporan = lazy(
  () => import("../components/admin/UnitKerjaLaporan"),
);
const RekapKehadiran = lazy(() => import("../components/admin/RekapKehadiran"));
const DetailPresensiKaryawan = lazy(
  () => import("../components/admin/DetailPresensiKaryawan"),
);

const AdminRoutes = () => {
  const { user } = useAuth();

  // PROTEKSI RUTE: Redirect ke home jika bukan admin
  if (!user || user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Bungkus semua rute admin dengan AdminLayout (Sidebar & Navbar) */}
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />

          {/* Rute Halaman Utama */}
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="unit-kerja" element={<UnitKerja />} />
          <Route path="unit-kerja/tambah" element={<FormUnitKerja />} />
          <Route path="unit-kerja/edit/:id" element={<FormUnitKerja />} />
          <Route path="shift-unit" element={<ShiftUnit />} />
          <Route path="shift-unit/tambah" element={<FormShiftUnit />} />
          <Route path="shift-unit/edit/:id" element={<FormShiftUnit />} />
          <Route path="pegawai" element={<Pegawai />} />
          <Route path="pegawai/tambah" element={<FormPegawai />} />
          <Route path="pegawai/edit/:id" element={<FormPegawai />} />

          {/* Rute Manajemen Jadwal */}
          <Route path="jadwal-unit" element={<JadwalUnit />} />
          <Route
            path="jadwal-unit/:year/:month/units"
            element={<JadwalUnitList />}
          />
          <Route
            path="jadwal-unit/:year/:month/units/:unitId/input"
            element={<JadwalUnitDetail />}
          />
          <Route
            path="jadwal-unit/:year/:month/units/:unitId/pegawai/:pegawaiId/detail"
            element={<JadwalKaryawanDetail />}
          />

          {/* Rute Rekap & Laporan */}
          <Route path="rekap-laporan" element={<RekapLaporan />} />
          <Route
            path="rekap-laporan/:year/:month/units"
            element={<UnitKerjaLaporan />}
          />
          <Route
            path="rekap-laporan/:year/:month/units/:unitId"
            element={<RekapKehadiran />}
          />
          <Route
            path="rekap-laporan/:year/:month/units/:unitId/pegawai/:pegawaiId/detail"
            element={<DetailPresensiKaryawan />}
          />

          {/* Rute Panduan & Lainnya */}
          <Route path="panduan" element={<Panduan />} />
          <Route path="profil" element={<Profil />} />
          <Route path="profil/edit" element={<EditProfil />} />
          <Route path="aktivitas" element={<Aktivitas />} />

          {/* Redirect jika URL tidak ditemukan (404) */}
          <Route
            path="*"
            element={<Navigate to="/admin/dashboard" replace />}
          />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default AdminRoutes;
