import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useFaceAttendance } from "./hooks/useFaceAttendance";
import ScanningStep from "./ScanningStep";
import VerifyingStep from "./VerifyingStep";
import ResultStep from "./ResultStep";
import api from "../../services/api";

// Wrapper komponen untuk menangani proses loading dan error
const FaceAttendance = ({ attendanceType, onClose, onAttendanceSuccess }) => {
  const [shiftInfo, setShiftInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchShiftInfo = async () => {
      try {
        setLoading(true);
        const response = await api.get("/presensi/status");
        const data = response.data.data;

        if (data.hasSchedule && data.shiftInfo) {
          setShiftInfo({
            location:
              data.shiftInfo.namaLokasi ||
              data.shiftInfo.namaUnit ||
              "Lokasi tidak tersedia",
            name: data.shiftInfo.namaShift || "Shift",
            startTime: data.shiftInfo.jamMulai || "00:00",
            endTime: data.shiftInfo.jamSelesai || "00:00",
            latitude: data.shiftInfo.latitude,
            longitude: data.shiftInfo.longitude,
            radius: data.shiftInfo.radius,
          });
        } else {
          setError("Tidak ada jadwal untuk hari ini");
        }
      } catch (err) {
        console.error("Error fetching shift info:", err);
        setError("Gagal memuat informasi shift");
      } finally {
        setLoading(false);
      }
    };

    fetchShiftInfo();
  }, []);

  // Tampilan saat data sedang dimuat
  if (loading) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 mx-auto border-4 border-[#0984E3] border-t-blue-200 rounded-full animate-spin mb-4" />
          <p className="text-gray-600">Memuat informasi shift...</p>
        </div>
      </div>
    );
  }

  // Tampilan jika terjadi error atau data tidak tersedia
  if (error || !shiftInfo) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <img
            src="/assets/icons/tanpa-keterangan.svg"
            alt="error"
            className="w-20 h-20 mx-auto mb-4"
          />
          <p className="text-red-600 font-semibold mb-2">Error</p>
          <p className="text-gray-600 text-sm mb-4">
            {error || "Data shift tidak tersedia"}
          </p>
          <button
            onClick={onClose}
            className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
          >
            Tutup
          </button>
        </div>
      </div>
    );
  }

  // Render komponen utama setelah data shift siap
  return (
    <FaceAttendanceContent
      shiftInfo={shiftInfo}
      attendanceType={attendanceType}
      onClose={onClose}
      onAttendanceSuccess={onAttendanceSuccess}
    />
  );
};

// Komponen utama: Memanggil hooks dan merender UI berdasarkan step
const FaceAttendanceContent = ({
  shiftInfo,
  attendanceType,
  onClose,
  onAttendanceSuccess,
}) => {
  const { user } = useAuth();

  // Hook dipanggil tanpa kondisi untuk mematuhi aturan React Hooks
  const {
    refs: { videoRef },
    state: {
      step,
      status,
      attendanceData,
      challengeState,
      challengeInstruction,
      challengeProgress,
      showInstructions,
      locationBufferCount,
      countdown,
    },
    actions: { handleContinue, handleRetry },
  } = useFaceAttendance(
    user,
    shiftInfo,
    attendanceType,
    onClose,
    onAttendanceSuccess,
  );

  // Render UI berdasarkan step proses presensi
  switch (step) {
    case 1:
      return (
        <ScanningStep
          videoRef={videoRef}
          status={status}
          showInstructions={showInstructions}
          challengeState={challengeState}
          challengeInstruction={challengeInstruction}
          challengeProgress={challengeProgress}
          countdown={countdown}
        />
      );

    case 2:
      return (
        <VerifyingStep
          status={status}
          locationBufferCount={locationBufferCount}
        />
      );

    case 3:
      if (!attendanceData) return null;
      const isSuccess = !attendanceData.isRejected;
      return (
        <ResultStep
          attendanceData={attendanceData}
          onContinue={handleContinue}
          onRetry={handleRetry}
          isSuccess={isSuccess}
        />
      );

    default:
      return null;
  }
};

export default FaceAttendance;
