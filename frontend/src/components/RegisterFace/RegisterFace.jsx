// React
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// Context
import { useAuth } from "../../context/AuthContext";

// Hooks
import { useFaceRegistration } from "./hooks/useFaceRegistration";

// Components
import WelcomeStep from "./WelcomeStep";
import InstructionsStep from "./InstructionsStep";
import ScanningStep from "./ScanningStep";
import SuccessStep from "./SuccessStep";

const RegisterFace = () => {
  // Hooks dan Context
  const { user, updateUserData } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // fungsi mengubah tampilan ke halaman sukses.
  const handleRegistrationComplete = useCallback(() => {
    setStep(4);
  }, []);

  // mengambil semua kebutuhan dari custom hook
  const {
    refs: { videoRef, canvasRef },
    state: { status, modelsLoaded, saving, capturedSamples, requiredSamples },
    actions: { startCamera, startScanning, handleRegistrationSuccess },
  } = useFaceRegistration(
    user,
    updateUserData,
    navigate,
    handleRegistrationComplete,
  );

  // handle untuk transisi step
  const handleStartRegistration = () => setStep(2);

  // handle perpindah ke halaman scanning dan mengaktifkan kamera
  const handleStartScanning = () => {
    setStep(3);
    startCamera();
  };

  // render berdasarkan step
  switch (step) {
    // 1. halaman pembuka registrasi wajah
    case 1:
      return <WelcomeStep onNext={handleStartRegistration} />;

    // 2. menampilkan instruksi sebelum scanning dimulai
    case 2:
      return (
        <InstructionsStep
          onStartScanning={handleStartScanning}
          modelsLoaded={modelsLoaded}
        />
      );

    // 3. proses pemindaian dan pengambilan descriptor wajah
    case 3:
      return (
        <ScanningStep
          videoRef={videoRef}
          canvasRef={canvasRef}
          status={status}
          capturedSamples={capturedSamples}
          requiredSamples={requiredSamples}
          onScanningStart={startScanning}
          onCameraReady={startScanning}
          saving={saving}
        />
      );

    // 4. registrasi berhasil, pengguna diarahkan ke dashboard
    case 4:
      return <SuccessStep onNavigateToDashboard={handleRegistrationSuccess} />;

    // jika nilai step tidak valid, tidak menampilkan apa pun
    default:
      return null;
  }
};

export default RegisterFace;
