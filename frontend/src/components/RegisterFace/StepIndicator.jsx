import React from "react";

// import icon dari components (reusable, tidak dibuat ulang)
import { CheckIcon } from "../../components/icons/SystemIcons";

const StepIndicator = ({ currentStep }) => {
  const steps = [
    { number: 1, label: "Mulai" },
    { number: 2, label: "Instruksi" },
    { number: 3, label: "Pemindaian" },
    { number: 4, label: "Selesai" },
  ];

  return (
    <div className="fixed top-5 left-0 right-0 z-50 py-6 px-10">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between relative">
          {/* garis progres */}
          <div className="absolute top-5 left-0 w-full h-1 bg-gray-300 -z-10">
            <div
              className="h-full bg-[#0984E3] transition-all duration-300"
              style={{
                width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
              }}
            />
          </div>

          {/* lingkaran progres */}
          {steps.map((stepItem) => (
            <div key={stepItem.number} className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                  stepItem.number < currentStep
                    ? "bg-[#0984E3] text-white"
                    : stepItem.number === currentStep
                      ? "bg-[#0984E3] text-white ring-4 ring-blue-200"
                      : "bg-gray-300 text-gray-600"
                }`}
              >
                {stepItem.number < currentStep ? (
                  <CheckIcon />
                ) : (
                  stepItem.number
                )}
              </div>
              <span
                className={`text-xs mt-2 font-medium ${
                  stepItem.number <= currentStep
                    ? "text-[#0984E3]"
                    : "text-gray-400"
                }`}
              >
                {stepItem.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StepIndicator;
