import { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../services/api";
import KoreksiDetailModal from "../../components/admin/KoreksiDetailModal";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// import icon dari components (reusable, tidak dibuat ulang)
import {
  BackIcon,
  EditIcon,
  DownloadIcon,
} from "../../components/icons/SystemIcons";

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

// Helper: Format keterangan menjadi teks lengkap
const formatKeteranganText = (item) => {
  if (item.keterangan === "!") return "(!) Melebihi jam kerja";
  if (item.keterangan === "+") return "(+) Lembur";
  if (item.keterangan === "-") return "(-) Tidak absen pulang";

  const isHadirTerlambat =
    item.status === "Hadir" || item.status === "Terlambat";

  if (isHadirTerlambat) {
    if (item.isOvertime) return "(+) Lembur";
    if (item.noCheckout) return "(-) Tidak absen pulang";
    if (item.isLate) return "(!) Melebihi jam kerja";
  }

  return "-";
};

// Helper: Mendapatkan kategori keterangan untuk perhitungan summary
const getKeteranganKategori = (item) => {
  // Prioritas: simbol dari database
  if (item.keterangan === "!") return "melebihi_jam";
  if (item.keterangan === "+") return "lembur";
  if (item.keterangan === "-") return "tidak_pulang";

  // Flag boolean (hanya untuk Hadir/Terlambat)
  const isHadirTerlambat =
    item.status === "Hadir" || item.status === "Terlambat";
  if (isHadirTerlambat) {
    if (item.isOvertime) return "lembur";
    if (item.noCheckout) return "tidak_pulang";
    if (item.isLate) return "melebihi_jam";
    return "normal";
  }

  return "lainnya";
};

const getStatusBadgeStyle = (status) => {
  switch (status) {
    case "Hadir":
      return "bg-green-50 text-green-800 border border-green-200";
    case "Terlambat":
      return "bg-yellow-100 text-yellow-800 border border-yellow-200";
    case "Alpha":
      return "bg-red-100 text-red-800 border border-red-200";
    case "Izin":
      return "bg-blue-100 text-blue-800 border border-blue-200";
    case "Libur":
      return "bg-gray-200 text-gray-800 border border-gray-300";
    case "Cuti":
      return "bg-emerald-100 text-emerald-800 border border-emerald-200";
    default:
      return "bg-gray-50 text-gray-800 border border-gray-200";
  }
};

const DetailPresensiKaryawan = () => {
  const navigate = useNavigate();
  const { year, month, unitId, pegawaiId } = useParams();
  const location = useLocation();

  const periodeName = location.state?.periode || "Periode";
  const unitName = location.state?.namaUnit || `Unit ${unitId}`;
  const pegawai = location.state?.pegawai;

  const currentYear = parseInt(year);
  const currentMonth = parseInt(month);
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);

  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [selectedJadwalId, setSelectedJadwalId] = useState(null);

  useEffect(() => {
    fetchAttendanceDetail();
  }, [pegawaiId, currentYear, currentMonth]);

  const fetchAttendanceDetail = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/admin/presensi/detail/admin/${pegawaiId}/${currentYear}/${currentMonth}`,
      );

      if (response.data.status === "success") {
        setAttendanceData(response.data.data.presensi);
      }
    } catch (err) {
      console.error("Error fetching attendance detail:", err);
      toast.error("Gagal memuat data detail presensi");
    } finally {
      setLoading(false);
    }
  };

  // Hitung summary status & keterangan
  const summary = useMemo(() => {
    const totalHadir = attendanceData.filter(
      (d) => d.status === "Hadir",
    ).length;
    const totalTerlambat = attendanceData.filter(
      (d) => d.status === "Terlambat",
    ).length;
    const totalIzin = attendanceData.filter((d) => d.status === "Izin").length;
    const totalAlpha = attendanceData.filter(
      (d) => d.status === "Alpha",
    ).length;
    const totalLibur = attendanceData.filter(
      (d) => d.status === "Libur",
    ).length;
    const totalCuti = attendanceData.filter((d) => d.status === "Cuti").length;

    // Hitung ringkasan keterangan presensi pulang
    const totalMelebihiJam = attendanceData.filter(
      (d) => getKeteranganKategori(d) === "melebihi_jam",
    ).length;
    const totalLembur = attendanceData.filter(
      (d) => getKeteranganKategori(d) === "lembur",
    ).length;
    const totalTidakPulang = attendanceData.filter(
      (d) => getKeteranganKategori(d) === "tidak_pulang",
    ).length;
    const totalNormal = attendanceData.filter(
      (d) => getKeteranganKategori(d) === "normal",
    ).length;

    return {
      totalHadir,
      totalTerlambat,
      totalIzin,
      totalAlpha,
      totalLibur,
      totalCuti,
      totalMelebihiJam,
      totalLembur,
      totalTidakPulang,
      totalNormal,
    };
  }, [attendanceData]);

  const handleOpenKoreksiDetail = (jadwalId) => {
    setSelectedJadwalId(jadwalId);
    setShowModal(true);
  };

  // PDF Export dengan ringkasan keterangan
  const exportPDF = () => {
    try {
      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // HEADER
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("LAPORAN PRESENSI PEGAWAI", pageWidth / 2, 10, {
        align: "center",
      });

      doc.setFontSize(10);
      doc.text(
        `${getMonthName(currentMonth).toUpperCase()} ${currentYear}`,
        pageWidth / 2,
        15,
        { align: "center" },
      );

      // INFO KARYAWAN
      let startY = 22;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");

      const infoItems = [
        ["Nama", pegawai?.nama || "-"],
        ["Unit", unitName],
        ["Total Hadir", `${summary.totalHadir} Hari`],
        ["Total Terlambat", `${summary.totalTerlambat} Hari`],
        ["Total Izin", `${summary.totalIzin} Hari`],
        ["Total Alpha", `${summary.totalAlpha} Hari`],
        ["Total Libur", `${summary.totalLibur} Hari`],
        ["Total Cuti", `${summary.totalCuti} Hari`],
      ];

      infoItems.forEach((item, idx) => {
        const y = startY + idx * 4;
        doc.text(item[0], 15, y);
        doc.text(`: ${item[1]}`, 42, y);
      });

      const tableStartY = startY + infoItems.length * 4 + 2;

      // TABEL
      const tableRows = attendanceData.map((item) => [
        item.tanggal || "-",
        item.kodeShift || "-",
        item.jamKerja || "-",
        item.jamMasuk || "-",
        item.jamPulang || "-",
        item.status || "-",
        formatKeteranganText(item),
      ]);

      autoTable(doc, {
        startY: tableStartY,
        head: [
          [
            "Tanggal",
            "Shift",
            "Jam Kerja",
            "Masuk",
            "Pulang",
            "Status",
            "Keterangan",
          ],
        ],
        body: tableRows,
        styles: {
          fontSize: 8,
          cellPadding: 1,
          lineColor: [200, 200, 200],
          lineWidth: 0.1,
          overflow: "linebreak",
        },
        headStyles: {
          fillColor: [9, 132, 227],
          fontSize: 8,
          fontStyle: "bold",
          cellPadding: 1.5,
        },
        columnStyles: {
          0: { cellWidth: 20, fontStyle: "bold" },
          1: { cellWidth: 12, halign: "center" },
          2: { cellWidth: 22, halign: "center" },
          3: { cellWidth: 16, halign: "center" },
          4: { cellWidth: 16, halign: "center" },
          5: { cellWidth: 20, halign: "center", fontStyle: "bold" },
          6: { cellWidth: "auto" },
        },
        margin: { left: 10, right: 10 },
        didDrawPage: () => {},
      });

      // Dapatkan posisi Y terakhir setelah tabel
      const finalY = doc.lastAutoTable.finalY || tableStartY;

      // RINGKASAN KETERANGAN PULANG
      const summaryStartY = finalY + 10;

      // Judul ringkasan
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("Ringkasan Keterangan:", 10, summaryStartY);

      // Tabel ringkasan (compact)
      const summaryRows = [
        ["(!) Melebihi jam kerja", `${summary.totalMelebihiJam} Hari`],
        ["(+) Lembur", `${summary.totalLembur} Hari`],
        ["(-) Tidak absen pulang", `${summary.totalTidakPulang} Hari`],
        ["Normal (Hadir/Terlambat)", `${summary.totalNormal} Hari`],
      ];

      autoTable(doc, {
        startY: summaryStartY + 2,
        head: [["Keterangan", "Total"]],
        body: summaryRows,
        styles: {
          fontSize: 8,
          cellPadding: 1.5,
          lineColor: [200, 200, 200],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [9, 132, 227],
          fontSize: 8,
          fontStyle: "bold",
        },
        columnStyles: {
          0: { cellWidth: 120 },
          1: { cellWidth: 30, halign: "center", fontStyle: "bold" },
        },
        margin: { left: 10, right: 10 },
        tableWidth: 150,
      });

      // FOOTER
      const tanggalCetak = new Date().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text(`Dicetak pada ${tanggalCetak}`, 10, pageHeight - 8);
      doc.text(
        "Sistem Presensi Sultan Thaha v1.0",
        pageWidth - 10,
        pageHeight - 8,
        { align: "right" },
      );

      // DOWNLOAD
      doc.save(
        `Laporan_Presensi_${pegawai?.nama}_${getMonthName(currentMonth)}_${currentYear}.pdf`,
      );

      toast.success("File PDF berhasil diunduh!");
    } catch (err) {
      console.error(err);
      toast.error("Gagal export PDF");
    }
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
      {/* Breadcrumb */}
      <div className="bg-white rounded-lg p-3 shadow-sm text-xs">
        <button
          onClick={() =>
            navigate(
              `/admin/rekap-laporan/${currentYear}/${currentMonth}/units/${unitId}`,
              {
                state: { periode: periodeName, namaUnit: unitName },
              },
            )
          }
          className="flex items-center gap-2 text-gray-800 hover:text-gray-600 transition-colors"
        >
          <BackIcon />
          <span className="font-medium">Rekap Presensi</span>
          <span>›</span>
          <span className="font-medium">{periodeName}</span>
          <span>›</span>
          <span className="font-medium">{unitName}</span>
          <span>›</span>
          <span className="font-medium">{pegawai?.nama || "Detail"}</span>
        </button>
      </div>

      {/* Konten Utama */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 border-b border-gray-200 pb-2">
            Detail Presensi Pegawai
          </h1>
        </div>

        {/* Info Karyawan dan Export Button */}
        <div className="mb-6 mt-5">
          <div className="flex gap-6">
            <div className="flex-1 text-xs text-gray-800">
              <div className="grid grid-cols-[120px_10px_1fr]">
                <span className="font-medium">Nama</span>
                <span>:</span>
                <span className="font-semibold">{pegawai?.nama || "-"}</span>
              </div>
              <div className="grid grid-cols-[120px_10px_1fr]">
                <span className="font-medium">Unit</span>
                <span>:</span>
                <span className="font-semibold">{unitName}</span>
              </div>
              <div className="grid grid-cols-[120px_10px_1fr]">
                <span className="font-medium">Total Hadir</span>
                <span>:</span>
                <span className="font-semibold">{summary.totalHadir} Hari</span>
              </div>
              <div className="grid grid-cols-[120px_10px_1fr]">
                <span className="font-medium">Total Terlambat</span>
                <span>:</span>
                <span className="font-semibold">
                  {summary.totalTerlambat} Hari
                </span>
              </div>
              <div className="grid grid-cols-[120px_10px_1fr]">
                <span className="font-medium">Total Izin</span>
                <span>:</span>
                <span className="font-semibold">{summary.totalIzin} Hari</span>
              </div>
              <div className="grid grid-cols-[120px_10px_1fr]">
                <span className="font-medium">Total Alpha</span>
                <span>:</span>
                <span className="font-semibold">{summary.totalAlpha} Hari</span>
              </div>
              <div className="grid grid-cols-[120px_10px_1fr]">
                <span className="font-medium">Total Libur</span>
                <span>:</span>
                <span className="font-semibold">{summary.totalLibur} Hari</span>
              </div>
              <div className="grid grid-cols-[120px_10px_1fr]">
                <span className="font-medium">Total Cuti</span>
                <span>:</span>
                <span className="font-semibold">{summary.totalCuti} Hari</span>
              </div>
            </div>

            <div className="flex-shrink-0">
              <button
                onClick={exportPDF}
                className="flex items-center gap-2 px-4 py-2 bg-[#0984E3] text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <DownloadIcon /> Ekspor Laporan
              </button>
            </div>
          </div>
        </div>

        {/* Tabel Detail Presensi */}
        <div className="bg-white rounded shadow-lg overflow-hidden border border-gray-200">
          <div className="max-h-[600px] overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-100 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Tanggal
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Kode Shift
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Jam Kerja
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Jam Masuk
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Jam Pulang
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Keterangan
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {attendanceData.map((item, index) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-left text-xs text-gray-800">
                      {item.tanggal}
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-gray-800">
                      {item.kodeShift || "-"}
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-gray-800">
                      {item.jamKerja || "-"}
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-gray-800">
                      {item.jamMasuk || "-"}
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-gray-800">
                      {item.jamPulang || "-"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span
                          className={`px-3 py-1 rounded text-xs font-medium ${getStatusBadgeStyle(item.status)}`}
                        >
                          {item.status}
                        </span>
                        {item.sudahDiedit && item.jadwalId && (
                          <button
                            onClick={() =>
                              handleOpenKoreksiDetail(item.jadwalId)
                            }
                            title="Lihat Detail Koreksi"
                          >
                            <EditIcon className="w-4 h-4 text-[#0984E3] cursor-pointer hover:scale-110 transition-transform" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-gray-800">
                      {formatKeteranganText(item)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RINGKASAN KETERANGAN PULANG */}
        <div className="mt-4 p-4 border border-gray-200 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-3 text-sm">
            Ringkasan Keterangan
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Melebihi Jam Kerja */}
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-6 h-6 bg-gray-100 rounded font-bold text-xs flex items-center justify-center">
                  !
                </span>
                <span className="text-xs font-medium text-gray-700">
                  Melebihi jam kerja
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-800">
                {summary.totalMelebihiJam}
              </p>
              <p className="text-[10px] text-gray-500">Hari</p>
            </div>

            {/* Lembur */}
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-6 h-6 bg-gray-100 rounded font-bold text-xs flex items-center justify-center">
                  +
                </span>
                <span className="text-xs font-medium text-gray-700">
                  Lembur
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-800">
                {summary.totalLembur}
              </p>
              <p className="text-[10px] text-gray-500">Hari</p>
            </div>

            {/* Tidak Absen Pulang */}
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-6 h-6 bg-gray-100 rounded font-bold text-xs flex items-center justify-center">
                  -
                </span>
                <span className="text-xs font-medium text-gray-700">
                  Tidak absen pulang
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-800">
                {summary.totalTidakPulang}
              </p>
              <p className="text-[10px] text-gray-500">Hari</p>
            </div>

            {/* Normal */}
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-gray-700">
                  Normal
                </span>
                <span className="w-6 h-6 text-gray rounded font-bold text-xs flex items-center justify-center"></span>
              </div>
              <p className="text-2xl font-bold text-gray-800">
                {summary.totalNormal}
              </p>
              <p className="text-[10px] text-gray-500">Hari</p>
            </div>
          </div>
        </div>
      </div>

      <KoreksiDetailModal
        open={showModal}
        onClose={() => setShowModal(false)}
        jadwalId={selectedJadwalId}
      />
    </div>
  );
};

export default DetailPresensiKaryawan;
