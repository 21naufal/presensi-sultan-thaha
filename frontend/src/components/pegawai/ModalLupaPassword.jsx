import { useState } from "react";

// import icon
import { CloseIcon } from "../../components/icons/SystemIcons";

const ModalLupaPassword = ({ isOpen, onClose, onSubmit, loading }) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Email wajib diisi");
      return;
    }

    // Validasi format email sederhana
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Format email tidak valid");
      return;
    }

    onSubmit(email);
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center p-4">
      <div className="bg-white border-1 border-gray-100 shadow-2xl rounded-xl max-w-md w-full p-6 relative">
        {/* tombol close */}
        <button onClick={onClose} className="absolute top-5 right-5">
          <CloseIcon />
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <h2 className="text-2xl font-bold text-gray-800">Lupa Kata Sandi</h2>
          <p className="text-sm text-gray-800 mt-1">
            Masukkan email Anda yang telah terdaftar. Kami akan mengirimkan kode
            OTP untuk mereset kata sandi.
          </p>
        </div>

        {/* form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              placeholder="sultanthahajambi@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />

            {/* pesan error */}
            {error && (
              <div className="text-red-500 text-xs mt-2 ml-2">{error}</div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0984E3] text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Mengirim...
              </span>
            ) : (
              "Kirim Kode OTP"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ModalLupaPassword;
