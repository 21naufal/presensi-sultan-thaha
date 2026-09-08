import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import ModalConfirm from "../../components/admin/ModalConfirm";
import api from "../../services/api";
import {
  SearchIcon,
  AddIcon,
  EditIcon,
  DeleteIcon,
  BackIcon,
} from "../../components/icons/SystemIcons";

const UnitKerja = () => {
  const navigate = useNavigate();

  // State untuk pencarian, data, loading, dan error
  const [searchQuery, setSearchQuery] = useState("");
  const [unitData, setUnitData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State untuk kontrol modal konfirmasi hapus
  const [deleteId, setDeleteId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Ambil daftar unit kerja dari API
  const fetchUnits = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/units");

      if (response.data.status === "success") {
        setUnitData(response.data.data);
      } else {
        setError(response.data.message || "Gagal mengambil data");
      }
    } catch (err) {
      console.error("Error fetch units:", err);
      setError(err.response?.data?.message || "Terjadi kesalahan koneksi");
    } finally {
      setLoading(false);
    }
  };

  // Muat data saat komponen pertama kali dirender
  useEffect(() => {
    fetchUnits();
  }, []);

  // Filter data unit kerja berdasarkan input pencarian (nama atau lokasi)
  const filteredData = unitData.filter(
    (unit) =>
      unit.namaUnit?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      unit.lokasiUnit?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Navigasi ke halaman edit unit kerja
  const handleEdit = (id) => {
    navigate(`/admin/unit-kerja/edit/${id}`);
  };

  // Buka modal konfirmasi sebelum menghapus data
  const handleDelete = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  // Eksekusi penghapusan data ke API dan perbarui state lokal
  const confirmDelete = async () => {
    try {
      const response = await api.delete(`/units/${deleteId}`);

      if (response.data.status === "success") {
        // Perbarui state lokal agar data yang dihapus langsung hilang dari tabel
        setUnitData((prev) => prev.filter((unit) => unit.id !== deleteId));
        toast.success("Unit berhasil dihapus");
      }
    } catch (err) {
      console.error("Error delete unit:", err);
      toast.error(err.response?.data?.message || "Gagal menghapus unit");
    } finally {
      setShowDeleteModal(false);
      setDeleteId(null);
    }
  };

  // Navigasi ke halaman tambah unit kerja
  const handleTambah = () => {
    navigate("/admin/unit-kerja/tambah");
  };

  // Tampilkan UI loading saat data sedang diambil
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
        <span className="ml-2 text-gray-600">Memuat data...</span>
      </div>
    );
  }

  // Tampilkan UI error jika pengambilan data gagal
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
        <p className="font-medium">Gagal memuat data</p>
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
      {/* Breadcrumb navigasi */}
      <div className="bg-white rounded-lg p-3 shadow-sm text-xs">
        <button className="flex items-center gap-2 text-gray-800">
          <BackIcon />
          <span className="font-medium">Unit Kerja</span>
        </button>
      </div>

      {/* Konten utama halaman */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        {/* Header halaman */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800 border-b border-gray-200 pb-2">
            Unit Kerja
          </h1>
        </div>

        {/* Kolom pencarian dan tombol tambah data */}
        <div className="flex flex-col md:flex-row gap-4 mb-4 text-sm mt-5">
          {/* Input pencarian */}
          <div className="flex-1 relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <SearchIcon className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Cari unit kerja..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none transition-colors"
            />
          </div>

          {/* Tombol tambah unit kerja */}
          <button
            onClick={handleTambah}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-[#0984E3] text-white rounded-xl shadow-lg"
          >
            <AddIcon />
            Tambah Unit Kerja
          </button>
        </div>

        {/* Tabel daftar unit kerja */}
        <div className="bg-white rounded shadow-lg overflow-hidden">
          <div className="max-h-[600px] overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-100 sticky top-0 z-10 shadow-sm h-12">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-16">
                    No
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Nama Unit
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Lokasi Presensi Unit
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredData.map((unit, index) => (
                  <tr
                    key={unit.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-xs text-gray-800">
                      {index + 1}.
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-800">
                      {unit.namaUnit}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {unit.lokasiUnit}
                    </td>
                    <td className="py-3">
                      <div className="gap-2">
                        {/* Tombol edit */}
                        <button
                          onClick={() => handleEdit(unit.id)}
                          className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <EditIcon className="w-5 h-5 text-[#0984E3]" />
                        </button>
                        {/* Tombol hapus */}
                        <button
                          onClick={() => handleDelete(unit.id)}
                          className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <DeleteIcon className="w-5 h-5 text-red-500" />
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
        {filteredData.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-500 text-xs">
              Data unit kerja tidak tersedia
            </p>
          </div>
        )}
      </div>

      {/* Modal konfirmasi penghapusan data */}
      <ModalConfirm
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Hapus Unit Kerja?"
        message="Data yang dihapus tidak dapat dikembalikan!"
        type="delete"
        confirmText="Ya, Hapus"
        cancelText="Batal"
      />
    </div>
  );
};

export default UnitKerja;
