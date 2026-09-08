// React
import React from "react";

const WelcomeStep = ({ onNext }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md w-full">
        {/* icon */}
        <div className="mb-20 flex justify-center">
          <img
            src="/assets/icons/daftar-wajah.svg"
            alt="Camera"
            className="w-25 h-25"
          />
        </div>

        {/* judul dan intruksi*/}
        <h1 className="text-2xl font-bold text-gray-800 mb-20">
          Daftarkan Wajah Anda
        </h1>
        <p className="text-gray-600 mb-8 leading-relaxed">
          Sebelum menggunakan presensi, silakan daftarkan wajah anda terlebih
          dahulu
        </p>

        {/* button */}
        <button
          onClick={onNext}
          className="w-full h-15 bg-[#0984E3] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#076ab6] transition-colors duration-200 shadow-md hover:shadow-lg"
        >
          Mulai Pendaftaran
        </button>
      </div>
    </div>
  );
};

export default WelcomeStep;
