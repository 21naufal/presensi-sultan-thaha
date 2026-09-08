import { Navigate, Routes, Route } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { lazy, Suspense } from "react";

// Komponen loading (spinner) saat halaman sedang dimuat
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0984E3]"></div>
  </div>
);

// Lazy load halaman-halaman pegawai
const RegisterFace = lazy(
  () => import("../components/RegisterFace/RegisterFace"),
);
const UbahSandiPage = lazy(() => import("../components/pegawai/UbahSandiPage"));
const PegawaiDashboard = lazy(
  () => import("../pages/pegawai/PegawaiDashboard"),
);
const JadwalPage = lazy(() => import("../pages/pegawai/JadwalPage"));
const RiwayatPage = lazy(() => import("../pages/pegawai/RiwayatPage"));
const ProfilPage = lazy(() => import("../pages/pegawai/ProfilPage"));
const PanduanPage = lazy(() => import("../pages/pegawai/PanduanPage"));
const PresensiPage = lazy(() => import("../pages/pegawai/PresensiPage"));

const PegawaiRoutes = () => {
  const { user } = useAuth();

  // PROTEKSI RUTE: Redirect ke home jika bukan pegawai
  if (!user || user.role !== "pegawai") {
    return <Navigate to="/" replace />;
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Halaman Registrasi Wajah (Hanya muncul jika belum terdaftar) */}
        <Route
          path="register-face"
          element={
            user.faceRegistered ? (
              <Navigate to="/pegawai/dashboard" replace />
            ) : (
              <RegisterFace />
            )
          }
        />

        {/* 
          VALIDASI WAJIB: Setiap halaman di bawah ini mengecek status faceRegistered. 
          Jika user belum registrasi wajah, mereka akan dipaksa redirect ke halaman register-face.
        */}

        <Route
          path="dashboard"
          element={
            user.faceRegistered ? (
              <PegawaiDashboard />
            ) : (
              <Navigate to="/pegawai/register-face" replace />
            )
          }
        />

        <Route
          path="panduan"
          element={
            user.faceRegistered ? (
              <PanduanPage />
            ) : (
              <Navigate to="/pegawai/register-face" replace />
            )
          }
        />

        <Route
          path="jadwal"
          element={
            user.faceRegistered ? (
              <JadwalPage />
            ) : (
              <Navigate to="/pegawai/register-face" replace />
            )
          }
        />

        <Route
          path="riwayat"
          element={
            user.faceRegistered ? (
              <RiwayatPage />
            ) : (
              <Navigate to="/pegawai/register-face" replace />
            )
          }
        />

        <Route
          path="profil"
          element={
            user.faceRegistered ? (
              <ProfilPage />
            ) : (
              <Navigate to="/pegawai/register-face" replace />
            )
          }
        />

        <Route
          path="ubah-sandi"
          element={
            user.faceRegistered ? (
              <UbahSandiPage />
            ) : (
              <Navigate to="/pegawai/register-face" replace />
            )
          }
        />

        {/* Halaman Presensi (Masuk/Pulang) */}
        <Route
          path="presensi/:type"
          element={
            user.faceRegistered ? (
              <PresensiPage />
            ) : (
              <Navigate to="/pegawai/register-face" replace />
            )
          }
        />

        {/* Redirect jika URL tidak ditemukan */}
        <Route
          path="*"
          element={
            <Navigate
              to={
                user.faceRegistered
                  ? "/pegawai/dashboard"
                  : "/pegawai/register-face"
              }
              replace
            />
          }
        />
      </Routes>
    </Suspense>
  );
};

export default PegawaiRoutes;
