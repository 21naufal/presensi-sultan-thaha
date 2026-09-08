import { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import api from "../../services/api";
import RiwayatPerubahanModal from "../../components/admin/RiwayatPerubahanModal";

// import icon
import { BackIcon, EditIcon } from "../../components/icons/SystemIcons";

const getDaysInMonth = (year, month) => new Date(year, month, 0).getDate();
const getMonthName = (month) =>
  [
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
  ][month - 1];

const JadwalKaryawanDetail = () => {
  const navigate = useNavigate();
  const { year, month, unitId, pegawaiId } = useParams();
  const location = useLocation();

  const periodeName = location.state?.periode || "Periode";
  const unitName = location.state?.namaUnit || `Unit ${unitId}`;
  const pegawai = location.state?.pegawai;
  const currentYear = location.state?.year || new Date().getFullYear();
  const currentMonth = location.state?.month || new Date().getMonth() + 1;

  const [jadwalData, setJadwalData] = useState({});
  const [loading, setLoading] = useState(true);

  // State untuk modal riwayat
  const [showRiwayatModal, setShowRiwayatModal] = useState(false);
  const [selectedJadwalId, setSelectedJadwalId] = useState(null);

  useEffect(() => {
    const fetchJadwal = async () => {
      try {
        setLoading(true);

        const response = await api.get(
          `/schedules/pegawai/${pegawaiId}/${currentYear}/${currentMonth}`,
        );

        if (response.data.status === "success") {
          const formatted = {};

          response.data.data.jadwal.forEach((item) => {
            const day = new Date(item.tanggal).getDate();

            let shiftCode = item.shift;
            let shiftNama = item.shiftNama;

            if (item.shift === "-") {
              switch (item.status) {
                case "libur":
                  shiftCode = "L";
                  shiftNama = "Libur";
                  break;
                case "izin":
                  shiftCode = "I";
                  shiftNama = "Izin";
                  break;
                case "cuti":
                  shiftCode = "C";
                  shiftNama = "Cuti";
                  break;
                default:
                  break;
              }
            }

            formatted[day] = {
              shiftCode,
              shiftNama,
              jamMulai: item.jamMulai,
              jamSelesai: item.jamSelesai,
              status: item.status,
              jadwalId: item.jadwalId,
              sudahDiedit: item.sudahDiedit,
            };
          });

          setJadwalData(formatted);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchJadwal();
  }, [pegawaiId, currentYear, currentMonth]);

  const jadwal = useMemo(() => {
    const totalDays = getDaysInMonth(currentYear, currentMonth);
    return Array.from({ length: totalDays }, (_, i) => {
      const day = i + 1;
      const data = jadwalData[day];

      const shiftCode = data?.shiftCode || "-";
      const shiftNama = data?.shiftNama || shiftCode;

      return {
        tanggal: `${day} ${getMonthName(currentMonth)} ${currentYear}`,
        shift: shiftNama,
        jamKerja:
          data?.jamMulai && data?.jamSelesai
            ? `${data.jamMulai} - ${data.jamSelesai}`
            : "-",
        status: data?.status,
        jadwalId: data?.jadwalId,
        sudahDiedit: data?.sudahDiedit,
      };
    });
  }, [jadwalData, currentMonth, currentYear]);

  const totalHariKerja = jadwal.filter((x) => x.status === "shift").length;
  const totalLibur = jadwal.filter((x) => x.status === "libur").length;
  const totalCuti = jadwal.filter((x) => x.status === "cuti").length;
  const totalIzin = jadwal.filter((x) => x.status === "izin").length;

  const detailData = {
    nama: pegawai?.nama || `Pegawai ${pegawaiId}`,
    unit: unitName,
    totalHariKerja,
    totalLibur,
    totalCuti,
    totalIzin,
    jadwal,
  };

  // Handler untuk buka modal riwayat
  const handleOpenRiwayat = (jadwalId) => {
    setSelectedJadwalId(jadwalId);
    setShowRiwayatModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
        <span className="ml-2 text-gray-600">Memuat data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* breadcrumb */}
      <div className="bg-white rounded-lg p-3 shadow-sm text-xs">
        <button
          onClick={() =>
            navigate(
              `/admin/jadwal-unit/${currentYear}/${currentMonth}/units/${unitId}/input`,
              {
                state: {
                  periode: periodeName,
                  namaUnit: unitName,
                },
              },
            )
          }
          className="flex items-center gap-2 text-gray-800"
        >
          <BackIcon />
          <span className="font-medium">Jadwal Unit</span>
          <span>›</span>
          <span className="font-medium">{periodeName}</span>
          <span>›</span>
          <span className="font-medium">{unitName}</span>
          <span>›</span>
          <span className="font-medium">{detailData.nama}</span>
        </button>
      </div>

      {/* konten utama */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        {/* header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800 border-b border-gray-200 pb-2">
            Detail Jadwal Pegawai
          </h1>
        </div>

        {/* info Karyawan */}
        <div className="mb-6 mt-5 p-1 text-xs text-gray-800">
          <div className="grid grid-cols-[150px_10px_1fr]">
            <span className="font-medium">Nama</span>
            <span>:</span>
            <span className="font-semibold">{detailData.nama}</span>
          </div>
          <div className="grid grid-cols-[150px_10px_1fr]">
            <span className="font-medium">Unit</span>
            <span>:</span>
            <span className="font-semibold">{detailData.unit}</span>
          </div>
          <div className="grid grid-cols-[150px_10px_1fr]">
            <span className="font-medium">Total Hari Kerja</span>
            <span>:</span>
            <span className="font-semibold">
              {detailData.totalHariKerja} Hari
            </span>
          </div>
          <div className="grid grid-cols-[150px_10px_1fr]">
            <span className="font-medium">Total Libur</span>
            <span>:</span>
            <span className="font-semibold">{detailData.totalLibur} Hari</span>
          </div>
          <div className="grid grid-cols-[150px_10px_1fr]">
            <span className="font-medium">Total Cuti</span>
            <span>:</span>
            <span className="font-semibold">{detailData.totalCuti} Hari</span>
          </div>
          <div className="grid grid-cols-[150px_10px_1fr]">
            <span className="font-medium">Total Izin</span>
            <span>:</span>
            <span className="font-semibold">{detailData.totalIzin} Hari</span>
          </div>
        </div>

        {/* tabel */}
        <div className="bg-white rounded shadow-lg overflow-hidden">
          <div className="max-h-[600px] overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-100 sticky top-0 z-10 shadow-sm h-12">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">
                    Tanggal
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-800 uppercase tracking-wider">
                    Jadwal Shift
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-800 uppercase tracking-wider">
                    Jam Kerja
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {detailData.jadwal.map((item, index) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-left text-xs text-gray-800">
                      {item.tanggal}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-xs text-gray-800">
                          {item.shift}
                        </span>
                        {/* Tampilkan icon edit jika sudah pernah diedit */}
                        {item.sudahDiedit && item.jadwalId && (
                          <button
                            onClick={() => handleOpenRiwayat(item.jadwalId)}
                            title="Lihat Riwayat Perubahan"
                          >
                            <EditIcon className="w-4 h-4 text-[#0984E3] cursor-pointer hover:scale-110 transition-transform" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-800 text-center">
                      {item.jamKerja}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Riwayat Perubahan */}
      <RiwayatPerubahanModal
        open={showRiwayatModal}
        onClose={() => setShowRiwayatModal(false)}
        jadwalId={selectedJadwalId}
      />
    </div>
  );
};

export default JadwalKaryawanDetail;
