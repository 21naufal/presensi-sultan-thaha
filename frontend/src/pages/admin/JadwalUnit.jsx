import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import ModalPeriode from "../../components/admin/ModalPeriode";
import api from "../../services/api";
import {
  BackIcon,
  AddIcon,
  EditIcon,
  ArrowRightIcon,
} from "../../components/icons/SystemIcons";

// Daftar nama bulan dalam bahasa Indonesia
const MONTH_NAMES = [
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

const JadwalUnit = () => {
  const navigate = useNavigate();

  // State untuk data periode, loading, error, dan kontrol modal
  const [periodeData, setPeriodeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState(null);

  // Ambil data periode dari API
  const fetchPeriods = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/schedules/periods");

      if (response.data.status === "success") {
        const formatted = response.data.data.map((p) => ({
          id: p.id,
          periode: p.periode,
          tahun: p.tahun,
          bulan: p.bulan,
          status: p.status,
          totalUnits: p.totalUnits,
          completedUnits: p.completedUnits,
          terakhirDiubah: p.terakhirDiubah,
        }));
        setPeriodeData(formatted);
      } else {
        setError(response.data.message || "Gagal mengambil data periode");
      }
    } catch (err) {
      console.error("Error fetch periods:", err);
      setError(err.response?.data?.message || "Terjadi kesalahan koneksi");
    } finally {
      setLoading(false);
    }
  };

  // Handle submit form (tambah, edit, atau rename periode)
  const handleSubmit = async (formData) => {
    try {
      let response;

      if (editingPeriod) {
        const isRename =
          formData.tahun !== editingPeriod.tahun ||
          formData.bulan !== editingPeriod.bulan;

        if (isRename) {
          // RENAME: Ubah periode ke tahun/bulan baru
          response = await api.put(
            `/schedules/periods/${editingPeriod.tahun}/${editingPeriod.bulan}/rename`,
            {
              newYear: formData.tahun,
              newMonth: formData.bulan,
            },
          );

          if (response.data.status === "success") {
            toast.success(
              `Periode berhasil diubah dari ${MONTH_NAMES[editingPeriod.bulan - 1]} ${editingPeriod.tahun} menjadi ${MONTH_NAMES[formData.bulan - 1]} ${formData.tahun}!`,
            );
          }
        } else {
          // REGENERATE: Tambah placeholder untuk pegawai baru
          response = await api.put(
            `/schedules/periods/${editingPeriod.tahun}/${editingPeriod.bulan}`,
          );

          if (response.data.status === "success") {
            const addedCount = response.data.data?.addedCount || 0;
            toast.success(
              addedCount > 0
                ? `Berhasil menambah jadwal placeholder untuk ${addedCount} pegawai baru di periode ${MONTH_NAMES[formData.bulan - 1]} ${formData.tahun}!`
                : `Tidak ada pegawai baru yang perlu ditambahkan di periode ${MONTH_NAMES[formData.bulan - 1]} ${formData.tahun}.`,
            );
          }
        }
      } else {
        // MODE TAMBAH: Buat periode baru
        response = await api.post("/schedules/periods", {
          tahun: formData.tahun,
          bulan: formData.bulan,
        });

        if (response.data.status === "success") {
          toast.success(
            `Periode ${MONTH_NAMES[formData.bulan - 1]} ${formData.tahun} berhasil dibuat!`,
          );
        }
      }

      // Refresh daftar periode
      fetchPeriods();
      setIsModalOpen(false);
      setEditingPeriod(null);
    } catch (err) {
      console.error("Error submit period:", err);
      const errorMsg = err.response?.data?.message || "Gagal memproses periode";

      // Tampilkan pesan error yang informatif
      if (errorMsg.includes("sudah ada")) {
        toast.error(errorMsg);
      } else if (errorMsg.includes("sudah memiliki jadwal terisi")) {
        toast.error(
          "Tidak dapat mengubah periode yang sudah memiliki jadwal terisi. Hapus jadwal terlebih dahulu jika ingin mengubah periode.",
        );
      } else {
        toast.error(errorMsg);
      }
    }
  };

  // Navigasi ke halaman detail list unit untuk periode tertentu
  const handleDetail = (periode) => {
    navigate(`/admin/jadwal-unit/${periode.tahun}/${periode.bulan}/units`, {
      state: {
        periode: periode.periode,
        tahun: periode.tahun,
        bulan: periode.bulan,
      },
    });
  };

  // Buka modal edit periode
  const handleEdit = (periode) => {
    setEditingPeriod(periode);
    setIsModalOpen(true);
  };

  // Buka modal tambah periode
  const handleTambah = () => {
    setEditingPeriod(null);
    setIsModalOpen(true);
  };

  // Muat data saat komponen pertama kali dirender
  useEffect(() => {
    fetchPeriods();
  }, []);

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
          onClick={fetchPeriods}
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
          <span className="font-medium">Periode Jadwal</span>
        </button>
      </div>

      {/* Konten utama halaman */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        {/* Header halaman */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800 border-b border-gray-200 pb-2">
            Periode Jadwal
          </h1>
        </div>

        {/* Tombol tambah periode */}
        <div className="flex justify-end mb-6 mt-5 text-sm">
          <button
            onClick={handleTambah}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-[#0984E3] text-white rounded-xl shadow-lg"
          >
            <AddIcon />
            Tambah Periode
          </button>
        </div>

        {/* Tabel daftar periode */}
        <div className="bg-white rounded shadow-lg overflow-hidden">
          <div className="max-h-[600px] overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-100 sticky top-0 z-10 shadow-sm h-12">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Periode
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Unit Selesai
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Terakhir Diubah
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">
                    Kelola
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {periodeData.map((periode) => {
                  const isAllCompleted =
                    periode.completedUnits === periode.totalUnits;

                  return (
                    <tr
                      key={periode.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-xs text-gray-800">
                        {periode.periode}
                      </td>

                      <td className="px-4 py-3 text-xs text-gray-800 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            periode.status === "Aktif"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {periode.status}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-xs text-gray-800 text-center">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            isAllCompleted
                              ? "bg-green-100 text-green-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {periode.completedUnits}/{periode.totalUnits}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-xs text-gray-800">
                        {periode.terakhirDiubah}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          {/* Tombol edit periode */}
                          <button
                            onClick={() => handleEdit(periode)}
                            className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                            title={
                              periode.completedUnits > 0
                                ? "Regenerate jadwal untuk pegawai baru"
                                : "Edit Periode"
                            }
                          >
                            <EditIcon />
                          </button>
                          {/* Tombol detail periode */}
                          <button
                            onClick={() => handleDetail(periode)}
                            className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Detail"
                          >
                            <ArrowRightIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tampilan jika data periode kosong */}
        {periodeData.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-500 text-xs">
              Data periode jadwal tidak tersedia
              <br />
              Silahkan klik tombol "Tambah Periode" untuk membuat periode jadwal
              baru
            </p>
          </div>
        )}
      </div>

      {/* Modal untuk tambah atau edit periode */}
      <ModalPeriode
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPeriod(null);
        }}
        onSubmit={handleSubmit}
        editData={editingPeriod}
        existingPeriods={periodeData}
      />
    </div>
  );
};

export default JadwalUnit;
