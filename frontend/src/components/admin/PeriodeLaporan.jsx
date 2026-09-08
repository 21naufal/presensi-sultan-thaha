import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../services/api";

// import icon
import {
  BackIcon,
  SearchIcon,
  CalendarIcon,
  ArrowRightIcon,
} from "../../components/icons/SystemIcons";

const PeriodeLaporan = () => {
  const navigate = useNavigate();
  const [periods, setPeriods] = useState([]);
  const [filteredPeriods, setFilteredPeriods] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch data periode dari API
  useEffect(() => {
    fetchPeriods();
  }, []);

  // Filter saat search berubah
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredPeriods(periods);
    } else {
      const filtered = periods.filter((period) =>
        period.periode.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      setFilteredPeriods(filtered);
    }
  }, [searchTerm, periods]);

  const fetchPeriods = async () => {
    try {
      setLoading(true);
      const response = await api.get("/schedules/periods");
      if (response.data.status === "success") {
        setPeriods(response.data.data);
        setFilteredPeriods(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching periods:", err);
      toast.error("Gagal memuat data periode");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* breadcrumb */}
      <div className="bg-white rounded-lg p-3 shadow-sm text-xs">
        <button
          onClick={() => navigate("/admin/rekap-laporan")}
          className="flex items-center gap-2 text-gray-800"
        >
          <BackIcon />
          <span className="font-medium">Rekap Presensi</span>
        </button>
      </div>

      {/* konten utama */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        {/* header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800 border-b border-gray-200 pb-2">
            Periode Laporan
          </h1>
        </div>

        {/* search */}
        <div className="mt-5 mb-4 text-sm">
          <div className="relative max-w-xs">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <SearchIcon className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Cari periode laporan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* list periode */}
        <div className="space-y-2 text-xs">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0984E3]"></div>
            </div>
          ) : filteredPeriods.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Tidak ada data periode
            </div>
          ) : (
            filteredPeriods.map((period) => (
              <button
                key={period.id}
                onClick={() =>
                  navigate(
                    `/admin/rekap-laporan/${period.tahun}/${period.bulan}/units`,
                    { state: { periode: period.periode } },
                  )
                }
                className="w-full flex items-center justify-between p-4 border border-gray-200 border-l-[5px] border-l-[#0984E3] rounded-xl group shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <CalendarIcon className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-600 font-medium">
                    {period.periode}
                  </span>
                </div>
                {/* Button Detail */}
                <div className="p-2 mr-2 bg-blue-500 rounded-full hover:bg-blue-600 transition-colors">
                  <ArrowRightIcon className="w-3 h-3 text-white" />
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PeriodeLaporan;
