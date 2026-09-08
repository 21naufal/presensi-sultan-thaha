import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import ModalConfirm from "../../components/admin/ModalConfirm";
import api from "../../services/api";
import {
  SearchIcon,
  AddIcon,
  EditIcon,
  BackIcon,
  ChevronDownIcon,
} from "../../components/icons/SystemIcons";

const Pegawai = () => {
  const navigate = useNavigate();

  // State untuk pencarian, filter, data, loading, dan error
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("all");
  const [pegawaiData, setPegawaiData] = useState([]);
  const [unitList, setUnitList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Ambil daftar unit kerja untuk kebutuhan filter
  const fetchUnits = async () => {
    try {
      const response = await api.get("/employees/units-list");
      if (response.data.status === "success") {
        setUnitList([
          { id: "all", namaUnit: "Semua Unit" },
          ...response.data.data,
        ]);
      }
    } catch (err) {
      console.error("Error fetch units:", err);
    }
  };

  // Ambil data pegawai dari API (mendukung pencarian dan filter)
  const fetchPegawai = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (selectedUnit !== "all") params.append("unit_id", selectedUnit);

      const response = await api.get(`/employees?${params.toString()}`);

      if (response.data.status === "success") {
        setPegawaiData(response.data.data);
      } else {
        setError(response.data.message || "Gagal mengambil data");
      }
    } catch (err) {
      console.error("Error fetch pegawai:", err);
      setError(err.response?.data?.message || "Terjadi kesalahan koneksi");
    } finally {
      setLoading(false);
    }
  };

  // Muat daftar unit sekali saat halaman dibuka
  useEffect(() => {
    fetchUnits();
  }, []);

  // Muat ulang data pegawai setiap kali filter unit berubah
  useEffect(() => {
    fetchPegawai();
  }, [selectedUnit]);

  // Filter pencarian berdasarkan nama atau nomor HP (client-side)
  const filteredData = pegawaiData.filter(
    (pegawai) =>
      pegawai.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pegawai.noHp?.includes(searchQuery),
  );

  // Navigasi ke halaman edit pegawai
  const handleEdit = (id) => {
    navigate(`/admin/pegawai/edit/${id}`);
  };

  // Nonaktifkan akun pegawai
  const handleDeactivate = async (id, nama) => {
    if (
      !window.confirm(
        `Nonaktifkan akun ${nama}? Pegawai tidak bisa login lagi.`,
      )
    )
      return;

    try {
      const response = await api.delete(`/employees/${id}`);
      if (response.data.status === "success") {
        // Perbarui status pegawai menjadi Nonaktif di state lokal
        setPegawaiData((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: "Nonaktif" } : p)),
        );
        toast.success("Pegawai berhasil dinonaktifkan");
      }
    } catch (err) {
      console.error("Error deactivate:", err);
      toast.error(err.response?.data?.message || "Gagal menonaktifkan");
    }
  };

  // Navigasi ke halaman tambah pegawai
  const handleTambah = () => {
    navigate("/admin/pegawai/tambah");
  };

  // Tampilan saat data sedang dimuat
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
        <span className="ml-2 text-gray-600">Memuat data...</span>
      </div>
    );
  }

  // Tampilan jika gagal memuat data
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
        <p className="font-medium">Gagal memuat data</p>
        <p className="text-sm mt-1">{error}</p>
        <button
          onClick={fetchPegawai}
          className="mt-3 text-xs px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Breadcrumb navigasi */}
      <div className="bg-white rounded-lg p-3 shadow-sm text-xs">
        <button className="flex items-center gap-2 text-gray-800">
          <BackIcon />
          <span className="font-medium">Pegawai</span>
        </button>
      </div>

      {/* Konten utama halaman */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        {/* Header halaman */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800 border-b border-gray-200 pb-2">
            Pegawai
          </h1>
        </div>

        {/* Kolom pencarian, filter unit, dan tombol tambah data */}
        <div className="flex flex-col md:flex-row gap-4 mb-4 mt-5 text-sm">
          {/* Input pencarian */}
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

          {/* Dropdown filter berdasarkan unit kerja */}
          <div className="relative min-w-[200px]">
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="w-full px-4 py-3 text-gray-800 font-medium border-2 border-gray-200 rounded-xl focus:outline-none appearance-none bg-white cursor-pointer transition-colors"
            >
              {unitList.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.namaUnit}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <ChevronDownIcon />
            </div>
          </div>

          {/* Tombol tambah pegawai */}
          <button
            onClick={handleTambah}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-[#0984E3] text-white rounded-xl transition-colors shadow-lg"
          >
            <AddIcon />
            Tambah Pegawai
          </button>
        </div>

        {/* Tabel daftar pegawai */}
        <div className="bg-white rounded shadow-lg overflow-hidden">
          <div className="max-h-[600px] overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-100 sticky top-0 z-10 shadow-sm h-12">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-16">
                    No
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Nama Pegawai
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Jenis Kelamin
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    No. HP
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Unit
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredData.map((pegawai, index) => (
                  <tr
                    key={pegawai.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-left text-xs text-gray-800">
                      {index + 1}.
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-800 font-medium">
                      {pegawai.nama}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 text-center">
                      {pegawai.jenisKelamin === "L" ? "Laki-laki" : "Perempuan"}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 text-left">
                      {pegawai.noHp}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 text-left">
                      {pegawai.unitName}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          pegawai.status === "aktif"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {pegawai.status === "aktif" ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center justify-center gap-1">
                        {/* Tombol edit */}
                        <button
                          onClick={() => handleEdit(pegawai.id)}
                          className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <EditIcon className="w-5 h-5 text-[#0984E3]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tampilan jika hasil pencarian atau data kosong */}
        {pegawaiData.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-500 text-xs">
              {searchQuery || selectedUnit !== "all"
                ? "Tidak ada hasil pencarian"
                : "Data pegawai tidak tersedia"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Pegawai;
