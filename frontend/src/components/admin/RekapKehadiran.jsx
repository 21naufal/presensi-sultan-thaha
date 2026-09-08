import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../services/api";
import CorrectionModal from "../../components/admin/CorrectionModal";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// import icon
import {
  BackIcon,
  SearchIcon,
  DownloadIcon,
  ArrowRightIcon,
} from "../../components/icons/SystemIcons";

// Helper untuk mendapatkan jumlah hari dalam sebulan
const getDaysInMonth = (year, month) => new Date(year, month, 0).getDate();

// Helper untuk nama bulan
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

const RekapKehadiran = () => {
  const navigate = useNavigate();
  const { year, month, unitId } = useParams();
  const location = useLocation();

  const periodeName = location.state?.periode || "Periode";
  const unitName = location.state?.namaUnit || `Unit ${unitId}`;

  const currentYear = parseInt(year);
  const currentMonth = parseInt(month);
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);

  const [searchTerm, setSearchTerm] = useState("");
  const [pegawai, setPegawai] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [loading, setLoading] = useState(true);

  // State untuk modal koreksi
  const [showModal, setShowModal] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);

  // Fetch data rekap kehadiran
  useEffect(() => {
    fetchAttendanceData();
  }, [unitId, currentYear, currentMonth]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/admin/presensi/admin/matrix/${unitId}/${currentYear}/${currentMonth}`,
      );

      if (response.data.status === "success") {
        const data = response.data.data;
        setPegawai(data.pegawai);
        setAttendanceData(data.schedules);
      }
    } catch (err) {
      console.error("Error fetching attendance:", err);
      toast.error("Gagal memuat data kehadiran");
    } finally {
      setLoading(false);
    }
  };

  // Filter pegawai berdasarkan pencarian
  const filteredPegawai = pegawai.filter((p) =>
    p.nama.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Fungsi untuk mendapatkan kode kehadiran dengan marker
  const getAttendanceCode = (pegawaiId, day) => {
    const entry = attendanceData[pegawaiId]?.[day];

    if (!entry || !entry.status || entry.status === "belum_diisi") {
      return {
        code: "-",
        markerKiri: null,
        markerKanan: null,
        color: "",
        bg: "bg-gray-50",
      };
    }

    let code = "";
    let markerKiri = null; // * untuk sudah diedit
    let markerKanan = null; // !, +, atau -
    let color = "";
    let bg = "";

    switch (entry.status) {
      case "hadir":
        code = "H";
        bg = "bg-green-50";
        color = "text-green-800";
        break;
      case "terlambat":
        code = "T";
        bg = "bg-yellow-100";
        color = "text-yellow-800";
        break;
      case "shift":
        code = "A";
        bg = "bg-red-50";
        color = "text-red-800";
        break;
      case "izin":
        code = "I";
        bg = "bg-blue-100";
        color = "text-blue-800";
        break;
      case "libur":
        code = "L";
        bg = "bg-gray-200";
        color = "text-gray-800";
        break;
      case "cuti":
        code = "C";
        bg = "bg-emerald-100";
        color = "text-emerald-800";
        break;
      case "alpa":
      default:
        code = "A";
        bg = "bg-red-100";
        color = "text-red-800";
        break;
    }

    // Marker di KIRI ATAS: * jika sudah diedit
    if (entry.sudahDiedit || entry.isEdited) {
      markerKiri = "*";
    }

    // Marker di KANAN ATAS: !, +, atau -
    if (entry.markerKanan) {
      markerKanan = entry.markerKanan;
    } else if (entry.isOvertime) {
      markerKanan = "+";
    } else if (entry.noCheckout) {
      markerKanan = "-";
    }

    return { code, markerKiri, markerKanan, color, bg };
  };

  // Handle klik sel untuk koreksi
  const handleCellClick = (pegawai, day, entry) => {
    setSelectedCell({ pegawai, day, entry });
    setShowModal(true);
  };

  // Handle simpan koreksi
  const handleSaveCorrection = async (correctionData) => {
    try {
      const formData = new FormData();

      // Field wajib sesuai backend
      formData.append("jadwalId", selectedCell.entry.jadwalId);
      formData.append("statusBaru", correctionData.statusBaru);
      formData.append("keterangan", correctionData.keterangan || "");
      formData.append("alasan", correctionData.alasan || "");

      // File (opsional)
      if (correctionData.file) {
        formData.append("buktiFile", correctionData.file);
      }

      await api.put("/admin/presensi/admin/koreksi", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setShowModal(false);
      fetchAttendanceData();
      toast.success("✅ Koreksi berhasil disimpan");
    } catch (err) {
      console.error("Error saving correction:", err);
      toast.error("❌ Gagal menyimpan koreksi");
    }
  };

  // Fungsi untuk export Excel dengan 2 sheet
  const exportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();

      // SHEET 1 - REKAP PRESENSI
      const sheet1 = workbook.addWorksheet("Rekap Presensi");

      const title = `REKAP PRESENSI PEGAWAI ${unitName.toUpperCase()}`;
      const subtitle = `PERIODE ${getMonthName(currentMonth).toUpperCase()} ${currentYear}`;

      const totalColumns = daysInMonth + 2;

      // Header Baris 1: Judul
      sheet1.mergeCells(1, 1, 1, totalColumns);
      sheet1.getCell("A1").value = title;
      sheet1.getCell("A1").font = { bold: true, size: 16 };
      sheet1.getCell("A1").alignment = {
        horizontal: "center",
        vertical: "middle",
      };

      // Header Baris 2: Periode
      sheet1.mergeCells(2, 1, 2, totalColumns);
      sheet1.getCell("A2").value = subtitle;
      sheet1.getCell("A2").font = { bold: true, size: 13 };
      sheet1.getCell("A2").alignment = {
        horizontal: "center",
        vertical: "middle",
      };

      // Header Baris 3: Kolom
      const headerRow = ["No", "Nama Pegawai"];
      for (let i = 1; i <= daysInMonth; i++) {
        headerRow.push(i);
      }
      sheet1.addRow(headerRow);

      const header = sheet1.getRow(3);
      header.eachCell((cell) => {
        cell.font = { bold: true };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
          bottom: { style: "thin" },
        };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFD9E2F3" },
        };
      });

      // Data Pegawai
      filteredPegawai.forEach((pegawai, index) => {
        const row = [index + 1, pegawai.nama];

        for (let day = 1; day <= daysInMonth; day++) {
          const { code, markerKanan } = getAttendanceCode(
            pegawai.id_pegawai,
            day,
          );

          // GABUNGKAN code + markerKanan (contoh: "H!", "T+", "H-")
          let cellValue = code;
          if (
            markerKanan &&
            code !== "-" &&
            code !== "A" &&
            code !== "I" &&
            code !== "L" &&
            code !== "C"
          ) {
            cellValue = `${code}${markerKanan}`;
          }

          row.push(cellValue);
        }

        const excelRow = sheet1.addRow(row);

        excelRow.eachCell((cell, colNumber) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" },
            bottom: { style: "thin" },
          };

          cell.alignment = {
            horizontal:
              colNumber <= 2 ? (colNumber === 1 ? "center" : "left") : "center",
            vertical: "middle",
          };

          // Pewarnaan berdasarkan kode status
          if (colNumber > 2) {
            const cellValue = cell.value || "";

            if (cellValue.startsWith("H")) {
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFE8F5E9" },
              };
            } else if (cellValue.startsWith("T")) {
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFFFF9C4" },
              };
            } else if (cellValue.startsWith("A")) {
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFFFEBEE" },
              };
            } else if (cellValue.startsWith("I")) {
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFE3F2FD" },
              };
            } else if (cellValue.startsWith("L")) {
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFF5F5F5" },
              };
            } else if (cellValue.startsWith("C")) {
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFE0F2F1" },
              };
            }
          }
        });
      });

      // Set lebar kolom
      sheet1.getColumn(1).width = 8;
      sheet1.getColumn(2).width = 30;
      for (let i = 3; i <= daysInMonth + 2; i++) {
        sheet1.getColumn(i).width = 6;
      }

      // Keterangan
      let startLegend = filteredPegawai.length + 6;

      const legends = [
        ["H", "Hadir"],
        ["T", "Terlambat"],
        ["A", "Tanpa Keterangan (Alpa)"],
        ["I", "Izin"],
        ["L", "Libur"],
        ["C", "Cuti"],
        ["H! / T!", "Melebihi jam kerja"],
        ["H+ / T+", "Lembur"],
        ["H- / T-", "Tidak presensi pulang"],
      ];

      sheet1.getCell(`A${startLegend}`).value = "Keterangan:";
      sheet1.getCell(`A${startLegend}`).font = { bold: true };

      legends.forEach((item, idx) => {
        sheet1.getCell(`A${startLegend + idx + 1}`).value =
          `${item[0]} = ${item[1]}`;
      });

      // Proteksi Sheet 1
      await sheet1.protect("password_rekap_123");

      // SHEET 2 - RINGKASAN PRESENSI
      const sheet2 = workbook.addWorksheet("Ringkasan Presensi");

      sheet2.mergeCells("A1:N1");
      sheet2.mergeCells("A2:N2");

      sheet2.getCell("A1").value =
        `RINGKASAN PRESENSI PEGAWAI ${unitName.toUpperCase()}`;
      sheet2.getCell("A1").font = { bold: true, size: 16 };
      sheet2.getCell("A1").alignment = { horizontal: "center" };

      sheet2.getCell("A2").value =
        `PERIODE ${getMonthName(currentMonth).toUpperCase()} ${currentYear}`;
      sheet2.getCell("A2").font = { bold: true, size: 13 };
      sheet2.getCell("A2").alignment = { horizontal: "center" };

      const summaryHeader = [
        "No",
        "Nama Pegawai",
        "H",
        "T",
        "A",
        "I",
        "L",
        "C",
        "H!",
        "H+",
        "H-",
        "T!",
        "T+",
        "T-",
      ];
      sheet2.addRow(summaryHeader);

      const summaryRowNumber = 3;
      sheet2.getRow(summaryRowNumber).eachCell((cell) => {
        cell.font = { bold: true };
        cell.alignment = { horizontal: "center" };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
          bottom: { style: "thin" },
        };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFD9E2F3" },
        };
      });

      filteredPegawai.forEach((pegawai, index) => {
        const summary = {
          H: 0,
          T: 0,
          A: 0,
          I: 0,
          L: 0,
          C: 0,
          HBANG: 0,
          HPLUS: 0,
          HMINUS: 0,
          TBANG: 0,
          TPLUS: 0,
          TMINUS: 0,
        };

        for (let day = 1; day <= daysInMonth; day++) {
          const entry = attendanceData[pegawai.id_pegawai]?.[day];
          if (!entry) continue;

          if (entry.status === "hadir") summary.H++;
          if (entry.status === "terlambat") summary.T++;
          if (entry.status === "alpa" || entry.status === "shift") summary.A++;
          if (entry.status === "izin") summary.I++;
          if (entry.status === "libur") summary.L++;
          if (entry.status === "cuti") summary.C++;

          if (entry.status === "hadir") {
            if (entry.markerKanan === "!") summary.HBANG++;
            if (entry.isOvertime || entry.markerKanan === "+") summary.HPLUS++;
            if (entry.noCheckout || entry.markerKanan === "-") summary.HMINUS++;
          }

          if (entry.status === "terlambat") {
            if (entry.markerKanan === "!") summary.TBANG++;
            if (entry.isOvertime || entry.markerKanan === "+") summary.TPLUS++;
            if (entry.noCheckout || entry.markerKanan === "-") summary.TMINUS++;
          }
        }

        const row = sheet2.addRow([
          index + 1,
          pegawai.nama,
          summary.H,
          summary.T,
          summary.A || 0,
          summary.I || 0,
          summary.L,
          summary.C || 0,
          summary.HBANG || 0,
          summary.HPLUS || 0,
          summary.HMINUS || 0,
          summary.TBANG || 0,
          summary.TPLUS || 0,
          summary.TMINUS || 0,
        ]);

        row.eachCell((cell, colNumber) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" },
            bottom: { style: "thin" },
          };
          cell.alignment = {
            horizontal:
              colNumber <= 2 ? (colNumber === 1 ? "center" : "left") : "center",
            vertical: "middle",
          };
        });
      });

      sheet2.columns = [
        { width: 8 },
        { width: 30 },
        { width: 8 },
        { width: 8 },
        { width: 8 },
        { width: 8 },
        { width: 8 },
        { width: 8 },
        { width: 8 },
        { width: 8 },
        { width: 8 },
        { width: 8 },
        { width: 8 },
        { width: 8 },
      ];

      let legendRow = filteredPegawai.length + 6;
      sheet2.getCell(`A${legendRow}`).value = "Keterangan:";
      sheet2.getCell(`A${legendRow}`).font = { bold: true };

      legends.forEach((item, idx) => {
        sheet2.getCell(`A${legendRow + idx + 1}`).value =
          `${item[0]} = ${item[1]}`;
      });

      // Proteksi Sheet 2
      await sheet2.protect("password_rekap_123");

      // Download File
      const buffer = await workbook.xlsx.writeBuffer();

      saveAs(
        new Blob([buffer]),
        `Rekap_Presensi_${unitName}_${getMonthName(currentMonth)}_${currentYear}.xlsx`,
      );

      toast.success("File Excel berhasil diunduh!");
    } catch (err) {
      console.error(err);
      toast.error("Gagal export excel");
    }
  };

  // UI: Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
        <span className="ml-2 text-gray-600 text-sm">Memuat data...</span>
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
              `/admin/rekap-laporan/${currentYear}/${currentMonth}/units`,
              { state: { periode: periodeName } },
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
        </button>
      </div>

      {/* Konten Utama */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800 border-b border-gray-200 pb-2">
            Rekap Kehadiran
          </h1>
        </div>

        {/* Search dan Export */}
        <div className="flex flex-col md:flex-row gap-4 mb-5 mt-5 text-sm">
          {/* Search */}
          <div className="flex-1 relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <SearchIcon className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Cari nama pegawai..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 transition-colors"
            />
          </div>

          {/* Export Button */}
          <div className="flex gap-3">
            <button
              onClick={exportExcel}
              className="flex items-center gap-2 px-4 py-3 border-2 bg-[#0984E3] text-white font-medium rounded-xl"
            >
              <DownloadIcon />
              Ekspor Laporan
            </button>
          </div>
        </div>

        {/* Tabel Rekap */}
        <div className="bg-white rounded shadow-lg overflow-hidden">
          <div className="max-h-[600px] overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-200 sticky top-0 z-10 shadow-sm h-12">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-16">
                    No
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-40">
                    Nama Pegawai
                  </th>
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(
                    (day) => (
                      <th
                        key={day}
                        className="px-2 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[40px]"
                      >
                        {day.toString().padStart(2, "0")}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPegawai.map((pegawai, index) => (
                  <tr
                    key={pegawai.id_pegawai}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-2 text-xs text-gray-800">
                      {(index + 1).toString().padStart(2, "0")}
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-800 font-medium">
                      <div className="flex justify-between items-center gap-2">
                        <span className="truncate">{pegawai.nama}</span>
                        <button
                          onClick={() =>
                            navigate(
                              `/admin/rekap-laporan/${currentYear}/${currentMonth}/units/${unitId}/pegawai/${pegawai.id_pegawai}/detail`,
                              {
                                state: {
                                  periode: periodeName,
                                  namaUnit: unitName,
                                  pegawai,
                                },
                              },
                            )
                          }
                          className="p-1 bg-blue-500 rounded-full hover:bg-blue-600 transition-colors"
                          title="Lihat Detail"
                        >
                          <ArrowRightIcon className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    </td>
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(
                      (day) => {
                        const { code, markerKiri, markerKanan, color, bg } =
                          getAttendanceCode(pegawai.id_pegawai, day);
                        const entry = attendanceData[pegawai.id_pegawai]?.[day];

                        return (
                          <td key={day} className="px-1 py-1">
                            <div
                              onClick={() =>
                                handleCellClick(pegawai, day, entry)
                              }
                              className={`w-full py-2 text-xs font-semibold border border-gray-200 rounded text-center cursor-pointer ${bg} ${color} hover:bg-gray-100 transition-colors relative h-10 flex items-center justify-center`}
                            >
                              {/* Marker di KIRI ATAS (sudah diedit) */}
                              {markerKiri && (
                                <span className="absolute top-0.5 left-0.5 text-[9px] font-bold text-gray-600">
                                  {markerKiri}
                                </span>
                              )}

                              {/* Kode status di tengah */}
                              {code}

                              {/* Marker di KANAN ATAS (!, +, -) */}
                              {markerKanan && (
                                <span
                                  className={`absolute top-0.5 right-0.5 text-[9px] font-bold ${
                                    markerKanan === "!"
                                      ? "text-red-600"
                                      : markerKanan === "+"
                                        ? "text-green-600"
                                        : "text-gray-600"
                                  }`}
                                >
                                  {markerKanan}
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      },
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Keterangan */}
        <div className="mb-5 p-4 mt-4">
          <h3 className="font-medium text-gray-800 mb-3 text-xs">
            Keterangan :
          </h3>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="w-10 px-2 py-1 bg-green-50 text-green-800 rounded font-semibold text-xs text-center border border-gray-200">
                H
              </span>
              <span className="w-4 text-center text-sm text-gray-700">=</span>
              <span className="text-sm text-gray-700">Hadir</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-10 px-2 py-1 bg-yellow-100 text-yellow-800 rounded font-semibold text-xs text-center border border-gray-200">
                T
              </span>
              <span className="w-4 text-center text-sm text-gray-700">=</span>
              <span className="text-sm text-gray-700">Terlambat</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-10 px-2 py-1 bg-red-100 text-red-800 rounded font-semibold text-xs text-center border border-gray-200">
                A
              </span>
              <span className="w-4 text-center text-sm text-gray-700">=</span>
              <span className="text-sm text-gray-700">
                Alpa / Tanpa Keterangan
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-10 px-2 py-1 bg-blue-100 text-blue-800 rounded font-semibold text-xs text-center border border-gray-200">
                I
              </span>
              <span className="w-4 text-center text-sm text-gray-700">=</span>
              <span className="text-sm text-gray-700">Izin</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-10 px-2 py-1 bg-gray-200 text-gray-800 rounded font-semibold text-xs text-center border border-gray-200">
                L
              </span>
              <span className="w-4 text-center text-sm text-gray-700">=</span>
              <span className="text-sm text-gray-700">Libur</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-10 px-2 py-1 bg-emerald-100 text-emerald-800 rounded font-semibold text-xs text-center border border-gray-200">
                C
              </span>
              <span className="w-4 text-center text-sm text-gray-700">=</span>
              <span className="text-sm text-gray-700">Cuti</span>
            </div>

            <p className="text-xs text-gray-800 mt-3">
              Keterangan (tanda yang muncul di kanan atas)
            </p>
            <div className="flex items-center gap-2">
              <span className="w-10 px-2 py-1 text-red-600 rounded font-semibold text-xs text-center border border-gray-200">
                !
              </span>
              <span className="w-4 text-center text-sm text-gray-700">=</span>
              <span className="text-sm text-gray-700">Melebihi jam kerja</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-10 px-2 py-1 text-green-600 rounded font-semibold text-xs text-center border border-gray-200">
                +
              </span>
              <span className="w-4 text-center text-sm text-gray-700">=</span>
              <span className="text-sm text-gray-700">Lembur</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-10 px-2 py-1 text-gray-600 rounded font-semibold text-xs text-center border border-gray-200">
                -
              </span>
              <span className="w-4 text-center text-sm text-gray-700">=</span>
              <span className="text-sm text-gray-700">Tidak absen pulang</span>
            </div>
            <p className="text-xs text-gray-800 mt-3">
              * = Dikoreksi (akan muncul di kiri atas jika ada perubahan data
              presensi)
            </p>
          </div>
        </div>
      </div>

      {/* Modal menggunakan komponen terpisah */}
      <CorrectionModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSaveCorrection}
        data={selectedCell}
        year={currentYear}
        month={currentMonth}
      />
    </div>
  );
};

export default RekapKehadiran;
