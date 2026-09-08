// React
import { useState } from "react";
import { useNavigate } from "react-router-dom";

// Library
import toast from "react-hot-toast";

// Services
import api from "../../services/api";

// Components
import {
  EyeIcon,
  EyeSlashIcon,
  BackIcon,
} from "../../components/icons/SystemIcons";

const UbahSandiPage = () => {
  // Hooks
  const navigate = useNavigate();

  // State halaman ubah kata sandi
  const [showPassword, setShowPassword] = useState({
    lama: false,
    baru: false,
    konfirmasi: false,
  });

  const [formData, setFormData] = useState({
    sandiLama: "",
    sandiBaru: "",
    konfirmasiSandiBaru: "",
  });

  const [loading, setLoading] = useState(false);

  // State error
  const [errorServer, setErrorServer] = useState("");
  const [errorForm, setErrorForm] = useState("");

  // Handle mengubah nilai input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // reset kedua error saat user mengetik
    if (errorServer) setErrorServer("");
    if (errorForm) setErrorForm("");
  };

  // Handle submit perubahan kata sandi
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorServer("");
    setErrorForm("");

    // validasi error Form
    if (
      !formData.sandiLama ||
      !formData.sandiBaru ||
      !formData.konfirmasiSandiBaru
    ) {
      setErrorForm("Semua field wajib diisi");
      return;
    }

    if (formData.sandiBaru.length < 8) {
      setErrorForm("Kata Sandi baru minimal 8 karakter");
      return;
    }

    if (formData.sandiBaru !== formData.konfirmasiSandiBaru) {
      setErrorForm("Konfirmasi kata sandi baru tidak sama");
      return;
    }

    // proses ke server
    try {
      setLoading(true);
      const response = await api.put("/pegawai/change-password", formData);

      if (response.data.status === "success") {
        toast.success("Kata sandi berhasil diubah.");
        navigate("/pegawai/profil");
      }
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || "Gagal mengubah Kata Sandi";
      setErrorServer(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Handle batal
  const handleBatal = () => {
    navigate("/pegawai/profil");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#0974c6] text-white p-3 shadow-lg">
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate("/pegawai/dashboard")}
            className="p-2 -ml-2 rounded-lg"
          >
            <BackIcon />
          </button>
          <h1 className="text-lg font-semibold">Ubah Kata Sandi</h1>
        </div>
      </div>

      {/* konten utama */}
      <div className="p-4">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-md p-6 space-y-4"
        >
          {/* input kata sandi lama */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Kata sandi lama
            </label>
            <div className="relative">
              <input
                type={showPassword.lama ? "text" : "password"}
                name="sandiLama"
                value={formData.sandiLama}
                onChange={handleChange}
                className="text-sm w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#0984E3] pr-10"
                placeholder="Masukkan sandi lama"
              />
              <button
                type="button"
                onClick={() =>
                  setShowPassword({ ...showPassword, lama: !showPassword.lama })
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showPassword.lama ? <EyeSlashIcon /> : <EyeIcon />}
              </button>
            </div>

            {/* error server */}
            {errorServer && (
              <p className="text-red-500 text-xs text-start ml-2 mt-2">
                {errorServer}
              </p>
            )}
          </div>

          {/* input kata sandi baru */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Kata sandi baru
            </label>
            <div className="relative">
              <input
                type={showPassword.baru ? "text" : "password"}
                name="sandiBaru"
                value={formData.sandiBaru}
                onChange={handleChange}
                className="text-sm w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#0984E3] pr-10"
                placeholder="Kata Sandi minimal 8 karakter"
              />
              <button
                type="button"
                onClick={() =>
                  setShowPassword({ ...showPassword, baru: !showPassword.baru })
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showPassword.baru ? <EyeSlashIcon /> : <EyeIcon />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Kata Sandi Minimal 8 karakter
            </p>
          </div>

          {/* input konfirmasi kata sandi baru */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Konfirmasi kata sandi baru
            </label>
            <div className="relative">
              <input
                type={showPassword.konfirmasi ? "text" : "password"}
                name="konfirmasiSandiBaru"
                value={formData.konfirmasiSandiBaru}
                onChange={handleChange}
                className="text-sm w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#0984E3] pr-10"
                placeholder="Konfirmasi sandi baru"
              />
              <button
                type="button"
                onClick={() =>
                  setShowPassword({
                    ...showPassword,
                    konfirmasi: !showPassword.konfirmasi,
                  })
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showPassword.konfirmasi ? <EyeSlashIcon /> : <EyeIcon />}
              </button>
            </div>

            {/* error form */}
            {errorForm && (
              <p className="text-red-500 text-xs text-start ml-2 mt-2">
                {errorForm}
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-5 pt-4 text-sm">
            <button
              type="button"
              onClick={handleBatal}
              className="flex-1 py-3 border-1 border-[#0984E3] text-[#0984E3] font-semibold rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-[#0984E3] text-white font-semibold rounded-xl disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UbahSandiPage;
