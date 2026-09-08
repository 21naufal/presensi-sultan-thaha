import React from "react";

const VerifyingStep = ({ locationBufferCount = 0 }) => {
  const progressPercent = Math.min(100, (locationBufferCount / 5) * 100);

  return (
    <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col items-center justify-center p-4">
      <div className=" p-8 w-full max-w-sm text-center">
        {/* spinner */}
        <div className="w-14 h-14 mx-auto border-4 border-[#0984E3] border-t-blue-200 rounded-full animate-spin mb-5" />

        {/* judul & subjudul */}
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Memverifikasi Wajah & Lokasi
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Mohon tunggu sebentar, proses sedang berjalan.
        </p>

        {/* progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-[#0984E3] h-3 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* persentase */}
        <p className="text-sm font-bold text-gray-800 mt-2">
          {Math.round(progressPercent)}%
        </p>
      </div>
    </div>
  );
};

export default VerifyingStep;
