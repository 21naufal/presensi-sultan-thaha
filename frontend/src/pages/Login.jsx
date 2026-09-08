import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

// Components
import ModalLupaPassword from "../components/pegawai/ModalLupaPassword";
import ModalVerifikasiOTP from "../components/pegawai/ModalVerifikasiOTP";
import ModalBuatSandiBaru from "../components/pegawai/ModalBuatSandiBaru";
import ModalSukses from "../components/pegawai/ModalSukses";
import { EyeIcon, EyeSlashIcon } from "../components/icons/SystemIcons";

const Login = () => {
  // State untuk input form login
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // State untuk mengontrol visibilitas modal
  const [modalLupaPassword, setModalLupaPassword] = useState(false);
  const [modalVerifikasiOTP, setModalVerifikasiOTP] = useState(false);
  const [modalBuatSandiBaru, setModalBuatSandiBaru] = useState(false);
  const [modalSukses, setModalSukses] = useState(false);

  // State untuk menyimpan data sementara saat proses lupa password
  const [emailUser, setEmailUser] = useState("");
  const [stepLoading, setStepLoading] = useState(false);
  const [otpError, setOtpError] = useState("");

  const navigate = useNavigate();
  const { login } = useAuth();

  // Handle submit form login dan redirect berdasarkan role user
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (identifier.trim() === "" || password.trim() === "") {
      setError("Nama Pengguna atau No. HP dan Kata Sandi harus diisi");
      return;
    }

    setLoading(true);

    try {
      const user = await login(identifier, password);

      // Redirect ke halaman yang sesuai berdasarkan role dan status registrasi wajah
      if (user.role === "admin") {
        navigate("/admin/dashboard");
      } else if (user.role === "pegawai") {
        if (user.faceRegistered) {
          navigate("/pegawai/dashboard");
        } else {
          navigate("/pegawai/register-face");
        }
      }
    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Nama Pengguna atau No. HP tidak ditemukan");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle buka modal lupa password
  const handleOpenLupaPassword = () => {
    setModalLupaPassword(true);
    setError("");
  };

  // Handle kirim kode OTP ke email user
  const handleKirimOTP = async (email) => {
    setStepLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/lupa-password", { email });

      if (response.data.status === "success") {
        setModalLupaPassword(false);
        setEmailUser(email);
        setModalVerifikasiOTP(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Gagal mengirim OTP");
    } finally {
      setStepLoading(false);
    }
  };

  // Handle verifikasi kode OTP yang dimasukkan user
  const handleVerifikasiOTP = async (kodeOTP) => {
    setStepLoading(true);
    setOtpError("");

    try {
      const response = await api.post("/auth/verifikasi-otp", {
        email: emailUser,
        kodeOTP,
      });

      if (response.data.status === "success") {
        setModalVerifikasiOTP(false);
        setModalBuatSandiBaru(true);
        setOtpError("");
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        "Kode OTP tidak valid atau sudah kadaluarsa";
      setOtpError(errorMessage);
    } finally {
      setStepLoading(false);
    }
  };

  // Handle reset password dengan sandi baru
  const handleResetPassword = async (passwordBaru, konfirmasiPassword) => {
    setStepLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/reset-password", {
        email: emailUser,
        passwordBaru,
        konfirmasiPassword,
      });

      if (response.data.status === "success") {
        setModalBuatSandiBaru(false);
        setModalSukses(true);
        setEmailUser("");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Gagal reset password");
    } finally {
      setStepLoading(false);
    }
  };

  return (
    <div className="h-dvh overflow-hidden relative">
      <div className="absolute inset-0 flex items-center justify-center px-4">
        {/* Animasi background blob */}
        <style>
          {`@keyframes moveBlob1 { 0%   { transform: translate(0vw, 0vh); } 25%  { transform: translate(60vw, 10vh); } 50%  { transform: translate(30vw, 60vh); } 75%  { transform: translate(-10vw, 40vh); } 100% { transform: translate(0vw, 0vh); } }
            @keyframes moveBlob2 { 0%   { transform: translate(0vw, 0vh); } 25%  { transform: translate(-50vw, -20vh); } 50%  { transform: translate(-20vw, 50vh); } 75%  { transform: translate(40vw, 20vh); } 100% { transform: translate(0vw, 0vh); } }
            @keyframes moveBlob3 { 0%   { transform: translate(0vw, 0vh); } 25%  { transform: translate(-40vw, 40vh); } 50%  { transform: translate(50vw, -20vh); } 75%  { transform: translate(20vw, 60vh); } 100% { transform: translate(0vw, 0vh); } }
             @keyframes moveBlob4 { 0%   { transform: translate(0vw, 0vh); } 25%  { transform: translate(-50vw, -20vh); } 50%  { transform: translate(-20vw, 50vh); } 75%  { transform: translate(40vw, 20vh); } 100% { transform: translate(0vw, 0vh); } }
          `}
        </style>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-0 left-0 w-80 h-80 bg-[#0984E3] rounded-full blur-xl opacity-20"
            style={{ animation: "moveBlob1 8s linear infinite" }}
          />
          <div
            className="absolute bottom-0 right-0 w-96 h-96 bg-[#0763a9] rounded-full blur-xl opacity-20"
            style={{ animation: "moveBlob2 10s linear infinite" }}
          />
          <div
            className="absolute top-1/3 left-1/2 w-72 h-72 bg-[#0984E3] rounded-full blur-xl opacity-20"
            style={{ animation: "moveBlob3 9s linear infinite" }}
          />
          <div
            className="absolute bottom-0 right-0 w-96 h-96 bg-[#0763a9] rounded-full blur-xl opacity-20"
            style={{ animation: "moveBlob4 10s linear infinite" }}
          />
        </div>

        {/* Konten utama form login */}
        <div className="max-w-sm w-full bg-white border-1 border-gray-100 rounded-xl shadow-2xl p-6 space-y-6 relative z-10">
          <h2 className="text-2xl font-bold text-[#0984E3] text-center mb-0 mt-2">
            Selamat Datang!
          </h2>
          <p className="text-sm text-center">
            di Sistem Presensi Pegawai Kontrak Bandara Sultan Thaha Jambi.
          </p>

          {/* Form input login */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Input Nama Pengguna atau No. HP */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Nama Pengguna atau No. HP
              </label>
              <input
                type="text"
                placeholder="Masukkan nama pengguna atau no. hp"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={loading}
                className="text-sm w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>

            {/* Input Kata Sandi dengan toggle show/hide */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan kata sandi"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="text-sm w-full border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />

                {/* Tombol toggle visibility password */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  disabled={loading}
                >
                  {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                </button>
              </div>

              {/* Tampilkan pesan error jika ada */}
              {error && (
                <p className="text-red-500 text-xs text-start ml-2 mt-2">
                  {error}
                </p>
              )}

              {/* Tombol Lupa Password */}
              <div className="flex justify-end mt-3">
                <button
                  type="button"
                  onClick={handleOpenLupaPassword}
                  className="text-xs hover:underline font-medium"
                >
                  Lupa kata sandi?
                </button>
              </div>
            </div>

            {/* Tombol submit login */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full text-white py-3 rounded-lg transition-all font-semibold ${
                loading
                  ? "bg-[#0984E3] cursor-not-allowed opacity-70"
                  : "bg-[#0984E3] hover:bg-[#076ab6] active:scale-[0.98]"
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Memproses...
                </span>
              ) : (
                "MASUK"
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Render modal untuk alur lupa password */}
      <ModalLupaPassword
        isOpen={modalLupaPassword}
        onClose={() => setModalLupaPassword(false)}
        onSubmit={handleKirimOTP}
        loading={stepLoading}
      />

      <ModalVerifikasiOTP
        isOpen={modalVerifikasiOTP}
        onClose={() => {
          setModalVerifikasiOTP(false);
          setOtpError("");
        }}
        onSubmit={handleVerifikasiOTP}
        email={emailUser}
        loading={stepLoading}
        error={otpError}
      />

      <ModalBuatSandiBaru
        isOpen={modalBuatSandiBaru}
        onClose={() => setModalBuatSandiBaru(false)}
        onSubmit={handleResetPassword}
        email={emailUser}
        loading={stepLoading}
      />

      <ModalSukses isOpen={modalSukses} onClose={() => setModalSukses(false)} />
    </div>
  );
};

export default Login;
