import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import api from "../../services/api";

// import icon
import {
  BackIcon,
  SearchIcon,
  CheckIcon,
  WarningIcon,
  EmptyIcon,
  ArrowRightIcon,
} from "../../components/icons/SystemIcons";

const JadwalUnitList = () => {
  const navigate = useNavigate();
  const { year, month } = useParams();
  const location = useLocation();

  const periodeName =
    location.state?.periode ||
    `${location.state?.bulan ? ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"][location.state.bulan - 1] : ""} ${year}`;
  const currentYear = parseInt(year) || new Date().getFullYear();
  const currentMonth = parseInt(month) || new Date().getMonth() + 1;

  const [searchTerm, setSearchTerm] = useState("");
  const [unitData, setUnitData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch unit data dari API
  const fetchUnits = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(
        `/schedules/periods/${currentYear}/${currentMonth}/units`,
      );

      if (response.data.status === "success") {
        setUnitData(response.data.data);
      } else {
        setError(response.data.message || "Gagal mengambil data unit");
      }
    } catch (err) {
      console.error("Error fetch units:", err);
      setError(err.response?.data?.message || "Terjadi kesalahan koneksi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, [currentYear, currentMonth]);

  // Filter unit berdasarkan pencarian
  const filteredUnits = unitData.filter((unit) =>
    unit.namaUnit.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Handle klik card unit
  const handleUnitClick = (unit) => {
    navigate(
      `/admin/jadwal-unit/${currentYear}/${currentMonth}/units/${unit.id}/input`,
      {
        state: {
          periode: periodeName,
          namaUnit: unit.namaUnit,
          tahun: currentYear,
          bulan: currentMonth,
        },
      },
    );
  };

  // Handle kembali
  const handleBack = () => {
    navigate("/admin/jadwal-unit");
  };

  // UI: Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
        <span className="ml-2 text-gray-600">Memuat data...</span>
      </div>
    );
  }

  // UI: Error
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
        <p className="font-medium">⚠️ Gagal memuat data</p>
        <p className="text-sm mt-1">{error}</p>
        <button
          onClick={fetchUnits}
          className="mt-3 text-xs px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* breadcrumb */}
      <div className="bg-white rounded-lg p-3 shadow-sm text-xs">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-800"
        >
          <BackIcon />
          <span className="font-medium">Jadwal Unit</span>
          <span className="text-gray-800">›</span>
          <span className="font-medium">{periodeName}</span>
        </button>
      </div>

      {/* konten utama */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        {/* header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 border-b border-gray-200 pb-2">
            Unit Kerja
          </h1>
        </div>

        {/* search */}
        <div className="relative mb-5 text-sm">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <SearchIcon className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Cari nama unit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none transition-colors"
          />
        </div>

        {/* list unit cards */}
        <div className="space-y-3">
          {filteredUnits.map((unit) => {
            const hasPegawai = unit.totalPegawai > 0;
            const allCompleted =
              hasPegawai && unit.pegawaiSelesai === unit.totalPegawai;
            const hasProgress = unit.pegawaiSelesai > 0;

            return (
              <div
                key={unit.id}
                onClick={() => handleUnitClick(unit)}
                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all shadow-sm ${
                  !hasPegawai
                    ? "border-l-4 border-gray-300 bg-gray-50"
                    : allCompleted
                      ? "border-l-4 border-green-500"
                      : "border-l-4 border-orange-400"
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  {/* Icon Status */}
                  <div
                    className={`p-1 m-2 rounded-full ${
                      !hasPegawai
                        ? "border-2 border-gray-400 bg-gray-100"
                        : allCompleted
                          ? "border-2 border-green-500 bg-green-50"
                          : "border-2 border-orange-400 bg-orange-50"
                    }`}
                  >
                    {!hasPegawai ? (
                      <EmptyIcon className="w-5 h-5 text-gray-500" />
                    ) : allCompleted ? (
                      <CheckIcon className="w-5 h-5 text-green-600" />
                    ) : (
                      <WarningIcon className="w-5 h-5 text-orange-500" />
                    )}
                  </div>

                  {/* Unit Info */}
                  <div className="flex-1">
                    <h3 className="font-medium text-xs text-gray-800">
                      {unit.namaUnit}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {!hasPegawai ? (
                        <span className="text-gray-400 italic">
                          Tidak ada pegawai aktif
                        </span>
                      ) : (
                        <>
                          {unit.pegawaiSelesai}/{unit.totalPegawai} pegawai
                          selesai
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {/* Button Detail */}
                <div className="p-2 mr-2 bg-blue-500 rounded-full hover:bg-blue-600 transition-colors">
                  <ArrowRightIcon className="w-3 h-3 text-white" />
                </div>
              </div>
            );
          })}
        </div>

        {/* state jika data kosong */}
        {filteredUnits.length === 0 && (
          <div className="text-center py-5">
            <p className="text-gray-500 text-xs">
              {searchTerm
                ? "Tidak ada hasil pencarian"
                : "Data unit kerja tidak tersedia"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default JadwalUnitList;
