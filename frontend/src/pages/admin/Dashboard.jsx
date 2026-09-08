import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { formatTime, formatDate } from "../../utils/timeUtils";
import DetailPresensiModal from "../../components/admin/DetailPresensiModal";
import api from "../../services/api";
import {
  SearchIcon,
  ChevronDownIcon,
  BackIcon,
  ClockIcon,
  UsersIcon,
  UserXIcon,
} from "../../components/icons/SystemIcons";

const Dashboard = () => {
  const navigate = useNavigate();

  // State untuk waktu real-time, pencarian, filter, dan modal
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("Semua Unit");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // State untuk data dari API
  const [activities, setActivities] = useState([]);
  const [summary, setSummary] = useState({
    totalHadir: 0,
    totalTerlambat: 0,
    totalAlpa: 0,
    totalPegawai: 0,
  });
  const [unitList, setUnitList] = useState(["Semua Unit"]);
  const [loading, setLoading] = useState(true);

  // Ambil data dashboard dari API
  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await api.get("/dashboard/today");

      if (response.data.status === "success") {
        const data = response.data.data;
        setActivities(data.activities);
        setSummary(data.summary);
        setUnitList(data.units);
      }
    } catch (err) {
      console.error("Error fetching dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  // Perbarui waktu setiap detik untuk jam digital
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Muat data dashboard dan atur auto-refresh setiap 30 detik
  useEffect(() => {
    fetchDashboard();
    const refreshInterval = setInterval(fetchDashboard, 30000);
    return () => clearInterval(refreshInterval);
  }, []);

  // Filter data berdasarkan pencarian nama dan unit
  const filteredData = activities.filter((item) => {
    const matchSearch = item.nama
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchUnit =
      selectedUnit === "Semua Unit" || item.unit === selectedUnit;
    return matchSearch && matchUnit;
  });

  // Buka modal detail saat foto pegawai diklik
  const handlePhotoClick = (employee) => {
    setSelectedEmployee(employee);
    setShowModal(true);
  };

  // Tutup modal detail
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedEmployee(null);
  };

  // Tentukan kelas warna untuk badge status kehadiran
  const getStatusBadgeClass = (statusType) => {
    switch (statusType) {
      case "ontime":
        return "bg-green-200 text-green-800";
      case "late":
        return "bg-yellow-400 text-yellow-900";
      case "absent":
        return "bg-red-500 text-white";
      case "libur":
        return "bg-gray-300 text-gray-800";
      case "izin":
        return "bg-blue-200 text-blue-800";
      case "cuti":
        return "bg-emerald-200 text-emerald-800";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  // Render foto pegawai dengan fallback ke avatar inisial jika foto tidak ada
  const renderPhoto = (item) => {
    const fotoUrl = item.fotoMasuk || item.fotoKeluar || item.fotoProfil;

    if (fotoUrl) {
      return (
        <img
          src={fotoUrl}
          alt={item.nama}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.nama)}&background=0984E3&color=fff`;
          }}
        />
      );
    }
    return (
      <img
        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(item.nama)}&background=0984E3&color=fff`}
        alt={item.nama}
        className="w-full h-full object-cover"
      />
    );
  };

  // Tampilan saat data sedang dimuat
  if (loading && activities.length === 0) {
    return (
      <div className="space-y-2">
        <div className="bg-white rounded-lg p-3 shadow-sm text-xs">
          <button className="flex items-center gap-2 text-gray-800">
            <BackIcon />
            <span className="font-medium">Beranda</span>
          </button>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
          <span className="ml-2 text-gray-600">Memuat data dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Breadcrumb navigasi */}
      <div className="bg-white rounded-lg p-3 shadow-sm text-xs">
        <button className="flex items-center gap-2 text-gray-800">
          <BackIcon />
          <span className="font-medium">Beranda</span>
        </button>
      </div>

      {/* Konten utama halaman */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        {/* Header halaman */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800 border-b border-gray-200 pb-2">
            Beranda
          </h1>
        </div>

        {/* Jam dan tanggal real-time */}
        <div className="text-center mt-5">
          <h2 className="text-5xl font-bold text-gray-800">
            {formatTime(currentTime)}
          </h2>
          <p className="text-gray-800 font-semibold text-sm">
            {formatDate(currentTime)}
          </p>
        </div>

        {/* Kartu ringkasan kehadiran */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-5">
          {/* Total pegawai */}
          <div className="bg-gradient-to-br from-blue-400 to-blue-500 rounded-2xl p-6 shadow-lg text-white relative overflow-hidden">
            <div className="flex justify-between items-center">
              <div className="relative z-10">
                <p className="text-5xl font-bold mb-1">
                  {summary.totalPegawai}
                </p>
                <p className="text-sm font-semibold opacity-90">
                  Total Pegawai
                </p>
              </div>
              <div className="relative z-10">
                <UsersIcon className="w-14 h-14 opacity-90" />
              </div>
            </div>
          </div>

          {/* Total terlambat */}
          <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl p-6 shadow-lg text-white relative overflow-hidden">
            <div className="flex justify-between items-center">
              <div className="relative z-10">
                <p className="text-5xl font-bold mb-1">
                  {summary.totalTerlambat}
                </p>
                <p className="text-sm font-semibold opacity-90">
                  Total Terlambat
                </p>
              </div>
              <div className="relative z-10">
                <ClockIcon className="w-14 h-14 opacity-90" />
              </div>
            </div>
          </div>

          {/* Tanpa keterangan (alpa) */}
          <div className="bg-gradient-to-br from-red-400 to-red-500 rounded-2xl p-6 shadow-lg text-white relative overflow-hidden">
            <div className="flex justify-between items-center">
              <div className="relative z-10">
                <p className="text-5xl font-bold mb-1">{summary.totalAlpa}</p>
                <p className="text-sm font-semibold opacity-90">
                  Tanpa Keterangan
                </p>
              </div>
              <div className="relative z-10">
                <UserXIcon className="w-14 h-14 opacity-90" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabel Kehadiran Hari Ini */}
        <div>
          <div className="flex justify-between items-center mb-2 pt-5">
            <h3 className="text-base font-bold text-gray-800">
              Kehadiran Hari Ini
            </h3>
          </div>

          {/* Kolom pencarian dan filter unit */}
          <div className="flex flex-col md:flex-row gap-4 mb-4 text-sm">
            <div className="flex-1 relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <SearchIcon className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Cari nama pegawai..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none transition-colors"
              />
            </div>
            <div className="relative min-w-[200px]">
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="w-full px-4 py-3 text-gray-800 font-medium border-2 border-gray-200 rounded-xl focus:outline-none appearance-none bg-white cursor-pointer transition-colors"
              >
                {unitList.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <ChevronDownIcon />
              </div>
            </div>
          </div>

          {/* Tabel data kehadiran */}
          <div className="bg-white rounded shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <div className="max-h-[calc(100vh-450px)] overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 sticky top-0 z-10 shadow-sm h-12">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider min-w-[60px]">
                        No
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider min-w-[200px]">
                        Nama Pegawai
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider min-w-[150px]">
                        Unit
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider min-w-[120px]">
                        Jadwal Shift
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider min-w-[130px]">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider min-w-[100px]">
                        Jam Masuk
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider min-w-[100px]">
                        Jam Pulang
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider min-w-[80px]">
                        Foto
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider min-w-[150px]">
                        Lokasi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredData.length === 0 ? (
                      <tr>
                        <td
                          colSpan="9"
                          className="px-4 py-8 text-center text-gray-500 text-sm"
                        >
                          {loading ? (
                            <div className="flex justify-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-800"></div>
                            </div>
                          ) : (
                            <p>Tidak ada pegawai dengan jadwal hari ini</p>
                          )}
                        </td>
                      </tr>
                    ) : (
                      filteredData.map((item, index) => (
                        <tr
                          key={item.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3 text-xs text-gray-800">
                            {index + 1}.
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-800 font-medium">
                            {item.nama}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-600">
                            {item.unit}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-600">
                            <div>
                              <p className="font-medium">{item.waktuShift}</p>
                              {item.namaShift !== "-" && (
                                <p className="text-[10px] text-gray-500">
                                  {item.namaShift}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-1">
                            <span
                              className={`inline-flex px-3 py-1 rounded-full text-[10px] font-medium ${getStatusBadgeClass(item.statusType)}`}
                            >
                              {item.statusDisplay}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-600">
                            {item.jamMasuk}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-600">
                            {item.jamPulang}
                          </td>
                          <td className="px-4 py-1">
                            <button
                              onClick={() => handlePhotoClick(item)}
                              className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200 hover:border-[#0984E3] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0984E3] focus:ring-offset-2"
                            >
                              {renderPhoto(item)}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-600">
                            {item.lokasi}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal detail presensi pegawai */}
      {showModal && selectedEmployee && (
        <DetailPresensiModal
          data={selectedEmployee}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default Dashboard;
