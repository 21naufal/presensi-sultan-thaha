import { useState } from "react";

// import icon dari components (reusable, tidak dibuat ulang)
import { ChevronDownIcon } from "../icons/SystemIcons";

const EditJadwalModal = ({
  open,
  onClose,
  onSave,
  pegawai,
  tanggal,
  jadwalSaatIni,
  shifts,
}) => {
  const [selected, setSelected] = useState("");
  const [alasan, setAlasan] = useState("");
  const [file, setFile] = useState(null);

  if (!open) return null;

  const handleSubmit = async () => {
    onSave({
      selected,
      alasan,
      file,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-100 overflow-hidden">
        {/* header */}
        <div className="p-6 pb-2">
          <h2 className="text-sm font-bold text-gray-800 text-center">
            Ubah Jadwal Presensi
          </h2>
        </div>

        {/* konten */}
        <div className="p-6 pt-2">
          {/* info pegawai */}
          <div className="mb-6">
            <div className="flex items-start">
              <span className="text-xs font-semibold text-gray-800 w-25 flex-shrink-0">
                Nama
              </span>
              <span className="text-xs text-gray-800 font-medium">
                : {pegawai?.nama}
              </span>
            </div>
            <div className="flex items-start">
              <span className="text-xs font-semibold text-gray-800 w-25 flex-shrink-0">
                Tanggal
              </span>
              <span className="text-xs text-gray-800 font-medium">
                : {tanggal}
              </span>
            </div>
            <div className="flex items-start">
              <span className="text-xs font-semibold text-gray-800 w-25 flex-shrink-0">
                Jadwal saat ini
              </span>
              <span className="text-xs text-gray-800 font-medium">
                : {jadwalSaatIni}
              </span>
            </div>
          </div>

          {/* form */}
          <div className="space-y-5">
            {/* jadwal baru */}
            <div>
              <label className="block text-xs font-semibold text-gray-800 mb-2">
                Jadwal baru
              </label>
              <div className="relative">
                <select
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                  className="w-full px-4 pr-10 py-2.5 border-2 border-gray-300 rounded-xl focus:outline-none bg-white text-xs appearance-none cursor-pointer transition-colors"
                >
                  <option value="">Pilih Jadwal</option>
                  {shifts.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                  <ChevronDownIcon className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* alasan perubahan */}
            <div>
              <label className="block text-xs font-semibold text-gray-800 mb-2">
                Alasan Perubahan
              </label>
              <textarea
                value={alasan}
                onChange={(e) => setAlasan(e.target.value)}
                placeholder="Masukkan alasan perubahan jadwal..."
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
                <div className="bg-[#0984E3] text-white p-2 px-4 rounded-lg text-xs flex-shrink-0">
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

          {/* button */}
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

export default EditJadwalModal;
