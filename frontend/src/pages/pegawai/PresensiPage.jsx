// React
import React from "react";
import { useNavigate, useParams, Navigate } from "react-router-dom";

// Components
import FaceAttendance from "../../components/FaceAttendance/FaceAttendance";

const PresensiPage = () => {
  // Hooks
  const navigate = useNavigate();
  const { type } = useParams();

  // validasi tipe presensi (hanya masuk atau pulang)
  if (type !== "masuk" && type !== "pulang") {
    return <Navigate to="/pegawai/dashboard" replace />;
  }

  // kembali ke dashboard saat proses dibatalkan
  const handleClose = () => {
    navigate("/pegawai/dashboard", { replace: true });
  };

  // kembali ke dashboard setelah presensi berhasil
  const handleSuccess = () => {
    navigate("/pegawai/dashboard", { replace: true });
  };

  return (
    <FaceAttendance
      attendanceType={type}
      onClose={handleClose}
      onAttendanceSuccess={handleSuccess}
    />
  );
};

export default PresensiPage;
