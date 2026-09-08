// React
import React, { useEffect } from "react";

// Components
import StepIndicator from "./StepIndicator";

const ScanningStep = ({
  videoRef,
  canvasRef,
  status,
  capturedSamples,
  requiredSamples,
  onScanningStart,
  onCameraReady,
  saving,
}) => {
  useEffect(() => {
    // jalankan scanning otomatis saat halaman dibuka, dan cleanup ketika ditutup.
    const cleanup = onScanningStart?.();
    return () => cleanup?.();
  }, [onScanningStart]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      {/* indikator tahap pendaftaran */}
      <StepIndicator currentStep={3} />

      <div className="pt-20 p-8 max-w-md w-full">
        {/* area kamera dan overlay panduan posisi wajah */}
        <div className="relative flex justify-center mb-15">
          <div className="relative w-80 h-80">
            {/* video */}
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              onLoadedMetadata={() => {
                onCameraReady?.();
              }}
              className="bg-[#0984E3] absolute inset-0 w-full h-full object-cover rounded-full"
              style={{
                transform: "scaleX(-1)",
                clipPath: "circle(50% at 50% 50%)",
              }}
            />

            {/* garis bantu posisi wajah */}
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

            {/* canvas overlay */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full"
              style={{ transform: "scaleX(-1)" }}
            />
          </div>
        </div>

        {/* teks status */}
        <div className="text-center">
          <h3 className="text-lg font-bold mb-2">
            Posisikan wajah di dalam frame
          </h3>
          <p className="font-medium">{status}</p>

          {/* loading indikator saat menyimpan */}
          {saving && (
            <span className="inline-block mt-2 text-[#0984E3] font-medium">
              Menyimpan...
            </span>
          )}
        </div>

        {/* progres bar */}
        {capturedSamples > 0 && (
          <div className="mt-4 flex justify-center gap-2">
            {Array.from({ length: requiredSamples }).map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index < capturedSamples ? "bg-green-500" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanningStep;
