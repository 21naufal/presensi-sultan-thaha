// React
import { useState, useEffect } from "react";

// Components
import BottomNav from "../../components/layout/BottomNav";
import { ChevronDownIcon } from "../../components/icons/SystemIcons";

// Service
import api from "../../services/api";

// konstanta daftar bulan dan tahun
const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

// Generate range tahun
const generateYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = currentYear - 5; y <= currentYear + 1; y++) {
    years.push(y);
  }
  return years;
};

const YEAR_OPTIONS = generateYearOptions();

const RiwayatPage = () => {
  // State
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [riwayatData, setRiwayatData] = useState([]);
  const [monthName, setMonthName] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch data riwayat presensi dari server
  const fetchRiwayat = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/presensi/pegawai/riwayat?year=${selectedYear}&month=${selectedMonth}`,
      );

      if (response.data.status === "success") {
        setRiwayatData(response.data.data.riwayat);
        setMonthName(response.data.data.monthName);
      }
    } catch (err) {
      console.error("Gagal mengambil data riwayat presensi.", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiwayat();
  }, [selectedMonth, selectedYear]);

  // Handle perubahan bulan
  const handleMonthChange = (e) => {
    setSelectedMonth(parseInt(e.target.value));
  };

  // Handle perubahan tahun
  const handleYearChange = (e) => {
    setSelectedYear(parseInt(e.target.value));
  };

  // UI Tampilan halaman utama
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-[#0974c6] text-white p-3 pl-5 shadow-lg">
        <h1 className="text-lg font-semibold">Riwayat Presensi</h1>
        <p className="text-xs">Riwayat kehadiran Anda</p>
      </div>

      {/* filter dropdown */}
      <div className="p-4">
        <div className="flex gap-3">
          {/* Dropdown bulan */}
          <div className="flex-1 relative">
            <select
              value={selectedMonth}
              onChange={handleMonthChange}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#0984E3] appearance-none bg-white text-sm font-medium"
            >
              {MONTHS.map((month, index) => (
                <option key={index + 1} value={index + 1}>
                  {month}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <ChevronDownIcon />
            </div>
          </div>

          {/* Dropdown tahun */}
          <div className="w-32 relative">
            <select
              value={selectedYear}
              onChange={handleYearChange}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#0984E3] appearance-none bg-white text-sm font-medium"
            >
              {YEAR_OPTIONS.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <ChevronDownIcon />
            </div>
          </div>
        </div>
      </div>

      {/* konten utama */}
      <div className="px-4 pb-4">
        {/* State loading */}
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0984E3]"></div>
          </div>
        ) : riwayatData.length === 0 ? (
          // State Empty (tidak ada data)
          <div className="bg-white rounded-2xl shadow-md p-6 text-center">
            <p className="text-gray-500 text-sm">
              Tidak ada data presensi untuk bulan ini
            </p>
          </div>
        ) : (
          // State Success (ada data)
          <div className="space-y-4">
            {riwayatData.map((item, index) => (
              <div key={index} className="bg-white rounded-xl shadow-md p-4">
                {/* Header tanggal & jam kerja */}
                <div className="flex justify-between items-start text-sm">
                  <div>
                    <p className="font-semibold text-gray-800">
                      {item.tanggalDisplay.split(",")[0]}
                    </p>
                    <p className="text-xs text-gray-600">
                      {item.tanggalDisplay.split(",")[1]}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Jam Kerja</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {item.jamKerja}
                    </p>
                  </div>
                </div>

                {/* Info Shift (jika ada) */}
                {item.shift !== "-" && (
                  <p className="text-xs font-medium text-gray-800 mb-0">
                    Shift - {item.shift}
                  </p>
                )}

                {/* Presensi Masuk */}
                <div className="flex justify-between items-center pt-2">
                  <p className="text-sm text-gray-600">Presensi Masuk</p>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {item.jamMasuk}
                      {item.jamMasuk !== "-" && (
                        <span
                          className={`ml-2 px-2 py-0.5 rounded text-xs text-white ${
                            item.statusMasuk === "Terlambat"
                              ? "bg-yellow-400"
                              : "bg-green-500"
                          }`}
                        >
                          {item.statusMasuk}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Presensi Pulang */}
                <div className="flex justify-between items-center pt-1">
                  <p className="text-sm text-gray-600">Presensi Pulang</p>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {item.jamPulang}
                      {item.jamPulang !== "-" && (
                        <span
                          className={`ml-2 px-2 py-0.5 rounded text-xs text-white ${
                            item.statusPulang === "Terlambat"
                              ? "bg-yellow-400"
                              : item.statusPulang === "Tidak Presensi"
                                ? "bg-red-500"
                                : "bg-green-500"
                          }`}
                        >
                          {item.statusPulang}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Status Akhir */}
                <div className="mt-3 pt-1 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-gray-500">Keterangan</p>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${item.statusBadge}`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Buttom Navigation */}
      <BottomNav />
    </div>
  );
};

export default RiwayatPage;
