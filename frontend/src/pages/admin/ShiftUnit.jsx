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
  ChevronDownIcon,
} from "../../components/icons/SystemIcons";

const ShiftUnit = () => {
  const navigate = useNavigate();

  // State untuk pencarian, filter, data, loading, dan error
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("all");
  const [shiftData, setShiftData] = useState([]);
  const [unitList, setUnitList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State untuk kontrol modal konfirmasi hapus
  const [deleteId, setDeleteId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Ambil daftar unit kerja untuk kebutuhan filter dropdown
  const fetchUnits = async () => {
    try {
      const response = await api.get("/units");
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

  // Ambil data shift unit dari API (mendukung filter berdasarkan unit)
  const fetchShiftUnits = async () => {
    try {
      setLoading(true);
      setError(null);

      // Jika filter unit dipilih, tambahkan query param ke URL
      const url =
        selectedUnit !== "all"
          ? `/shift-units?unit_id=${selectedUnit}`
          : "/shift-units";

      const response = await api.get(url);

      if (response.data.status === "success") {
        setShiftData(response.data.data);
      } else {
        setError(response.data.message || "Gagal mengambil data");
      }
    } catch (err) {
      console.error("Error fetch shift units:", err);
      setError(err.response?.data?.message || "Terjadi kesalahan koneksi");
    } finally {
      setLoading(false);
    }
  };

  // Muat daftar unit sekali saat halaman dibuka
  useEffect(() => {
    fetchUnits();
  }, []);

  // Muat ulang data shift setiap kali filter unit berubah
  useEffect(() => {
    fetchShiftUnits();
  }, [selectedUnit]);

  // Filter pencarian berdasarkan nama atau kode shift (client-side)
  const filteredData = shiftData.filter(
    (shift) =>
      shift.namaShift?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shift.kodeShift?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Navigasi ke halaman edit shift unit
  const handleEdit = (id) => {
    navigate(`/admin/shift-unit/edit/${id}`);
  };

  // Buka modal konfirmasi sebelum menghapus data
  const handleDelete = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  // Eksekusi penghapusan relasi shift dan unit ke API
  const confirmDelete = async () => {
    try {
      // Cari data yang akan dihapus untuk mendapatkan shiftId dan unitId
      const item = shiftData.find((s) => s.id === deleteId);
      if (!item) return;

      // Kirim request DELETE ke API
      const response = await api.delete(
        `/shift-units/${item.shiftId}/${item.unitId}`,
      );

      if (response.data.status === "success") {
        // Perbarui state lokal agar data langsung hilang dari tabel
        setShiftData((prev) => prev.filter((s) => s.id !== deleteId));
        toast.success("Shift berhasil dipisahkan dari unit");
      }
    } catch (err) {
      console.error("Error delete shift unit:", err);
      toast.error(err.response?.data?.message || "Gagal menghapus");
    } finally {
      setShowDeleteModal(false);
      setDeleteId(null);
    }
  };

  // Navigasi ke halaman tambah shift unit
  const handleTambah = () => {
    navigate("/admin/shift-unit/tambah");
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
          onClick={fetchShiftUnits}
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
          <span className="font-medium">Shift Unit</span>
        </button>
      </div>

      {/* Konten utama halaman */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        {/* Header halaman */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800 border-b border-gray-200 pb-2">
            Shift Unit
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
              placeholder="Cari nama shift..."
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

          {/* Tombol tambah shift unit */}
          <button
            onClick={handleTambah}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-[#0984E3] text-white rounded-xl shadow-lg"
          >
            <AddIcon />
            Tambah Shift Unit
          </button>
        </div>

        {/* Tabel daftar shift unit */}
        <div className="bg-white rounded shadow-lg overflow-hidden">
          <div className="max-h-[600px] overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-100 sticky top-0 z-10 shadow-sm h-12">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-16">
                    No
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Nama Shift
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Kode Shift
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Unit
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Jam Mulai
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Jam Selesai
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Durasi
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredData.map((shift, index) => (
                  <tr
                    key={shift.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-left text-xs text-gray-800">
                      {index + 1}.
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-800 text-left">
                      {shift.namaShift}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 text-left">
                      {shift.kodeShift}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 text-left">
                      {shift.unitName}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 text-center">
                      {shift.jamMulai}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 text-center">
                      {shift.jamSelesai}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 text-center">
                      {shift.durasiFormatted}
                    </td>
                    <td className="py-3">
                      <div className="gap-2">
                        {/* Tombol edit */}
                        <button
                          onClick={() => handleEdit(shift.id)}
                          className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <EditIcon className="w-5 h-5 text-[#0984E3]" />
                        </button>
                        {/* Tombol hapus */}
                        <button
                          onClick={() => handleDelete(shift.id)}
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
              Data shift unit tidak tersedia
            </p>
          </div>
        )}
      </div>

      {/* Modal konfirmasi penghapusan data */}
      <ModalConfirm
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Hapus Shift Unit?"
        message="Relasi shift dengan unit ini akan dihapus. Data shift master tetap ada."
        type="delete"
        confirmText="Ya, Hapus"
        cancelText="Batal"
      />
    </div>
  );
};

export default ShiftUnit;
