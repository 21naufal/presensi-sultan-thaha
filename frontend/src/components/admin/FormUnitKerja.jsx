import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import ModalConfirm from "./ModalConfirm";
import api from "../../services/api";
import MapPreview from "../../components/admin/MapPreview";

// import icon dari components (reusable, tidak dibuat ulang)
import { BackIcon } from "../../components/icons/SystemIcons";

const FormUnitKerja = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    namaUnit: "",
    lokasiUnit: "",
    latitude: "",
    longitude: "",
    radius: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Load data unit jika mode edit
  const fetchUnitData = async (unitId) => {
    try {
      setLoading(true);
      const response = await api.get(`/units/${unitId}`);

      if (response.data.status === "success" && response.data.data) {
        const unit = response.data.data;
        setFormData({
          namaUnit: unit.namaUnit || "",
          lokasiUnit: unit.lokasiUnit || "",
          latitude: unit.latitude?.toString() || "",
          longitude: unit.longitude?.toString() || "",
          radius: unit.radius?.toString() || "",
        });
      }
    } catch (err) {
      console.error("Error fetch unit:", err);
      setError("Gagal memuat data unit");
      toast.error("❌ Data unit tidak ditemukan");
      navigate("/admin/unit-kerja");
    } finally {
      setLoading(false);
    }
  };

  // Load data jika mode edit
  useEffect(() => {
    if (isEdit && id) {
      fetchUnitData(id);
    }
  }, [isEdit, id]);

  // handle input change / edit
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Khusus field coordinates: split lat,lng
    if (name === "coordinates") {
      const [lat, lng] = value.split(",").map((s) => s.trim());
      setFormData((prev) => ({
        ...prev,
        latitude: lat || "",
        longitude: lng || "",
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error saat user mulai mengetik
    if (error) setError("");
  };

  // handle simpan - tampilkan modal konfirmasi
  const handleSave = () => {
    // Validasi sederhana sebelum simpan
    if (!formData.namaUnit.trim() || !formData.lokasiUnit.trim()) {
      setError("Nama Unit dan Lokasi Unit wajib diisi");
      return;
    }
    if (!formData.latitude || !formData.longitude || !formData.radius) {
      setError("Koordinat dan Radius wajib diisi");
      return;
    }

    setShowSaveModal(true);
  };

  // handle konfirmasi simpan - panggil API POST/PUT
  const confirmSave = async () => {
    setShowSaveModal(false);
    setLoading(true);
    setError("");

    try {
      // Siapkan payload sesuai format backend
      const payload = {
        namaUnit: formData.namaUnit.trim(),
        lokasiUnit: formData.lokasiUnit.trim(),
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        radius: parseInt(formData.radius),
      };

      let response;
      if (isEdit) {
        // UPDATE: PUT /api/units/:id
        response = await api.put(`/units/${id}`, payload);
      } else {
        // CREATE: POST /api/units
        response = await api.post("/units", payload);
      }

      if (response.data.status === "success") {
        // Redirect ke halaman list + tampilkan pesan sukses
        toast.success(
          `✅ Unit ${isEdit ? "berhasil diperbarui" : "berhasil ditambahkan"}!`,
        );
        navigate("/admin/unit-kerja");
      }
    } catch (err) {
      console.error("Error save unit:", err);

      // Tampilkan error dari backend (validasi, duplikat, dll)
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
    // Jika ada perubahan data, tampilkan konfirmasi
    if (formData.namaUnit || formData.lokasiUnit) {
      setShowCancelModal(true);
    } else {
      navigate("/admin/unit-kerja");
    }
  };

  // handle konfirmasi batal
  const confirmCancel = () => {
    setShowCancelModal(false);
    navigate("/admin/unit-kerja");
  };

  // handel kembali breadcrumb
  const handleBack = () => {
    navigate("/admin/unit-kerja");
  };

  // Handle klik di peta
  const handleMapClick = (lat, lng) => {
    setFormData((prev) => ({
      ...prev,
      latitude: lat.toFixed(8),
      longitude: lng.toFixed(8),
    }));
  };

  useEffect(() => {
    // Tidak perlu aksi khusus, MapPreview akan auto-update via props
  }, [formData.latitude, formData.longitude]);

  // UI: Tampilan Loading saat fetch data edit
  if (loading && isEdit && !formData.namaUnit) {
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
          <span className="font-medium">Unit Kerja</span>
          <span className="text-gray-800">›</span>
          <span className="font-medium">
            {isEdit ? "Edit Unit Kerja" : "Tambah Unit Kerja"}
          </span>
        </button>
      </div>

      {/* konten utama */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        {/* header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800 border-b border-gray-200 pb-2">
            {isEdit ? "Edit Unit Kerja" : "Tambah Unit Kerja"}
          </h1>
        </div>

        {/* Tampilkan error form jika ada */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
            {error}
          </div>
        )}

        {/* form */}
        <div className="space-y-6 mt-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* nama unit */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Nama Unit
              </label>
              <input
                type="text"
                name="namaUnit"
                value={formData.namaUnit}
                onChange={handleChange}
                placeholder="Masukkan nama unit"
                className="text-sm w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none transition-colors"
                disabled={loading}
              />
            </div>

            {/* lokasi Unit */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Lokasi Unit
              </label>
              <input
                type="text"
                name="lokasiUnit"
                value={formData.lokasiUnit}
                onChange={handleChange}
                placeholder="Masukkan lokasi presensi unit"
                className="text-sm w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none transition-colors"
                disabled={loading}
              />
            </div>

            {/* titik pusat tempat */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Titik Pusat Tempat
              </label>
              <input
                type="text"
                name="coordinates"
                value={`${formData.latitude}, ${formData.longitude}`}
                onChange={handleChange}
                placeholder="-1.6323435, 103.6403186"
                className="text-sm w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none transition-colors"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Format: latitude, longitude
              </p>
            </div>

            {/* radius */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Radius (dalam meter)
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="radius"
                  value={formData.radius}
                  onChange={handleChange}
                  placeholder="100"
                  min="10"
                  max="10000"
                  className="text-sm w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none transition-colors"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* preview lokasi */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              Preview Lokasi
            </label>

            <MapPreview
              latitude={formData.latitude}
              longitude={formData.longitude}
              radius={formData.radius}
              onLocationChange={handleMapClick}
            />

            {/* helper text */}
            <p className="text-xs text-gray-500 mt-1">
              Klik pada peta untuk memilih titik pusat, atau masukkan koordinat
              manual
            </p>
          </div>

          {/* buttons */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="text-xs px-8 py-2 border-2 border-[#0984E3] text-[#0984E3] font-medium rounded-xl hover:bg-gray-200 transition-colors shadow-lg"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="text-xs px-8 py-2 bg-[#0984E3] text-white font-medium rounded-xl hover:bg-gray-600 transition-colors shadow-lg"
            >
              Simpan
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
        message="Data yang diinput akan disimpan"
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

export default FormUnitKerja;
