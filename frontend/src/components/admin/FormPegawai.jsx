import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import ModalConfirm from "./ModalConfirm";
import { formatDateForInput } from "../../utils/timeUtils";
import api from "../../services/api";

// import icon dari components (reusable, tidak dibuat ulang)
import {
  BackIcon,
  ChevronDownIcon,
  EyeIcon,
  EyeSlashIcon,
} from "../../components/icons/SystemIcons";

const FormPegawai = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    nama: "",
    jenisKelamin: "",
    unit: "",
    tanggalMulaiKerja: "",
    noHp: "",
    email: "",
    password: "",
    status: "aktif",
  });

  const [unitList, setUnitList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Fetch unit list untuk dropdown
  const fetchUnitList = async () => {
    try {
      const response = await api.get("/employees/units-list");
      if (response.data.status === "success") {
        setUnitList(response.data.data);
      }
    } catch (err) {
      console.error("Error fetch units:", err);
      setError("Gagal memuat daftar unit");
    }
  };

  // Load data jika mode edit
  const fetchPegawaiData = async (pegawaiId) => {
    try {
      setLoading(true);
      const response = await api.get(`/employees/${pegawaiId}`);

      if (response.data.status === "success" && response.data.data) {
        const p = response.data.data;
        setFormData({
          nama: p.nama || "",
          jenisKelamin: p.jenisKelamin || "",
          unit: p.unitId?.toString() || "",
          tanggalMulaiKerja: formatDateForInput(p.tanggalMulaiKerja) || "",
          noHp: p.noHp?.replace(/^0/, "") || "",
          email: p.email || "",
          password: "",
          status: p.status || "aktif",
        });
      }
    } catch (err) {
      console.error("Error fetch pegawai:", err);
      setError("Gagal memuat data pegawai");
      toast.error("❌ Data tidak ditemukan");
      navigate("/admin/pegawai");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnitList();
  }, []);

  useEffect(() => {
    if (isEdit && id) {
      fetchPegawaiData(id);
    }
  }, [isEdit, id]);

  // handle ubah
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  // handle format no_hp (auto +62)
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

  // handle simpan
  const handleSave = () => {
    // Validasi sederhana
    if (
      !formData.nama ||
      !formData.jenisKelamin ||
      !formData.unit ||
      !formData.noHp ||
      !formData.tanggalMulaiKerja
    ) {
      setError("Semua field wajib diisi");
      return;
    }

    if (!isEdit && !formData.password) {
      setError("Password wajib diisi untuk pegawai baru");
      return;
    }

    if (formData.password && formData.password.length < 8) {
      setError("Password minimal 8 karakter");
      return;
    }

    // Validasi: nomor harus 11 digit, mulai dari 08
    const phoneRegex = /^08[0-9]{8,11}$/;
    if (!phoneRegex.test(`0${formData.noHp}`)) {
      setError("Format No. HP tidak valid (contoh: 081234567890)");
      return;
    }

    setShowSaveModal(true);
  };

  // konfirmasi simpan - panggil API
  const confirmSave = async () => {
    setShowSaveModal(false);
    setLoading(true);
    setError("");

    try {
      const payload = {
        nama: formData.nama.trim(),
        jenisKelamin: formData.jenisKelamin,
        unitId: parseInt(formData.unit),
        noHp: `0${formData.noHp}`,
        email: formData.email?.trim() || null,
        tanggalMulaiKerja: formData.tanggalMulaiKerja,
        status: formData.status,
      };

      // Hanya kirim password jika diisi (untuk edit) atau wajib untuk create
      if (!isEdit || (isEdit && formData.password.trim() !== "")) {
        payload.password = formData.password;
      }

      let response;
      if (isEdit) {
        response = await api.put(`/employees/${id}`, payload);
      } else {
        response = await api.post("/employees", payload);
      }

      if (response.data.status === "success") {
        toast.success(
          `✅ Pegawai ${isEdit ? "berhasil diperbarui" : "berhasil ditambahkan"}!`,
        );
        navigate("/admin/pegawai");
      }
    } catch (err) {
      console.error("Error save pegawai:", err);
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.errors?.join(", ") ||
        "Terjadi kesalahan saat menyimpan data";
      setError(errorMsg);
      toast.error("❌ " + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // handle batal
  const handleCancel = () => {
    if (formData.nama || formData.noHp) {
      setShowCancelModal(true);
    } else {
      navigate("/admin/pegawai");
    }
  };

  const confirmCancel = () => {
    setShowCancelModal(false);
    navigate("/admin/pegawai");
  };

  const handleBack = () => {
    navigate("/admin/pegawai");
  };

  // UI: Loading
  if (loading && isEdit && !formData.nama) {
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
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-800"
        >
          <BackIcon />
          <span className="font-medium">Pegawai</span>
          <span className="text-gray-800">›</span>
          <span className="font-medium">
            {isEdit ? "Edit Pegawai" : "Tambah Pegawai"}
          </span>
        </button>
      </div>

      {/* konten utama */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        {/* header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800 border-b border-gray-200 pb-2">
            {isEdit ? "Edit Pegawai" : "Tambah Pegawai"}
          </h1>
        </div>

        {/* Tampilkan error form jika ada */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
            ⚠️ {error}
          </div>
        )}

        {/* form */}
        <div className="space-y-6 mt-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* nama lengkap */}
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

            {/* jenis Kelamin */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Jenis Kelamin
              </label>
              <div className="relative">
                <select
                  name="jenisKelamin"
                  value={formData.jenisKelamin}
                  onChange={handleChange}
                  className="text-sm w-full px-4 py-3 pr-10 border-2 border-gray-200 rounded-xl focus:outline-none appearance-none transition-colors"
                  disabled={loading}
                >
                  <option value="">Pilih Jenis Kelamin</option>
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronDownIcon className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* unit */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Unit
              </label>
              <div className="relative">
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  className="text-sm w-full px-4 py-3 pr-10 border-2 border-gray-200 rounded-xl focus:outline-none appearance-none transition-colors"
                  disabled={loading}
                >
                  <option value="">Pilih Unit</option>
                  {unitList.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.namaUnit}
                    </option>
                  ))}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronDownIcon className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* tanggal mulai kerja */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Tanggal Mulai Kerja
              </label>
              <input
                type="date"
                name="tanggalMulaiKerja"
                value={formData.tanggalMulaiKerja}
                onChange={handleChange}
                max={new Date().toLocaleDateString("sv-SE")}
                className="text-sm w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#0984E3] transition-colors"
                disabled={loading}
              />
            </div>

            {/* no. hp */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                No. HP
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
                  placeholder="823-4567-8910"
                  maxLength={12}
                  className="text-sm w-full px-4 py-3 border-2 border-gray-200 rounded-r-xl focus:outline-none focus:border-[#0984E3] transition-colors"
                  disabled={loading}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Contoh: 82385740934 (tanpa 0 atau +62)
              </p>
            </div>

            {/* kata sandi */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={
                    isEdit
                      ? "Kosongkan jika tidak ingin mengubah"
                      : "Minimal 8 karakter"
                  }
                  className="text-sm w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#0984E3] transition-colors"
                  disabled={loading}
                />
                {/* icon mata - pakai komponen reusable */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  disabled={loading}
                >
                  {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {isEdit
                  ? "Biarkan kosong jika tidak ingin mengubah password"
                  : "Minimal 8 karakter, kombinasi huruf dan angka"}
              </p>
            </div>

            {/* alamat email */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Alamat Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="pegawai@email.com"
                className="text-sm w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#0984E3] transition-colors"
                disabled={loading}
              />
            </div>

            {/* status */}
            {isEdit && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Status
                </label>
                <div className="relative">
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="text-sm w-full px-4 py-3 pr-10 border-2 border-gray-200 rounded-xl focus:outline-none appearance-none transition-colors"
                    disabled={loading}
                  >
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif">Nonaktif</option>
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ChevronDownIcon className="w-4 h-4" />
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Nonaktif = Pegawai tidak bisa login, tapi data riwayat tetap
                  ada
                </p>
              </div>
            )}
          </div>

          {/* buttons */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="text-xs px-8 py-2 border-2 border-[#0984E3] text-[#0984E3] font-medium rounded-xl shadow-lg disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="text-xs px-8 py-2 bg-[#0984E3] text-white font-medium rounded-xl shadow-lg disabled:opacity-50 flex items-center gap-2"
            >
              {loading && (
                <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></span>
              )}
              {loading ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </div>
      </div>

      {/* pop up modal konfirmasi */}
      <ModalConfirm
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onConfirm={confirmSave}
        title={isEdit ? "Simpan Perubahan?" : "Simpan Data Baru?"}
        message={
          isEdit
            ? "Data pegawai akan diperbarui. Password hanya berubah jika diisi."
            : "Data pegawai dan akun login akan dibuat."
        }
        type="save"
        confirmText="Ya, Simpan"
        cancelText="Batal"
      />
      <ModalConfirm
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={confirmCancel}
        title="Batalkan Input?"
        message="Data yang sudah diisi akan hilang"
        type="cancel"
        confirmText="Ya, Batalkan"
        cancelText="Lanjut Isi"
      />
    </div>
  );
};

export default FormPegawai;
