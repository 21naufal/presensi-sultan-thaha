import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import ModalConfirm from "./ModalConfirm";
import { calculateDurationPreview } from "../../utils/timeShift";
import api from "../../services/api";

// import icon dari components (reusable, tidak dibuat ulang)
import { BackIcon, ChevronDownIcon } from "../../components/icons/SystemIcons";

const FormShiftUnit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    shiftId: "",
    unit: "",
  });

  const [shiftList, setShiftList] = useState([]);
  const [unitList, setUnitList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // State baru untuk modal "Buat Shift Baru"
  const [showCreateShiftModal, setShowCreateShiftModal] = useState(false);
  const [newShift, setNewShift] = useState({
    namaShift: "",
    kodeShift: "",
    jamMulai: "",
    jamSelesai: "",
  });

  // Fetch master data untuk dropdown
  const fetchMasterData = async () => {
    try {
      const [shiftRes, unitRes] = await Promise.all([
        api.get("/shifts"),
        api.get("/units"),
      ]);

      if (shiftRes.data.status === "success") {
        setShiftList(shiftRes.data.data);
      }
      if (unitRes.data.status === "success") {
        setUnitList(unitRes.data.data);
      }
    } catch (err) {
      console.error("Error fetch master data:", err);
      setError("Gagal memuat data master");
    }
  };

  // Load data jika mode edit
  const fetchShiftUnitData = async (shiftUnitId) => {
    try {
      setLoading(true);
      const response = await api.get("/shift-units");

      if (response.data.status === "success") {
        const item = response.data.data.find(
          (su) => su.id === parseInt(shiftUnitId),
        );
        if (item) {
          setFormData({
            shiftId: item.shiftId?.toString() || "",
            unit: item.unitId?.toString() || "",
          });
        }
      }
    } catch (err) {
      console.error("Error fetch shift unit:", err);
      setError("Gagal memuat data shift unit");
      toast.error("❌ Data tidak ditemukan");
      navigate("/admin/shift-unit");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  useEffect(() => {
    if (isEdit && id) {
      fetchShiftUnitData(id);
    }
  }, [isEdit, id]);

  // handle ubah
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  // handle ubah untuk form shift baru
  const handleNewShiftChange = (e) => {
    const { name, value } = e.target;
    setNewShift((prev) => ({ ...prev, [name]: value }));
  };

  // handle simpan shift baru
  const handleSaveNewShift = async () => {
    if (
      !newShift.namaShift ||
      !newShift.kodeShift ||
      !newShift.jamMulai ||
      !newShift.jamSelesai
    ) {
      toast.error("❌ Semua field wajib diisi");
      return;
    }

    try {
      setLoading(true);
      const response = await api.post("/shifts", {
        namaShift: newShift.namaShift.trim(),
        kodeShift: newShift.kodeShift.trim().toUpperCase(),
        jamMulai: newShift.jamMulai,
        jamSelesai: newShift.jamSelesai,
      });

      if (response.data.status === "success") {
        toast.success("✅ Shift baru berhasil dibuat!");

        // Refresh list shift dan auto-select shift yang baru dibuat
        await fetchMasterData();
        setFormData((prev) => ({
          ...prev,
          shiftId: response.data.data.id.toString(),
        }));

        // Reset form dan tutup modal
        setNewShift({
          namaShift: "",
          kodeShift: "",
          jamMulai: "",
          jamSelesai: "",
        });
        setShowCreateShiftModal(false);
      }
    } catch (err) {
      console.error("Error create shift:", err);
      const errorMsg =
        err.response?.data?.message || "Gagal membuat shift baru";
      toast.error("❌ " + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // handle simpan
  const handleSave = () => {
    if (!formData.shiftId || !formData.unit) {
      setError("Pilih shift dan unit terlebih dahulu");
      return;
    }
    setShowSaveModal(true);
  };

  // konfirmasi simpan
  const confirmSave = async () => {
    setShowSaveModal(false);
    setLoading(true);
    setError("");

    try {
      const payload = {
        shiftId: parseInt(formData.shiftId),
        unitId: parseInt(formData.unit),
      };

      let response;
      if (isEdit) {
        // Update: DELETE old + CREATE new (karena relasi unik)
        const oldItem = await api.get("/shift-units");
        const oldEntry = oldItem.data.data.find((su) => su.id === parseInt(id));
        if (oldEntry) {
          await api.delete(
            `/shift-units/${oldEntry.shiftId}/${oldEntry.unitId}`,
          );
        }

        response = await api.post("/shift-units", {
          shiftId: payload.shiftId,
          unitId: payload.unitId,
        });
      } else {
        // CREATE: Langsung link ke unit
        response = await api.post("/shift-units", {
          shiftId: payload.shiftId,
          unitId: payload.unitId,
        });
      }

      if (response.data.status === "success") {
        toast.success(
          `✅ Shift ${isEdit ? "berhasil diperbarui" : "berhasil ditambahkan"}!`,
        );
        navigate("/admin/shift-unit");
      }
    } catch (err) {
      console.error("Error save shift unit:", err);
      const errorMsg =
        err.response?.data?.message ||
        (Array.isArray(err.response?.data?.errors)
          ? err.response?.data?.errors.join(", ")
          : null) ||
        "Terjadi kesalahan saat menyimpan data";
      setError(errorMsg);
      toast.error("❌ " + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // handle batal
  const handleCancel = () => {
    if (formData.shiftId || formData.unit) {
      setShowCancelModal(true);
    } else {
      navigate("/admin/shift-unit");
    }
  };

  const confirmCancel = () => {
    setShowCancelModal(false);
    navigate("/admin/shift-unit");
  };

  const handleBack = () => {
    navigate("/admin/shift-unit");
  };

  // Ambil info shift yang dipilih untuk preview
  const selectedShift = shiftList.find(
    (s) => s.id === parseInt(formData.shiftId),
  );

  // UI: Loading
  if (loading && isEdit && !formData.shiftId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
        <span className="ml-2 text-gray-600">Memuat data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Breadcrumb */}
      <div className="bg-white rounded-lg p-3 shadow-sm text-xs">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-800"
        >
          <BackIcon />
          <span className="font-medium">Shift Unit</span>
          <span className="text-gray-800">›</span>
          <span className="font-medium">
            {isEdit ? "Edit Shift Unit" : "Tambah Shift Unit"}
          </span>
        </button>
      </div>

      {/* konten utama */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        {/* header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800 border-b border-gray-200 pb-2">
            {isEdit ? "Edit Shift Unit" : "Tambah Shift Unit"}
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
            {/* DROPDOWN SHIFT MASTER */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Pilih Shift
              </label>
              <div className="relative">
                <select
                  name="shiftId"
                  value={formData.shiftId}
                  onChange={handleChange}
                  className="text-sm w-full px-4 py-3 pr-10 border-2 border-gray-200 rounded-xl focus:outline-none appearance-none transition-colors"
                  disabled={loading}
                >
                  <option value="">-- Pilih Shift --</option>
                  {shiftList.map((shift) => (
                    <option key={shift.id} value={shift.id}>
                      {shift.kodeShift} - {shift.namaShift} ({shift.jamMulai} -{" "}
                      {shift.jamSelesai})
                    </option>
                  ))}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronDownIcon className="w-4 h-4" />
                </div>
              </div>
              {/* Tombol Buat Shift Baru */}
              <button
                type="button"
                onClick={() => setShowCreateShiftModal(true)}
                className="text-xs text-[#0984E3] hover:underline mt-2 font-medium"
              >
                + Buat Shift Baru
              </button>
            </div>

            {/* unit */}
            <div className="min-w-[200px]">
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
          </div>

          {/* Preview durasi otomatis */}
          {selectedShift && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-700">
                Durasi shift:{" "}
                <strong>
                  {calculateDurationPreview(
                    selectedShift.jamMulai,
                    selectedShift.jamSelesai,
                  )}
                </strong>
              </p>
            </div>
          )}

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

      {/* MODAL BUAT SHIFT BARU */}
      {showCreateShiftModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
            <div className="p-6">
              <h2 className="text-lg text-left font-bold text-gray-800 mb-4">
                Buat Shift Baru
              </h2>

              <div className="space-y-4">
                {/* nama shift */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Nama Shift
                  </label>
                  <input
                    type="text"
                    name="namaShift"
                    value={newShift.namaShift}
                    onChange={handleNewShiftChange}
                    placeholder="Contoh: Pagi, Siang, Malam"
                    className="text-sm w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#0984E3] transition-colors"
                  />
                </div>

                {/* kode shift */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Kode Shift
                  </label>
                  <input
                    type="text"
                    name="kodeShift"
                    value={newShift.kodeShift}
                    onChange={handleNewShiftChange}
                    placeholder="Contoh: P, S, M"
                    maxLength={10}
                    className="text-sm w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#0984E3] transition-colors uppercase"
                  />
                </div>

                {/* jam */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">
                      Jam Masuk
                    </label>
                    <input
                      type="time"
                      name="jamMulai"
                      value={newShift.jamMulai}
                      onChange={handleNewShiftChange}
                      className="text-sm w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#0984E3] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">
                      Jam Pulang
                    </label>
                    <input
                      type="time"
                      name="jamSelesai"
                      value={newShift.jamSelesai}
                      onChange={handleNewShiftChange}
                      className="text-sm w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#0984E3] transition-colors"
                    />
                  </div>
                </div>

                {/* Preview durasi */}
                {newShift.jamMulai && newShift.jamSelesai && (
                  <div className="px-2">
                    <p className="text-xs text-gray-700">
                      Total Durasi :{" "}
                      <strong>
                        {calculateDurationPreview(
                          newShift.jamMulai,
                          newShift.jamSelesai,
                        )}
                      </strong>
                    </p>
                  </div>
                )}
              </div>

              {/* buttons */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateShiftModal(false)}
                  className="text-xs px-6 py-2 border-2 border-[#0984E3] text-[#0984E3] font-medium rounded-xl hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveNewShift}
                  disabled={loading}
                  className="text-xs px-6 py-2 bg-[#0984E3] text-white font-medium rounded-xl hover:bg-[#0975c8] disabled:opacity-50"
                >
                  {loading ? "Membuat..." : "Buat Shift"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

export default FormShiftUnit;
