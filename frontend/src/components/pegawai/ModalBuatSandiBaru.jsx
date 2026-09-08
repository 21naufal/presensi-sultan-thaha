import { useState } from "react";

// import icon
import {
  CloseIcon,
  EyeIcon,
  EyeSlashIcon,
} from "../../components/icons/SystemIcons";

const ModalBuatSandiBaru = ({ isOpen, onClose, onSubmit, email, loading }) => {
  const [password, setPassword] = useState("");
  const [konfirmasiPassword, setKonfirmasiPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showKonfirmasi, setShowKonfirmasi] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!password || !konfirmasiPassword) {
      setError("Semua field wajib diisi");
      return;
    }

    if (password.length < 8) {
      setError("Password minimal 8 karakter");
      return;
    }

    if (password !== konfirmasiPassword) {
      setError("Konfirmasi password tidak sama");
      return;
    }

    onSubmit(password, konfirmasiPassword);
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center p-4">
      <div className="bg-white border-1 border-gray-100 shadow-2xl rounded-xl max-w-md w-full p-6 relative">
        {/* tombol close */}
        <button onClick={onClose} className="absolute top-5 right-5">
          <CloseIcon />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Buat Sandi Baru</h2>
          <p className="text-sm text-gray-600 mt-2">
            Kata sandi berhasil direset! Silahkan masukan kata sandi baru anda
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Password baru */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Konfirmasi sandi baru
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Minimal 8 karakter huruf dan angka
            </p>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="sultanthaha123"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          {/* Konfirmasi password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Konfirmasi sandi baru
            </label>
            <div className="relative">
              <input
                type={showKonfirmasi ? "text" : "password"}
                placeholder="sultanthaha123"
                value={konfirmasiPassword}
                onChange={(e) => setKonfirmasiPassword(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowKonfirmasi(!showKonfirmasi)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showKonfirmasi ? <EyeSlashIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0984E3] text-white py-3 rounded-lg font-semibold hover:bg-[#076ab6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Menyimpan...
              </span>
            ) : (
              "Ganti Sandi"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ModalBuatSandiBaru;
