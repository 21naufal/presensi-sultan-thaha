import { useState, useEffect } from "react";

// import icon dari components (reusable, tidak dibuat ulang)
import { ChevronDownIcon } from "../icons/SystemIcons";

const tahunList = [2024, 2025, 2026, 2027, 2028];
const bulanList = [
  { value: 1, label: "Januari" },
  { value: 2, label: "Februari" },
  { value: 3, label: "Maret" },
  { value: 4, label: "April" },
  { value: 5, label: "Mei" },
  { value: 6, label: "Juni" },
  { value: 7, label: "Juli" },
  { value: 8, label: "Agustus" },
  { value: 9, label: "September" },
  { value: 10, label: "Oktober" },
  { value: 11, label: "November" },
  { value: 12, label: "Desember" },
];

const ModalPeriode = ({
  isOpen,
  onClose,
  onSubmit,
  editData,
  existingPeriods,
}) => {
  const [tahun, setTahun] = useState("");
  const [bulan, setBulan] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Reset form ketika modal dibuka/ditutup atau editData berubah
  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setTahun(editData.tahun?.toString() || "");
        setBulan(editData.bulan?.toString() || "");
      } else {
        setTahun("");
        setBulan("");
      }
      setError("");
      setSubmitting(false);
    }
  }, [isOpen, editData]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!tahun || !bulan) {
      setError("Tahun dan bulan harus dipilih");
      return;
    }

    // Cek duplikat hanya saat tambah (bukan edit)
    if (!editData) {
      const exists = existingPeriods?.some(
        (p) => p.tahun === parseInt(tahun) && p.bulan === parseInt(bulan),
      );
      if (exists) {
        setError(
          `Periode ${bulanList.find((b) => b.value === parseInt(bulan))?.label} ${tahun} sudah ada`,
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      await onSubmit({ tahun: parseInt(tahun), bulan: parseInt(bulan) });
    } catch (err) {
      setError("Terjadi kesalahan saat menyimpan");
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = tahun && bulan && !submitting;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-80 overflow-hidden">
        {/* header */}
        <div className="p-6 pb-4">
          <h2 className="text-lg font-bold text-gray-800 text-center">
            {editData ? "Ubah Periode Jadwal" : "Tambah Jadwal Baru"}
          </h2>
          <p className="text-gray-800 text-center text-xs font-medium">
            {editData
              ? "Pilih periode baru atau langsung simpan untuk update jika ada pegawai baru."
              : "Pilih tahun dan bulan untuk membuat periode jadwal baru."}
          </p>
        </div>

        {/* konten */}
        <form onSubmit={handleSubmit} className="p-6 pt-2">
          {/* pesan error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm text-center">{error}</p>
            </div>
          )}

          {/* form */}
          <div className="space-y-4">
            {/* tahun dropdown */}
            <div className="flex items-center justify-between px-10">
              <label className="text-xs font-medium text-gray-800 w-20">
                Tahun
              </label>
              <div className="relative flex-1">
                <select
                  value={tahun}
                  onChange={(e) => {
                    setTahun(e.target.value);
                    setError("");
                  }}
                  className="w-full px-3 pr-10 py-2 border-b-2 border-gray-300 focus:outline-none bg-white text-sm appearance-none cursor-pointer transition-colors shadow-lg rounded-lg"
                  disabled={submitting}
                >
                  <option value="">Pilih</option>
                  {tahunList.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronDownIcon className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* bulan dropdown */}
            <div className="flex items-center justify-between px-10">
              <label className="text-xs font-medium text-gray-800 w-20">
                Bulan
              </label>
              <div className="relative flex-1">
                <select
                  value={bulan}
                  onChange={(e) => {
                    setBulan(e.target.value);
                    setError("");
                  }}
                  className="w-full px-3 pr-10 py-2 border-b-2 border-gray-300 focus:outline-none bg-white text-sm appearance-none cursor-pointer transition-colors shadow-lg rounded-lg"
                  disabled={submitting}
                >
                  <option value="">Pilih</option>
                  {bulanList.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.label}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronDownIcon className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>

          {/* button */}
          <div className="flex justify-between items-center mt-8">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="text-xs px-8 py-2 border-2 border-[#0984E3] text-[#0984E3] font-medium rounded-xl shadow-lg disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!isFormValid}
              className={`text-xs px-8 py-2 font-medium rounded-xl transition-colors shadow-lg flex items-center gap-2 ${
                isFormValid
                  ? "bg-[#0984E3] text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {submitting && (
                <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></span>
              )}
              {submitting ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalPeriode;
