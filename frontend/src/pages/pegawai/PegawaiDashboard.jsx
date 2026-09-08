// React
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Context
import { useAuth } from "../../context/AuthContext";

// Components
import BottomNav from "../../components/layout/BottomNav";
import FaceAttendance from "../../components/FaceAttendance/FaceAttendance";
import { HelpIcon } from "../../components/icons/SystemIcons";
import {
  HadirIcon,
  TanpaKeteranganIcon,
  TerlambatIcon,
} from "../../components/icons/AttendanceIcons";

// Services
import api from "../../services/api";

// Utils
import {
  formatTime,
  formatDate,
  getMonthName,
  getGreeting,
} from "../../utils/timeUtils";

// konstanta interval timer
const CLOCK_UPDATE_INTERVAL = 1000;
const STATUS_CHECK_INTERVAL = 1000;

const PegawaiDashboard = () => {
  // Hooks
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // State waktu real time (update setiap detik)
  const [currentTime, setCurrentTime] = useState(new Date());

  // State untuk modal face attendance
  const [showFaceAttendance, setShowFaceAttendance] = useState(false);
  const [attendanceType, setAttendanceType] = useState(null);

  // State data profil (foto)
  const [profilePhoto, setProfilePhoto] = useState(null);

  // State status presensi hari ini
  const [attendanceStatus, setAttendanceStatus] = useState({
    hasSchedule: false, // Apakah ada jadwal shift hari ini
    shiftInfo: null, // Detail shift (nama, jam, lokasi)
    hasCheckedIn: false, // Sudah check in
    hasCheckedOut: false, // Sudah check out
    canCheckIn: false, // Boleh check-in (1 jam sebelum shift)
    canCheckOut: false, // Boleh check-out (saat jam pulang)
    loading: true, // Status loading
  });

  // State rekap presensi bulan ini
  const [attendanceSummary, setAttendanceSummary] = useState({
    hadir: 0,
    tanpaKeterangan: 0,
    terlambat: 0,
  });

  // State riwayat presensi
  const [attendanceHistory, setAttendanceHistory] = useState([]);

  // Fetch data profil (foto) dari server
  const fetchProfilePhoto = async () => {
    try {
      const response = await api.get("/pegawai/profile");
      if (response.data.status === "success") {
        setProfilePhoto(response.data.data.fotoProfil);
      }
    } catch (err) {
      console.error("Error fetching profile photo:", err);
    }
  };

  // Fetch data status presensi hari ini dari server
  const fetchAttendanceStatus = async () => {
    try {
      const response = await api.get("/presensi/status");
      if (response.data.status === "success") {
        setAttendanceStatus({
          ...response.data.data,
          loading: false,
        });
      }
    } catch (err) {
      console.error("Error fetching attendance status:", err);
      setAttendanceStatus((prev) => ({ ...prev, loading: false }));
    }
  };

  // Fetch data rekap presensi bulan ini dari server
  const fetchAttendanceSummary = async () => {
    try {
      const response = await api.get("/presensi/pegawai/summary");
      if (response.data.status === "success") {
        setAttendanceSummary(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching attendance summary:", err);
    }
  };

  // Fetch data riwayat presensi dari server
  const fetchAttendanceHistory = async () => {
    try {
      const response = await api.get("/presensi/pegawai/history");
      if (response.data.status === "success") {
        setAttendanceHistory(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching attendance history:", err);
    }
  };

  // Fetch semua data sekaligus setelah presensi berhasil
  const fetchAllData = () => {
    fetchProfilePhoto();
    fetchAttendanceStatus();
    fetchAttendanceSummary();
    fetchAttendanceHistory();
  };

  // update jad tiap detik
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, CLOCK_UPDATE_INTERVAL);

    return () => clearInterval(timer);
  }, []);

  // Fetch data awal dan auto refresh status
  useEffect(() => {
    // Fetch semua data saat pertama kali dibuka
    fetchAllData();

    // Auto-refresh status presensi setiap 1 detik
    const statusTimer = setInterval(() => {
      fetchAttendanceStatus();
    }, STATUS_CHECK_INTERVAL);

    // Cleanup interval saat komponen unmount
    return () => clearInterval(statusTimer);
  }, []);

  // Handle buka halaman panduan
  const handlePanduan = () => {
    navigate("/pegawai/panduan");
  };

  // Handle buka presensi masuk
  const handlePresensiMasuk = () => {
    if (!attendanceStatus.canCheckIn) return;
    setAttendanceType("masuk");
    setShowFaceAttendance(true);
  };

  // Handle buka presensi pulang
  const handlePresensiKeluar = () => {
    if (!attendanceStatus.canCheckOut) return;
    setAttendanceType("pulang");
    setShowFaceAttendance(true);
  };

  // Handle presensi berhasil
  const handleAttendanceSuccess = (data) => {
    console.log("Attendance recorded:", data);
    setShowFaceAttendance(false);
    setAttendanceType(null);
    fetchAllData();
  };

  // Handle tutup face attendance
  const handleCloseAttendance = () => {
    setShowFaceAttendance(false);
    setAttendanceType(null);
  };

  // Helper konfigurasi tombol presensi
  const getButtonConfig = () => {
    // State 1 Loading
    if (attendanceStatus.loading) {
      return {
        text: "Tunggu Sebentar...",
        disabled: true,
        color: "bg-gray-400",
        subtext: "",
        isCheckInBesok: false,
      };
    }

    // State 2 Tidak ada jadwal
    if (!attendanceStatus.hasSchedule) {
      return {
        text: "Tidak Ada Jadwal Hari Ini",
        disabled: true,
        color: "bg-gray-400",
        subtext: attendanceStatus.message || "Anda tidak memiliki jadwal shift",
        isCheckInBesok: false,
      };
    }

    const {
      shiftInfo,
      hasCheckedIn,
      hasCheckedOut,
      canCheckIn,
      canCheckOut,
      canCheckInBesok,
      jamMasukBesok,
    } = attendanceStatus;

    // State 3 Sudah check-in, belum check-out, tapi sudah lewat batas (tampilkan check-in besok)
    if (hasCheckedIn && !hasCheckedOut && canCheckInBesok) {
      return {
        text: "PRESENSI MASUK",
        disabled: false,
        color: "bg-orange-500 hover:bg-orange-600",
        subtext: "Anda belum check-out. Silakan check-in untuk jadwal besok.",
        isCheckInBesok: true,
      };
    }

    // State 4 Sudah check-out (selesai)
    if (hasCheckedOut) {
      return {
        text: "PRESENSI MASUK",
        disabled: true,
        color: "bg-gray-500",
        subtext: "Anda sudah menyelesaikan presensi hari ini",
        isCheckInBesok: false,
      };
    }

    // State 5 Sudah check-in, belum waktunya pulang
    if (hasCheckedIn && !canCheckOut) {
      return {
        text: "PRESENSI PULANG",
        disabled: true,
        color: "bg-gray-400",
        subtext: `Tunggu hingga pukul ${shiftInfo.jamSelesai} untuk presensi pulang`,
        isCheckInBesok: false,
      };
    }

    // State 6 Sudah check-in, bisa check-out
    if (hasCheckedIn && canCheckOut) {
      return {
        text: "PRESENSI PULANG",
        disabled: false,
        color: "bg-[#0984E3] hover:bg-[#0975c8]",
        subtext: `Waktu pulang: ${shiftInfo.jamSelesai}`,
        isCheckInBesok: false,
      };
    }

    // State 7 Belum check-in, bisa check-in
    if (!hasCheckedIn && canCheckIn) {
      return {
        text: "PRESENSI MASUK",
        disabled: false,
        color: "bg-[#0984E3] hover:bg-[#0975c8]",
        subtext: `Shift: ${shiftInfo.namaShift} (${shiftInfo.jamMulai} - ${shiftInfo.jamSelesai})`,
        isCheckInBesok: false,
      };
    }

    // State 8 Belum check-in, belum waktunya
    if (!hasCheckedIn && !canCheckIn) {
      return {
        text: "PRESENSI MASUK",
        disabled: true,
        color: "bg-gray-400",
        subtext: `Presensi masuk dibuka 1 jam sebelum jam kerja (${shiftInfo.jamMulai})`,
        isCheckInBesok: false,
      };
    }

    // Fallback
    return {
      text: "Tidak Tersedia",
      disabled: true,
      color: "bg-gray-400",
      subtext: "",
      isCheckInBesok: false,
    };
  };

  // Handle buka presensi masuk untuk besok (jika sudah lewat batas check-out)
  const handlePresensiMasukBesok = () => {
    setAttendanceType("masuk");
    setShowFaceAttendance(true);
  };

  // computed values
  const greeting = getGreeting(currentTime);
  const buttonConfig = getButtonConfig();

  // UI Tampilan halaman utama
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0974c6] to-[#0984E3] text-white p-6 rounded-b-3xl shadow-lg relative">
        {/* tombol Panduan */}
        <button
          onClick={handlePanduan}
          className="absolute top-4 right-4 p-2 rounded-full z-10"
          title="Panduan"
        >
          <HelpIcon />
        </button>

        {/* info Profil & Sapaan */}
        <div className="flex items-center gap-4 flex-1 -mt-4">
          {/* foto profil dengan Fallback */}
          <div className="w-20 h-20 rounded-full bg-blue-300 p-0.5 shadow-md">
            {profilePhoto ? (
              <img
                src={profilePhoto}
                alt={user?.nama || "User"}
                className="w-full h-full rounded-full object-cover"
                onError={(e) => {
                  // Fallback ke avatar jika foto gagal dimuat
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    user?.nama || "User",
                  )}&background=0984E3&color=fff&size=150`;
                }}
              />
            ) : (
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                  user?.nama || "User",
                )}&background=0984E3&color=fff&size=150`}
                alt={user?.nama || "User"}
                className="w-full h-full rounded-full object-cover"
              />
            )}
          </div>

          {/* Sapaan & Nama */}
          <div className="flex-1 pt-4 pr-0 pb-5">
            <p className="text-sm opacity-90">{greeting},</p>
            <h1 className="text-base font-bold">
              {user?.nama || "Pegawai Sultan Thaha"}
            </h1>
            <p className="text-[10px] font-medium">
              Presensi masuk dibuka 1 jam sebelum jam kerja dan presensi pulang
              dibuka tepat saat jam pulang!
            </p>
          </div>
        </div>
      </div>

      {/* Time Card */}
      <div className="bg-white mx-4 -mt-6 rounded-2xl shadow-xl p-6 relative z-10">
        <div className="text-center">
          {/* jam real time */}
          <h2 className="text-5xl font-bold text-gray-800">
            {formatTime(currentTime)}
          </h2>
          <p className="text-gray-800 font-semibold pb-1">
            {formatDate(currentTime)}
          </p>

          {/* info S\shift (jika ada) */}
          {attendanceStatus.shiftInfo && (
            <div className="rounded-xl p-4 mb-2">
              <p className="text-gray-800 text-sm font-semibold">
                {attendanceStatus.shiftInfo.namaShift} (
                {attendanceStatus.shiftInfo.jamMulai} -{" "}
                {attendanceStatus.shiftInfo.jamSelesai})
              </p>
              <p className="text-gray-800 text-sm font-semibold">
                {attendanceStatus.shiftInfo.namaLokasi ||
                  "Lokasi tidak tersedia"}
              </p>
            </div>
          )}

          {/* tombol presensi dinamis */}
          <button
            onClick={
              buttonConfig.isCheckInBesok
                ? handlePresensiMasukBesok
                : attendanceStatus.hasCheckedIn
                  ? handlePresensiKeluar
                  : handlePresensiMasuk
            }
            disabled={buttonConfig.disabled}
            className={`w-full h-15 ${buttonConfig.color} text-white text-lg font-semibold py-3 px-6 rounded-xl transition-colors shadow-lg hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {buttonConfig.text}
          </button>
        </div>
      </div>

      {/* rekap presensi bulan ini */}
      <div className="mt-6 px-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800">Rekap Presensi</h3>
          <span className="text-gray-800 font-medium">
            Bulan {getMonthName(currentTime)}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {/* Card hadir */}
          <div className="bg-white rounded-2xl p-4 shadow-md text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <HadirIcon className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {attendanceSummary.hadir}
            </p>
            <p className="text-xs font-semibold text-gray-800 mt-1">Hadir</p>
          </div>

          {/* Card tanpa keterangan */}
          <div className="bg-white rounded-2xl p-4 shadow-md text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <TanpaKeteranganIcon className="w-6 h-6 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {attendanceSummary.tanpaKeterangan}
            </p>
            <p className="text-xs font-semibold text-gray-800 mt-1">
              Tanpa Keterangan
            </p>
          </div>

          {/* Card terlambat */}
          <div className="bg-white rounded-2xl p-4 shadow-md text-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <TerlambatIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {attendanceSummary.terlambat}
            </p>
            <p className="text-xs font-semibold text-gray-800 mt-1">
              Terlambat
            </p>
          </div>
        </div>
      </div>

      {/* Riwayat presensi terbaru */}
      <div className="mt-6 px-4">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          Riwayat Presensi
        </h3>

        <div className="space-y-3">
          {/* State Empty */}
          {attendanceHistory.length === 0 ? (
            <div className="bg-white rounded-xl p-8 shadow-md text-center">
              <p className="text-gray-500 text-sm">
                Belum ada riwayat presensi bulan ini
              </p>
            </div>
          ) : (
            // State Success
            attendanceHistory.map((item) => {
              // Border color berdasarkan status
              const borderColor =
                item.statusType === "late"
                  ? "border-yellow-400"
                  : "border-green-600";

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-xl p-4 shadow-md border-l-5 ${borderColor}`}
                >
                  <div className="flex justify-between items-start">
                    {/* tanggal & shift */}
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 text-sm">
                        {item.tanggalDisplay}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{item.shift}</p>
                    </div>

                    {/* tipe & waktu */}
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-800">
                        Presensi {item.tipe}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {item.waktu} - {item.status}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* modal Face Attendance */}
      {showFaceAttendance && (
        <FaceAttendance
          attendanceType={attendanceType}
          onClose={handleCloseAttendance}
          onAttendanceSuccess={handleAttendanceSuccess}
        />
      )}

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default PegawaiDashboard;
