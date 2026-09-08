import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { getMonthName } from "../../utils/helpers";

// import icon dari components (reusable, tidak dibuat ulang)
import { ChevronDownIcon } from "../icons/SystemIcons";

const CorrectionModal = ({ open, onClose, onSave, data, year, month }) => {
  const [statusBaru, setStatusBaru] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [alasan, setAlasan] = useState("");
  const [file, setFile] = useState(null);

  // Reset form saat modal dibuka
  useEffect(() => {
    if (open) {
      setStatusBaru("");
      setKeterangan("");
      setAlasan("");
      setFile(null);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = () => {
    // Jika status baru kosong, gunakan status lama dari data.entry
    const finalStatusBaru = statusBaru || data?.entry?.status;

    if (!finalStatusBaru) {
      toast.error("Data status tidak valid");
      return;
    }

    // kirim data ke parent component (RekapKehadiran)
    onSave({
      statusBaru: finalStatusBaru,
      keterangan,
      alasan,
      file,
    });
  };

  // Format tanggal: "01 Februari 2026"
  const tanggal = `${String(data?.day).padStart(2, "0")} ${getMonthName?.(month) || ""} ${year}`;

  // Status saat ini
  const statusSaatIni = data?.entry?.status || "-";

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-100 overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-1">
          <h2 className="text-lg font-bold text-gray-800 text-center">
            Koreksi Status Kehadiran
          </h2>
        </div>

        {/* Konten */}
        <div className="p-6 pt-1">
          {/* Info Pegawai */}
          <div className="mb-6">
            <div className="flex items-start">
              <span className="text-xs font-semibold text-gray-800 w-32 flex-shrink-0">
                Nama
              </span>
              <span className="text-xs text-gray-800">
                : {data?.pegawai?.nama}
              </span>
            </div>
            <div className="flex items-start">
              <span className="text-xs font-semibold text-gray-800 w-32 flex-shrink-0">
                Tanggal
              </span>
              <span className="text-xs text-gray-800">: {tanggal}</span>
            </div>
            <div className="flex items-start">
              <span className="text-xs font-semibold text-gray-800 w-32 flex-shrink-0">
                Jam Kerja
              </span>
              <span className="text-xs text-gray-800">: 06.00 - 18.00</span>
            </div>
            <div className="flex items-start">
              <span className="text-xs font-semibold text-gray-800 w-32 flex-shrink-0">
                Jam Masuk
              </span>
              <span className="text-xs text-gray-800">
                : {data?.entry?.jamMasuk || "-"}
              </span>
            </div>
            <div className="flex items-start">
              <span className="text-xs font-semibold text-gray-800 w-32 flex-shrink-0">
                Jam Pulang
              </span>
              <span className="text-xs text-gray-800">
                : {data?.entry?.jamPulang || "-"}
              </span>
            </div>

            {/* Mapping Status Saat Ini */}
            <div className="flex items-start">
              <span className="text-xs font-semibold text-gray-800 w-32 flex-shrink-0">
                Status Saat ini
              </span>
              <span className="text-xs text-gray-800">
                :{" "}
                {statusSaatIni === "hadir"
                  ? "H - Hadir"
                  : statusSaatIni === "terlambat"
                    ? "T - Terlambat"
                    : statusSaatIni === "izin"
                      ? "I - Izin"
                      : statusSaatIni === "libur"
                        ? "L - Libur"
                        : statusSaatIni === "cuti"
                          ? "C - Cuti"
                          : statusSaatIni === "alpa" ||
                              statusSaatIni === "shift"
                            ? "A - Alpa / Tanpa Keterangan"
                            : statusSaatIni}
              </span>
            </div>

            {/* Membaca markerKanan / keteranganSistem dari backend */}
            <div className="flex items-start">
              <span className="text-xs font-semibold text-gray-800 w-32 flex-shrink-0">
                Keterangan
              </span>
              <span className="text-xs text-gray-800">
                :{" "}
                {data?.entry?.markerKanan === "!"
                  ? "! - Melebihi jam kerja"
                  : data?.entry?.markerKanan === "+"
                    ? "+ - Lembur"
                    : data?.entry?.markerKanan === "-"
                      ? "- - Tidak absen pulang"
                      : data?.entry?.keteranganSistem === "!"
                        ? "! - Melebihi jam kerja"
                        : data?.entry?.keteranganSistem === "+"
                          ? "+ - Lembur"
                          : data?.entry?.keteranganSistem === "-"
                            ? "- - Tidak absen pulang"
                            : "-"}
              </span>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-2">
            {/* Status Baru */}
            <div>
              <label className="block text-xs font-semibold text-gray-800 mb-2">
                Status Baru
              </label>
              <div className="relative">
                <select
                  value={statusBaru}
                  onChange={(e) => setStatusBaru(e.target.value)}
                  className="w-full px-4 pr-10 py-2.5 border-2 border-gray-300 rounded-xl focus:outline-none bg-white text-xs appearance-none cursor-pointer transition-colors"
                >
                  <option value="">Pilih Status</option>
                  <option value="hadir">H - Hadir</option>
                  <option value="terlambat">T - Terlambat</option>
                  <option value="alpa">A - Tanpa Keterangan</option>
                  <option value="izin">I - Izin</option>
                  <option value="libur">L - Libur</option>
                  <option value="cuti">C - Cuti</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                  <ChevronDownIcon className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Keterangan */}
            <div>
              <label className="block text-xs font-semibold text-gray-800 mb-2">
                Keterangan
              </label>
              <div className="relative">
                <select
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  className="w-full px-4 pr-10 py-2.5 border-2 border-gray-300 rounded-xl focus:outline-none bg-white text-xs appearance-none cursor-pointer transition-colors"
                >
                  <option value="">Pilih Keterangan</option>
                  <option value="lembur">+ (Lembur)</option>
                  <option value="melebihi_jam">! (Melebihi jam kerja)</option>
                  <option value="tidak_pulang">- (Tidak absen pulang)</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                  <ChevronDownIcon className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Alasan Perubahan */}
            <div>
              <label className="block text-xs font-semibold text-gray-800 mb-2">
                Alasan Perubahan
              </label>
              <textarea
                value={alasan}
                onChange={(e) => setAlasan(e.target.value)}
                placeholder="Masukkan alasan koreksi..."
                rows={3}
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:outline-none text-xs resize-none transition-colors"
              />
            </div>

            {/* Lampiran Bukti */}
            <div>
              <label className="block text-xs font-medium text-gray-800 mb-2">
                Lampiran Bukti{" "}
                <span className="text-gray-500 font-medium">(opsional)</span>
              </label>

              {/* Container Border Utama */}
              <label className="flex items-center gap-3 px-2 py-2 border-2 border-gray-300 rounded-xl cursor-pointer hover:border-gray-400 transition-colors">
                {/* Tombol Browse */}
                <div className="bg-[#0984E3] text-white p-2 px-5 rounded-lg text-xs flex-shrink-0">
                  Browse
                </div>

                {/* Area Info File & Tombol Hapus */}
                <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                  {file ? (
                    <div className="flex flex-col overflow-hidden">
                      <span
                        className="text-xs font-medium text-gray-800 truncate"
                        title={file.name}
                      >
                        {file.name}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500">
                      Upload File Bukti
                    </span>
                  )}

                  {/* Tombol Hapus */}
                  {file && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setFile(null);
                      }}
                      className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 flex-shrink-0"
                    >
                      Hapus
                    </button>
                  )}
                </div>

                {/* Hidden Input File */}
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="hidden"
                  accept="image/*,.pdf"
                />
              </label>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-between items-center mt-8">
            <button
              type="button"
              onClick={onClose}
              className="text-xs px-8 py-2 border-2 border-[#0984E3] text-[#0984E3] font-medium rounded-xl hover:bg-gray-200 transition-colors shadow-lg disabled:opacity-50"
            >
              Batal
            </button>
            <button
              onClick={handleSubmit}
              className="text-xs px-8 py-2 font-medium rounded-xl transition-colors shadow-lg flex items-center gap-2 bg-[#0984E3] text-white"
            >
              Simpan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CorrectionModal;
