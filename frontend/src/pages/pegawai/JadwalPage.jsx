// React
import { useEffect, useState } from "react";

// Components
import BottomNav from "../../components/layout/BottomNav";
import TestingPanel from "../../components/pegawai/TestingPanel";
import {
  ClockIcon,
  LocationIcon,
  TestIcon,
} from "../../components/icons/SystemIcons";

// Services
import api from "../../services/api";

// Utils
import { getMonthName, formatDateForHistory } from "../../utils/timeUtils";

// konstanta status badge dan card style
const STATUS_BADGE_MAP = {
  libur: { text: "Libur", color: "bg-gray-400" },
  izin: { text: "Izin", color: "bg-blue-400" },
  cuti: { text: "Cuti", color: "bg-green-400" },
  shift: { text: "Ada Jadwal Shift", color: "bg-[#0984E3]" },
};

const DEFAULT_STATUS_BADGE = { text: "Tidak Diketahui", color: "bg-gray-400" };

// helper format status badge
const getStatusBadge = (status) => {
  return STATUS_BADGE_MAP[status] || DEFAULT_STATUS_BADGE;
};

const getCardStyle = (status) => {
  switch (status) {
    case "libur":
    case "izin":
    case "cuti":
      return "bg-gray-200 border border-gray-200";
    case "shift":
      return "bg-white border-l-5 border-[#0984E3]";
    default:
      return "bg-white";
  }
};

const JadwalPage = () => {
  // State
  const [jadwalList, setJadwalList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showTestPanel, setShowTestPanel] = useState(false);

  // Fetch data jadwal presensi dari server
  const fetchJadwal = async () => {
    try {
      setLoading(true);
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;

      const response = await api.get(`/pegawai/jadwal/${year}/${month}`);

      if (response.data.status === "success") {
        setJadwalList(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching jadwal:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJadwal();
  }, [currentMonth]);

  // Handle toggle (testing pannel)
  const handleToggleTestPanel = () => {
    setShowTestPanel((prev) => !prev);
  };

  // UI Tampilan halaman utama
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-[#0974c6] text-white p-3 pl-5 shadow-lg">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-lg font-semibold">Jadwal Presensi</h1>
            <p className="text-xs">
              {getMonthName(currentMonth)} {currentMonth.getFullYear()}
            </p>
          </div>

          {/* tombol toggle testing panel */}
          <button
            onClick={handleToggleTestPanel}
            className={`p-2 rounded-lg transition ${
              showTestPanel
                ? "bg-white/20 text-white"
                : "bg-white/10 text-white/80 hover:bg-white/20"
            }`}
            title="Toggle Testing Panel"
          >
            <TestIcon />
          </button>
        </div>
      </div>

      {/* konten utama */}
      <div className="p-4 space-y-4">
        {/* State loading */}
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0984E3]"></div>
          </div>
        ) : jadwalList.length === 0 ? (
          // State empty (tidak ada jadwal)
          <div className="bg-white rounded-2xl shadow-md p-6 text-center">
            <p className="text-gray-500">Tidak ada jadwal untuk bulan ini</p>
          </div>
        ) : (
          // State success (ada jadwal)
          jadwalList.map((item, index) => {
            const isShift = item.status === "shift";
            const statusBadge = getStatusBadge(item.status);

            return (
              <div
                key={index}
                className={`rounded-xl shadow-md p-4 ${getCardStyle(item.status)}`}
              >
                {/* Header tanggal & status badge */}
                <div className="flex justify-between items-start mb-3 text-sm">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">
                      {formatDateForHistory(new Date(item.tanggal))}
                    </p>
                    <p className="text-xs text-gray-600">
                      {item.namaShift || "-"}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium text-white ${statusBadge.color}`}
                  >
                    {statusBadge.text}
                  </span>
                </div>

                {/* detail shift (jika status = shift) */}
                {isShift && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <ClockIcon />
                      <span className="font-semibold">
                        {item.jamMulai} - {item.jamSelesai}
                      </span>
                    </div>

                    {item.lokasi && (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <LocationIcon />
                        <span>{item.lokasi}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* status keterangan (jika libur/izin/cuti) */}
                {!isShift && item.keterangan && (
                  <p className="text-sm text-gray-500 mt-2 pt-2 border-t border-gray-100">
                    {item.keterangan}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* testing panel */}
      {showTestPanel && (
        <TestingPanel onClose={() => setShowTestPanel(false)} />
      )}

      {/* Buttom Navigation */}
      <BottomNav />
    </div>
  );
};

export default JadwalPage;
