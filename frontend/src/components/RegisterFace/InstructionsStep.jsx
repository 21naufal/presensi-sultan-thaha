// React
import React from "react";

// Components
import StepIndicator from "./StepIndicator";

const InstructionsStep = ({ onStartScanning, modelsLoaded }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      {/* indikator tahap pendaftaran */}
      <StepIndicator currentStep={2} />

      {/* konten utama */}
      <div className="pt-32 p-8 max-w-md w-full">
        {/* icon */}
        <div className="mt-5 mb-15 flex justify-center">
          <img
            src="/assets/icons/daftar-wajah-2.svg"
            alt="Camera"
            className="w-25 h-25"
          />
        </div>

        {/* judul */}
        <h2 className="text-2xl font-bold mb-5 text-center">Daftar Wajah</h2>

        {/* intruksi */}
        <div className="rounded-xl p-5 text-gray-800 font-medium">
          <p className="font-medium mb-3">
            Posisikan wajah Anda ditengah dan pastikan pencahayaan cukup.
          </p>
          <ul>
            <li className="flex items-start ">
              <span className="mr-2">•</span>
              <span>Lepas Masker</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Lepas Kacamata</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Jangan menutup wajah</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Hadapkan wajah ke kamera</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="px-4 pb-8 max-w-md w-full"></div>

      {/* Button */}
      <button
        onClick={onStartScanning}
        disabled={!modelsLoaded}
        className="w-full h-15 bg-[#0984E3] text-white py-3 rounded-lg font-semibold hover:bg-[#076ab6] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
      >
        Mulai Pemindaian
      </button>
    </div>
  );
};

export default InstructionsStep;
