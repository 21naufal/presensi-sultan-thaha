import { useEffect, useState } from "react";
import api from "../../services/api";

// Helper: Format keterangan menjadi teks lengkap (DIPERBAIKI)
const formatKeteranganText = (keterangan) => {
  // Handle null, undefined, atau string kosong
  if (!keterangan || keterangan === "") return "-";

  // Cek simbol
  if (keterangan === "!") return "(!) Melebihi jam kerja";
  if (keterangan === "+") return "(+) Lembur";
  if (keterangan === "-") return "(-) Tidak absen pulang";

  // Return apa adanya (untuk teks custom dari koreksi lama)
  return keterangan;
};

const KoreksiDetailModal = ({ open, onClose, jadwalId }) => {
  const [koreksiData, setKoreksiData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && jadwalId) {
      fetchKoreksiDetail();
    }
  }, [open, jadwalId]);

  const fetchKoreksiDetail = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/admin/presensi/admin/koreksi-detail/${jadwalId}`,
      );
      if (response.data.status === "success") {
        setKoreksiData(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching koreksi detail:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-100 overflow-hidden">
        <div className="p-6 pb-0">
          <h2 className="text-lg font-bold text-gray-800 text-center">
            Detail Koreksi Kehadiran
          </h2>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-800"></div>
            </div>
          ) : koreksiData ? (
            <div className="space-y-2">
              {/* Info Dasar */}
              <div className="text-xs space-y-0">
                <div className="flex">
                  <span className="font-semibold text-gray-800 w-28">Nama</span>
                  <span className="text-gray-800">: {koreksiData.nama}</span>
                </div>
                <div className="flex">
                  <span className="font-semibold text-gray-800 w-28">
                    Tanggal
                  </span>
                  <span className="text-gray-800">: {koreksiData.tanggal}</span>
                </div>
                <div className="flex">
                  <span className="font-semibold text-gray-800 w-28">
                    Jam Kerja
                  </span>
                  <span className="text-gray-800">
                    : {koreksiData.jamKerja}
                  </span>
                </div>
                <div className="flex">
                  <span className="font-semibold text-gray-800 w-28">
                    Jam Masuk
                  </span>
                  <span className="text-gray-800">
                    : {koreksiData.jamMasuk}
                  </span>
                </div>
                <div className="flex">
                  <span className="font-semibold text-gray-800 w-28">
                    Jam Pulang
                  </span>
                  <span className="text-gray-800">
                    : {koreksiData.jamPulang}
                  </span>
                </div>
              </div>

              {/* Status dan Keterangan Sistem */}
              <div className="pt-0">
                <h3 className="text-xs font-semibold text-gray-800 mb-1">
                  Status dan Keterangan Sebelum Koreksi
                </h3>
                <div className="text-xs space-y-0 pl-2">
                  <div className="flex">
                    <span className="font-medium w-28">Status</span>
                    <span>: {koreksiData.statusSistem}</span>
                  </div>
                  <div className="flex">
                    <span className="font-medium w-28">Keterangan</span>
                    {/* Gunakan helper */}
                    <span>
                      : {formatKeteranganText(koreksiData.keteranganSistem)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status dan Keterangan Final */}
              <div className="pt-0">
                <h3 className="text-xs font-semibold text-gray-800 mb-1">
                  Status dan Keterangan Setelah Koreksi
                </h3>
                <div className="text-xs space-y-0 pl-2">
                  <div className="flex">
                    <span className="font-medium w-28">Status</span>
                    <span>: {koreksiData.statusFinal}</span>
                  </div>
                  <div className="flex">
                    <span className="font-medium w-28">Keterangan</span>
                    {/* Gunakan helper */}
                    <span>
                      : {formatKeteranganText(koreksiData.keteranganFinal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Alasan Perubahan */}
              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-2">
                  Alasan Perubahan
                </label>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 min-h-[60px]">
                  {koreksiData.alasanPerubahan || "-"}
                </div>
              </div>

              {/* Dokumen */}
              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-2">
                  Dokumen Bukti
                </label>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 flex items-center justify-between gap-3">
                  {koreksiData.dokumen ? (
                    <>
                      <span className="truncate">
                        {koreksiData.dokumen.split("/").pop()}
                      </span>
                      <a
                        href={koreksiData.dokumen}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-[#0984E3] text-white rounded-lg transition text-xs hover:bg-gray-700"
                      >
                        Lihat
                      </a>
                    </>
                  ) : (
                    <span className="text-gray-500">Tidak ada dokumen</span>
                  )}
                </div>
              </div>

              {/* Info Pembuat */}
              <div className="pt-1 text-xs">
                <div className="flex">
                  <span className="font-semibold text-gray-800 w-28">
                    Diubah oleh
                  </span>
                  <span className="text-gray-800">
                    : {koreksiData.dibuatOleh}
                  </span>
                </div>
                <div className="flex">
                  <span className="font-semibold text-gray-800 w-28">
                    Tanggal Koreksi
                  </span>
                  <span className="text-gray-800">
                    : {koreksiData.tanggalDibuat}
                  </span>
                </div>
              </div>

              <div className="flex justify-center mt-6">
                <button
                  onClick={onClose}
                  className="text-xs px-8 py-2 font-medium rounded-xl transition-colors shadow-lg flex items-center gap-2 bg-[#0984E3] text-white hover:bg-gray-600"
                >
                  Tutup
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 text-sm">
              Tidak ada data koreksi
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KoreksiDetailModal;
