// src/components/admin/RiwayatPerubahanModal.jsx
import { useEffect, useState } from "react";
import api from "../../services/api";

const BASE_URL = "";

const RiwayatPerubahanModal = ({ open, onClose, jadwalId }) => {
  const [riwayat, setRiwayat] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && jadwalId) {
      fetchRiwayat();
    }
  }, [open, jadwalId]);

  const fetchRiwayat = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/schedules/riwayat/${jadwalId}`);
      if (response.data.status === "success") {
        setRiwayat(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching riwayat:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-100 overflow-hidden">
        {/* header */}
        <div className="p-6 pb-1">
          <h2 className="text-lg font-bold text-gray-800 text-left">
            Riwayat Perubahan Jadwal
          </h2>
        </div>

        {/* konten */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-800"></div>
            </div>
          ) : riwayat ? (
            <div className="space-y-4">
              {/* info dasar */}
              <div className="text-xs">
                <div className="flex">
                  <span className="font-semibold text-gray-800 w-32">Nama</span>
                  <span className="text-gray-800">: {riwayat.nama}</span>
                </div>
                <div className="flex">
                  <span className="font-semibold text-gray-800 w-32">
                    Tanggal
                  </span>
                  <span className="text-gray-800">: {riwayat.tanggal}</span>
                </div>
                <div className="flex mt-5">
                  <span className="font-semibold text-gray-800 w-32">
                    Jadwal sebelumnya
                  </span>
                  <span className="text-gray-800">
                    : {riwayat.jadwalSebelumnya}
                  </span>
                </div>
                <div className="flex">
                  <span className="font-semibold text-gray-800 w-32">
                    Jadwal baru
                  </span>
                  <span className="text-gray-800">: {riwayat.jadwalBaru}</span>
                </div>
              </div>

              {/* alasan perubahan */}
              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-2">
                  Alasan Perubahan
                </label>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 min-h-[80px]">
                  {riwayat.alasan || "-"}
                </div>
              </div>

              {/* dokumen */}
              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-2">
                  Dokumen
                </label>

                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 flex items-center justify-between gap-3">
                  {riwayat.lampiran ? (
                    <>
                      {/* Nama file */}
                      <span className="truncate">
                        {riwayat.lampiran.split("/").pop()}
                      </span>

                      {/* Tombol lihat */}
                      <a
                        href={riwayat.lampiran}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-[#0984E3] text-white rounded-lg transition text-xs"
                      >
                        Lihat
                      </a>
                    </>
                  ) : (
                    <span className="text-gray-500">Tidak ada dokumen</span>
                  )}
                </div>
              </div>

              {/* info perubahan */}
              <div className="pt-4 border-t border-gray-200 text-xs">
                <div className="flex">
                  <span className="font-semibold text-gray-800 w-32">
                    Diubah oleh
                  </span>
                  <span className="text-gray-800">: {riwayat.diubahOleh}</span>
                </div>
                <div className="flex">
                  <span className="font-semibold text-gray-800 w-32">
                    Tanggal
                  </span>
                  <span className="text-gray-800">
                    : {riwayat.tanggalPerubahan}
                  </span>
                </div>
              </div>

              {/* button */}
              <div className="flex justify-center mt-6">
                <button
                  onClick={onClose}
                  className="text-xs px-8 py-2 font-medium rounded-xl transition-colors shadow-lg flex items-center gap-2 bg-[#0984E3] text-white"
                >
                  Tutup
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 text-sm">
              Tidak ada data riwayat perubahan
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RiwayatPerubahanModal;
