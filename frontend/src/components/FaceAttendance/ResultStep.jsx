import React from "react";
import { useNavigate } from "react-router-dom";

const ResultStep = ({ attendanceData, onContinue, onRetry, isSuccess }) => {
  const navigate = useNavigate();

  // Render konten UI jika presensi ditolak
  const renderRejectContent = () => {
    if (!attendanceData) return null;

    const { isFakeGpsDetected, rejectReason } = attendanceData;

    // Tampilan khusus jika terdeteksi menggunakan Fake GPS
    if (isFakeGpsDetected) {
      return (
        <div className="w-full max-w-md mb-8">
          <div className="text-center">
            <p className="text-red-600 text-sm font-semibold leading-relaxed">
              {rejectReason}
            </p>

            <div className="mt-4 pt-4 border-t border-red-100">
              <p className="text-xs text-red-500 italic">
                Pastikan aplikasi Fake GPS dimatikan lalu coba presensi kembali.
              </p>
            </div>
          </div>
        </div>
      );
    }

    // Tampilan umum untuk penolakan lain (wajah tidak sesuai / diluar lokasi)
    return (
      <div className="w-full max-w-md mb-8">
        <div className="text-center">
          <p className="text-red-600 text-sm font-semibold leading-relaxed">
            {rejectReason}
          </p>

          <div className="mt-4 pt-4 border-t border-red-100">
            <p className="text-xs text-red-500 italic">
              {rejectReason?.toLowerCase().includes("luar area")
                ? "Pastikan anda berada di area presensi yang telah ditentukan."
                : rejectReason?.toLowerCase().includes("challenge")
                  ? "Anda terdeteksi memanipulasi gerakan challenge, pastikan anda mengikuti instruksi challenge dengan benar."
                  : rejectReason?.toLowerCase().includes("fake gps")
                    ? "Matikan aplikasi Fake GPS lalu coba kembali."
                    : rejectReason?.toLowerCase().includes("tidak cocok")
                      ? "Mohon gunakan wajah asli anda sendiri, dan jangan gunakan wajah orang lain"
                      : "Silakan coba kembali."}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center p-6">
      {/* Ikon status presensi */}
      <div className="mb-8 flex justify-center">
        {isSuccess ? (
          <img
            src="/assets/icons/sukses.svg"
            alt="sukses"
            className="w-50 h-50"
          />
        ) : (
          <div className="flex justify-center">
            <img
              src="/assets/icons/tanpa-keterangan.svg"
              alt="ditolak"
              className="w-25 h-25"
            />
          </div>
        )}
      </div>

      {/* Title dinamis berdasarkan status sukses/gagal */}
      <h2
        className={`text-2xl font-bold mb-5 ${isSuccess ? "text-gray-800" : "text-red-600"}`}
      >
        {isSuccess
          ? `Presensi ${attendanceData?.tipe === "masuk" ? "Masuk" : "Pulang"} Berhasil!`
          : "Presensi Ditolak!"}
      </h2>

      {/* Konten jika presensi berhasil */}
      {isSuccess && (
        <>
          {/* Waktu presensi */}
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-800">
              {attendanceData.time} WIB
            </p>
          </div>

          {/* Logika status berdasarkan tipe presensi (Masuk atau Pulang) */}
          {attendanceData.tipe === "masuk" ? (
            // Presensi Masuk: Tampilkan status Hadir atau Terlambat
            <div className="text-center mb-6">
              <p
                className={`text-lg font-semibold ${
                  attendanceData.status === "Terlambat"
                    ? "text-red-600"
                    : "text-green-600"
                }`}
              >
                {attendanceData.status === "Terlambat" ? "Terlambat" : "Hadir"}
              </p>
            </div>
          ) : (
            // Presensi Pulang: Cek apakah pulang melewati batas waktu
            <div className="text-center mb-6">
              {attendanceData.isLate && (
                <div className="mt-3 p-3">
                  <p className="text-sm font-semibold text-orange-700">
                    Pulang Terlambat
                  </p>
                  <p className="text-xs text-orange-600 mt-1">
                    Anda pulang melewati batas waktu yang ditentukan
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Informasi lokasi dan shift */}
          <div className="text-center mb-8">
            <p className="text-gray-800 text-sm font-medium">
              {attendanceData.location}
            </p>
            <p className="text-gray-800 text-sm font-medium">
              {attendanceData.shift}
            </p>
          </div>
        </>
      )}

      {/* Render konten jika presensi ditolak */}
      {!isSuccess && renderRejectContent()}

      {/* Tombol aksi */}
      <div className="w-full max-w-sm space-y-3">
        <button
          onClick={isSuccess ? onContinue : onRetry}
          className={`w-full font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95 ${
            isSuccess
              ? "bg-[#0984E3] hover:bg-[#0975c8] text-white"
              : "bg-red-500 hover:bg-red-600 text-white"
          }`}
        >
          {isSuccess ? "Masuk ke Dashboard" : "Coba Lakukan Lagi"}
        </button>

        {isSuccess && (
          <button
            onClick={() => navigate("/pegawai/riwayat")}
            className="w-full text-[#0984E3] font-semibold py-2 hover:underline"
          >
            Lihat Riwayat Presensi
          </button>
        )}
      </div>
    </div>
  );
};

export default ResultStep;
