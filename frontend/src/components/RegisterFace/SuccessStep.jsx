// React
import React from "react";

// Component
import StepIndicator from "./StepIndicator";

const SuccessStep = ({ onNavigateToDashboard }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      {/* indikator tahap pendaftaran */}
      <StepIndicator currentStep={4} />

      <div className="pt-30 max-w-md w-full text-center">
        {/* icon */}
        <div className="mb-20 flex justify-center">
          <img
            src="/assets/icons/sukses.svg"
            alt="Camera"
            className="w-40 h-40"
          />
        </div>

        {/* judul dan keterangan */}
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Wajah Berhasil Didaftarkan
        </h2>

        <p className="text-gray-600 mb-40 leading-relaxed px-5">
          Sekarang Anda dapat menggunakan sistem presensi Sultan Thaha
        </p>

        {/* tombol */}
        <button
          onClick={onNavigateToDashboard}
          className="w-full h-15 bg-[#0984E3] text-white py-3 px-6 rounded-xl font-semibold hover:bg-[#076ab6] transition-colors duration-200 shadow-md hover:shadow-lg active:scale-95"
        >
          Masuk ke Dashboard
        </button>
      </div>
    </div>
  );
};

export default SuccessStep;
