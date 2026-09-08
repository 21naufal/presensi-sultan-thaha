import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../services/api";
import ModalConfirm from "../../components/admin/ModalConfirm";

// import icon dari components (reusable, tidak dibuat ulang)
import {
  BackIcon,
  EyeIcon,
  EyeSlashIcon,
} from "../../components/icons/SystemIcons";

const EditProfil = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState({
    lama: false,
    baru: false,
    konfirmasi: false,
  });

  const [formData, setFormData] = useState({
    nama: "",
    email: "",
    noHp: "",
    sandiLama: "",
    sandiBaru: "",
    konfirmasiSandiBaru: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [activeTab, setActiveTab] = useState("profil");

  // Fetch profil admin
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get("/employees/profile");
      if (response.data.status === "success") {
        const data = response.data.data;
        setFormData({
          nama: data.nama || "",
          email: data.email === "-" ? "" : data.email,
          noHp: data.noHp === "-" ? "" : data.noHp,
          sandiLama: "",
          sandiBaru: "",
          konfirmasiSandiBaru: "",
        });
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Gagal memuat data profil");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  // Handle format no_hp (auto +62)
  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.startsWith("62")) {
      value = value.substring(2);
    }
    if (value.startsWith("0")) {
      value = value.substring(1);
    }
    setFormData((prev) => ({ ...prev, noHp: value }));
    if (error) setError("");
  };

  // Handle simpan
  const handleSave = () => {
    if (activeTab === "profil") {
      // Validasi profil
      if (!formData.nama || formData.nama.trim() === "") {
        setError("Nama wajib diisi");
        return;
      }

      // Validasi email jika diisi
      if (formData.email && formData.email.trim() !== "") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
          setError("Format email tidak valid");
          return;
        }
      }

      // Validasi no_hp jika diisi
      if (formData.noHp && formData.noHp.trim() !== "") {
        const phoneRegex = /^08[0-9]{8,11}$/;
        if (!phoneRegex.test(`0${formData.noHp}`)) {
          setError("Format No. HP tidak valid (contoh: 081234567890)");
          return;
        }
      }
    } else {
      // Validasi password
      if (
        !formData.sandiLama ||
        !formData.sandiBaru ||
        !formData.konfirmasiSandiBaru
      ) {
        setError("Semua field password wajib diisi");
        return;
      }

      if (formData.sandiBaru.length < 8) {
        setError("Password baru minimal 8 karakter");
        return;
      }

      if (formData.sandiBaru !== formData.konfirmasiSandiBaru) {
        setError("Konfirmasi password baru tidak sama");
        return;
      }
    }

    setShowSaveModal(true);
  };

  // Konfirmasi simpan
  const confirmSave = async () => {
    setShowSaveModal(false);
    setLoading(true);
    setError("");

    try {
      if (activeTab === "profil") {
        // Update profil
        const payload = {
          nama: formData.nama.trim(),
          email: formData.email?.trim() || null,
          noHp: formData.noHp ? `0${formData.noHp}` : null,
        };

        const response = await api.put("/employees/profile", payload);

        if (response.data.status === "success") {
          toast.success("Profil berhasil diperbarui!");
          navigate("/admin/profil");
        }
      } else {
        // Ubah password
        const payload = {
          sandiLama: formData.sandiLama,
          sandiBaru: formData.sandiBaru,
          konfirmasiSandiBaru: formData.konfirmasiSandiBaru,
        };

        const response = await api.put(
          "/employees/profile/change-password",
          payload,
        );

        if (response.data.status === "success") {
          toast.success("Password berhasil diubah!");
          setFormData((prev) => ({
            ...prev,
            sandiLama: "",
            sandiBaru: "",
            konfirmasiSandiBaru: "",
          }));
          navigate("/admin/profil");
        }
      }
    } catch (err) {
      console.error("Error saving:", err);
      const errorMsg =
        err.response?.data?.message || "Terjadi kesalahan saat menyimpan data";
      setError(errorMsg);
      toast.error("❌ " + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Handle batal
  const handleCancel = () => {
    navigate("/admin/profil");
  };

  // UI: Loading
  if (loading && !formData.nama) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
        <span className="ml-2 text-gray-600">Memuat data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* breadcrumb */}
      <div className="bg-white rounded-lg p-3 shadow-sm text-xs">
        <button
          onClick={handleCancel}
          className="flex items-center gap-2 text-gray-800"
        >
          <BackIcon />
          <span className="font-medium">Profil</span>
          <span className="text-gray-800">›</span>
          <span className="font-medium">Edit Profil</span>
        </button>
      </div>

      {/* konten utama */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        {/* header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800 border-b border-gray-200 pb-2">
            Edit Profil
          </h1>
        </div>

        {/* tabs */}
        <div className="flex gap-4 mt-5 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("profil")}
            className={`pb-3 px-4 text-sm font-semibold transition-colors ${
              activeTab === "profil"
                ? "text-[#0984E3] border-b-2 border-[#0984E3]"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Informasi Profil
          </button>
          <button
            onClick={() => setActiveTab("password")}
            className={`pb-3 px-4 text-sm font-semibold transition-colors ${
              activeTab === "password"
                ? "text-[#0984E3] border-b-2 border-[#0984E3]"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Ubah Password
          </button>
        </div>

        {/* error message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
            ⚠️ {error}
          </div>
        )}

        {/* form */}
        <div className="space-y-6 mt-5">
          {activeTab === "profil" ? (
            // Tab Informasi Profil
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nama Lengkap */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  name="nama"
                  value={formData.nama}
                  onChange={handleChange}
                  placeholder="Masukkan nama lengkap"
                  className="text-sm w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#0984E3] transition-colors"
                  disabled={loading}
                />
              </div>

              {/* No HP */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  No HP
                </label>
                <div className="flex">
                  <span className="text-sm inline-flex items-center px-4 py-3 border-2 border-r-0 border-gray-200 rounded-l-xl bg-gray-50 text-gray-600 font-medium">
                    +62
                  </span>
                  <input
                    type="tel"
                    name="noHp"
                    value={formData.noHp}
                    onChange={handlePhoneChange}
                    placeholder="82345678910"
                    maxLength={12}
                    className="text-sm w-full px-4 py-3 border-2 border-gray-200 rounded-r-xl focus:outline-none focus:border-[#0984E3] transition-colors"
                    disabled={loading}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Contoh: 82345678910 (tanpa 0 atau +62)
                </p>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="admin@email.com"
                  className="text-sm w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#0984E3] transition-colors"
                  disabled={loading}
                />
              </div>
            </div>
          ) : (
            // Tab Ubah Password
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sandi Lama */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Sandi Lama
                </label>
                <div className="relative">
                  <input
                    type={showPassword.lama ? "text" : "password"}
                    name="sandiLama"
                    value={formData.sandiLama}
                    onChange={handleChange}
                    placeholder="Masukkan sandi lama"
                    className="text-sm w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#0984E3] transition-colors pr-10"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword({
                        ...showPassword,
                        lama: !showPassword.lama,
                      })
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    disabled={loading}
                  >
                    {showPassword.lama ? <EyeSlashIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              {/* Sandi Baru */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Sandi Baru
                </label>
                <div className="relative">
                  <input
                    type={showPassword.baru ? "text" : "password"}
                    name="sandiBaru"
                    value={formData.sandiBaru}
                    onChange={handleChange}
                    placeholder="Minimal 8 karakter"
                    className="text-sm w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#0984E3] transition-colors pr-10"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword({
                        ...showPassword,
                        baru: !showPassword.baru,
                      })
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    disabled={loading}
                  >
                    {showPassword.baru ? <EyeSlashIcon /> : <EyeIcon />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Kata sandi terdiri dari 8 kombinasi huruf dan angka
                </p>
              </div>

              {/* Konfirmasi Sandi Baru */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Konfirmasi Sandi Baru
                </label>
                <div className="relative">
                  <input
                    type={showPassword.konfirmasi ? "text" : "password"}
                    name="konfirmasiSandiBaru"
                    value={formData.konfirmasiSandiBaru}
                    onChange={handleChange}
                    placeholder="Konfirmasi sandi baru sama dengan sandi baru"
                    className="text-sm w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#0984E3] transition-colors pr-10"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword({
                        ...showPassword,
                        konfirmasi: !showPassword.konfirmasi,
                      })
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    disabled={loading}
                  >
                    {showPassword.konfirmasi ? <EyeSlashIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="text-xs px-8 py-2 border-2 border-[#0984E3] text-[#0984E3] font-medium rounded-xl hover:bg-gray-200 transition-colors shadow-lg disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="text-xs px-8 py-2 bg-[#0984E3] text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-lg disabled:opacity-50 flex items-center gap-2"
            >
              {loading && (
                <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></span>
              )}
              {loading ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </div>
      </div>

      {/* modal konfirmasi */}
      <ModalConfirm
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onConfirm={confirmSave}
        title={activeTab === "profil" ? "Simpan Perubahan?" : "Ubah Password?"}
        message={
          activeTab === "profil"
            ? "Profil admin akan diperbarui"
            : "Password akan diubah. Pastikan Anda mengingat password baru."
        }
        type="save"
        confirmText="Ya, Simpan"
        cancelText="Batal"
      />
    </div>
  );
};

export default EditProfil;
