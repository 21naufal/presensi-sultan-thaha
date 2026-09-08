import React from "react";

const ScanningStep = ({
  videoRef,
  status,
  showInstructions,
  challengeState,
  challengeInstruction,
  challengeProgress,
  countdown,
}) => {
  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {/* Area video kamera dengan bentuk lingkaran */}
        <div className="relative flex justify-center mb-6">
          <div className="relative w-80 h-80">
            <div className="absolute inset-0 bg-[#0984E3] rounded-full opacity-20"></div>

            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover rounded-full"
              style={{
                transform: "scaleX(-1)",
                clipPath: "circle(50% at 50% 50%)",
              }}
            />

            {/* Garis bantu (guideline) posisi wajah */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none mt-4"
              viewBox="0 0 200 200"
              style={{ transform: "scaleX(-1)" }}
            >
              <ellipse
                cx="100"
                cy="90"
                rx="60"
                ry="75"
                fill="none"
                stroke="white"
                strokeWidth="3"
                strokeDasharray="8,4"
                opacity="0.9"
              />
            </svg>
          </div>
        </div>

        {/* Area instruksi untuk pengguna */}
        <div className="text-center max-w-sm min-h-[180px]">
          {showInstructions ? (
            <>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {countdown ? "Pertahankan Posisi" : "Posisikan Wajah Anda"}
              </h3>
              <div className="mb-5 flex justify-center">
                {countdown ? (
                  <div className="flex items-center text-gray-800 justify-center text-7xl font-bold animate-pulse">
                    {countdown}
                  </div>
                ) : (
                  <img
                    src="/assets/icons/phone.svg"
                    alt="Camera"
                    className="w-20 h-20"
                  />
                )}
              </div>

              <p className="text-gray-600 text-sm font-medium leading-relaxed">
                Pastikan wajah tidak tertutup seperti masker, kacamata dll.
                Posisikan wajah Anda di dalam lingkaran.
              </p>
            </>
          ) : challengeState === "idle" ? (
            <p className="text-gray-600 font-medium">Memulai tantangan...</p>
          ) : (
            <>
              {/* Progress bar untuk challenge liveness detection */}
              <div className="w-[200px] bg-gray-200 rounded-full h-2 mb-4 mx-auto">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${challengeProgress}%` }}
                />
              </div>

              {/* Teks instruksi challenge yang sedang berjalan */}
              <p className="text-base font-medium text-gray-800 mb-6 animate-pulse">
                {challengeInstruction}
              </p>
            </>
          )}
        </div>

        {/* Status dinamis saat menunggu proses verifikasi */}
        {!countdown && challengeState === "idle" && (
          <div className="mt-6 text-center min-h-[24px]">
            <p className="text-gray-600 font-medium">{status}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanningStep;
