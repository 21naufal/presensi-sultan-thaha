import { useState } from "react";
import ModalConfirm from "./ModalConfirm";

// Components
import {
  ChevronDownIcon,
  ChevronUpIcon,
} from "../../components/icons/SystemIcons";

const ImportPreviewModal = ({
  open,
  onClose,
  onConfirm,
  parsedData,
  errors,
  warnings,
  year,
  month,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  if (!open) return null;

  const totalPegawai = parsedData.length;
  const totalEntries = parsedData.reduce(
    (sum, p) => sum + p.jadwal.filter((j) => j.isValid).length,
    0,
  );

  // Trigger modal alih-alih window.confirm
  const handleConfirm = () => {
    setShowConfirmModal(true);
  };

  // Eksekusi impor setelah user menekan "Ya, Impor"
  const executeConfirm = () => {
    setShowConfirmModal(false);
    onConfirm(); // Panggil fungsi onConfirm dari parent
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-6 text-gray-800">
            <h2 className="text-lg font-bold">Preview Jadwal</h2>
            <p className="text-xs opacity-90">
              Periksa data berikut sebelum mengimpor ke sistem
            </p>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 mb-3">
              <div className="border border-gray-200 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-gray-800">
                  {totalPegawai}
                </p>
                <p className="text-xs text-gray-800 mt-1">Pegawai</p>
              </div>
              <div className="border border-gray-200 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-gray-800">
                  {totalEntries}
                </p>
                <p className="text-xs text-gray-800 mt-1">Data Jadwal</p>
              </div>
              <div className="border border-gray-200 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-gray-800">
                  {errors.length}
                </p>
                <p className="text-xs text-gray-800 mt-1">Error</p>
              </div>
            </div>

            {/* Errors */}
            {errors.length > 0 && (
              <div className="mb-4 border border-gray-200 rounded-xl p-4">
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  Error ({errors.length})
                </h3>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {errors.slice(0, 10).map((err, idx) => (
                    <p key={idx} className="text-xs text-gray-700">
                      • {err}
                    </p>
                  ))}
                  {errors.length > 10 && (
                    <p className="text-xs text-gray-600 italic">
                      ... dan {errors.length - 10} error lainnya
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Warnings */}
            {warnings.length > 0 && (
              <div className="mb-4 bg-yellow-50 border border-gray-200 rounded-xl p-4">
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  Peringatan ({warnings.length})
                </h3>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {warnings.map((warn, idx) => (
                    <p key={idx} className="text-xs text-gray-700">
                      • {warn}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Success Message */}
            {errors.length === 0 && (
              <div className="mb-4 border border-gray-200 rounded-xl p-4">
                <p className="text-xs text-gray-800 flex items-center gap-2">
                  <span>Semua data valid dan siap diimpor ke sistem!</span>
                </p>
              </div>
            )}

            {/* Detail Toggle */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2 px-4 py-3 mb-3"
            >
              {showDetails ? (
                <ChevronUpIcon className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronDownIcon className="w-4 h-4 text-gray-600" />
              )}
              <span className="font-medium text-gray-800 text-xs">
                Lihat Detail Data Pegawai
              </span>
            </button>

            {/* Detail Table */}
            {showDetails && (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">
                          Nama
                        </th>
                        <th className="px-3 py-2 text-center font-medium">
                          Jadwal Terisi
                        </th>
                        <th className="px-3 py-2 text-center font-medium">
                          Shift
                        </th>
                        <th className="px-3 py-2 text-center font-medium">
                          Libur
                        </th>
                        <th className="px-3 py-2 text-center font-medium">
                          Izin
                        </th>
                        <th className="px-3 py-2 text-center font-medium">
                          Cuti
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {parsedData.map(({ pegawai, jadwal }, idx) => {
                        const validEntries = jadwal.filter((j) => j.isValid);
                        const shiftCount = validEntries.filter(
                          (j) => j.status === "shift",
                        ).length;
                        const liburCount = validEntries.filter(
                          (j) => j.status === "libur",
                        ).length;
                        const izinCount = validEntries.filter(
                          (j) => j.status === "izin",
                        ).length;
                        const cutiCount = validEntries.filter(
                          (j) => j.status === "cuti",
                        ).length;

                        return (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-3 py-2 font-medium">
                              {pegawai.nama}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <span className="px-2 py-0.5 bg-[#0984E3] text-white rounded font-semibold">
                                {validEntries.length}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-center">
                              {shiftCount}
                            </td>
                            <td className="px-3 py-2 text-center">
                              {liburCount}
                            </td>
                            <td className="px-3 py-2 text-center">
                              {izinCount}
                            </td>
                            <td className="px-3 py-2 text-center">
                              {cutiCount}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 text-xs font-medium">
            <button
              onClick={onClose}
              className="px-6 py-2 border-2 border-[#0984E3] text-[#0984E3] rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleConfirm}
              disabled={errors.length > 0}
              className="px-6 py-2 bg-[#0984E3] text-white rounded-xl disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <span>Impor Sekarang</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal Konfirmasi Kustom untuk Impor */}
      <ModalConfirm
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={executeConfirm}
        title="Konfirmasi Impor Data"
        message={`Apakah Anda yakin ingin mengimpor ${totalEntries} data jadwal untuk ${totalPegawai} pegawai?`}
        type="save"
        confirmText="Ya, Impor"
      />
    </>
  );
};

export default ImportPreviewModal;
