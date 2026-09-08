import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../services/api";

// import icon
import {
  BackIcon,
  SearchIcon,
  BuildingIcon,
  ArrowRightIcon,
} from "../../components/icons/SystemIcons";

const UnitKerjaLaporan = () => {
  const navigate = useNavigate();
  const { year, month } = useParams();
  const location = useLocation();
  const periodeName = location.state?.periode || "Periode";

  const [units, setUnits] = useState([]);
  const [filteredUnits, setFilteredUnits] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch data unit untuk periode yang dipilih
  useEffect(() => {
    fetchUnits();
  }, [year, month]);

  // Filter saat search berubah
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredUnits(units);
    } else {
      const filtered = units.filter((unit) =>
        unit.namaUnit.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      setFilteredUnits(filtered);
    }
  }, [searchTerm, units]);

  const fetchUnits = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/schedules/periods/${year}/${month}/units`,
      );
      if (response.data.status === "success") {
        setUnits(response.data.data);
        setFilteredUnits(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching units:", err);
      toast.error("Gagal memuat data unit");
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
          <span>›</span>
          <span className="font-medium">{periodeName}</span>
        </button>
      </div>

      {/* konten utama */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        {/* header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800 border-b border-gray-200 pb-2">
            Unit Kerja
          </h1>
        </div>

        {/* search */}
        <div className="mt-5 mb-4">
          <div className="relative max-w-xs">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <SearchIcon className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Cari laporan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* list unit */}
        <div className="space-y-2 text-xs">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
            </div>
          ) : filteredUnits.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Tidak ada data unit kerja
            </div>
          ) : (
            filteredUnits.map((unit) => (
              <button
                key={unit.id}
                onClick={() =>
                  navigate(
                    `/admin/rekap-laporan/${year}/${month}/units/${unit.id}`,
                    {
                      state: {
                        periode: periodeName,
                        namaUnit: unit.namaUnit,
                      },
                    },
                  )
                }
                className="w-full flex items-center justify-between p-4 border border-gray-200 border-l-[5px] border-l-[#0984E3] rounded-xl group shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <BuildingIcon className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-600 font-medium">
                    {unit.namaUnit}
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

export default UnitKerjaLaporan;
