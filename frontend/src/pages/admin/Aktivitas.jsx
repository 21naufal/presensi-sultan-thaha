import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../services/api";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import {
  BackIcon,
  SearchIcon,
  DownloadIcon,
  ChevronDownIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "../../components/icons/SystemIcons";

// Komponen: Modal Filter Tanggal
const DateFilterModal = ({
  isOpen,
  onClose,
  onApply,
  currentRange,
  currentStartDate,
  currentEndDate,
}) => {
  const [selectedRange, setSelectedRange] = useState(currentRange || "custom");
  const [customStart, setCustomStart] = useState(currentStartDate || "");
  const [customEnd, setCustomEnd] = useState(currentEndDate || "");

  useEffect(() => {
    if (isOpen) {
      setSelectedRange(currentRange || "custom");
      setCustomStart(currentStartDate || "");
      setCustomEnd(currentEndDate || "");
    }
  }, [isOpen, currentRange, currentStartDate, currentEndDate]);

  const handleApply = () => {
    if (selectedRange === "custom") {
      if (!customStart || !customEnd) {
        toast.error("Silakan pilih tanggal mulai dan tanggal akhir");
        return;
      }
      if (new Date(customStart) > new Date(customEnd)) {
        toast.error("Tanggal mulai tidak boleh lebih besar dari tanggal akhir");
        return;
      }
    }
    onApply({
      range: selectedRange,
      startDate: selectedRange === "custom" ? customStart : null,
      endDate: selectedRange === "custom" ? customEnd : null,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-90 overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-bold text-gray-800 text-center">
            Pilih Rentang Waktu
          </h2>
        </div>
        <div className="px-6">
          <div className="space-y-3">
            {[
              { value: "today", label: "Hari ini" },
              { value: "7days", label: "7 Hari terakhir" },
              { value: "30days", label: "30 Hari terakhir" },
              { value: "custom", label: "Custom" },
            ].map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <input
                  type="radio"
                  name="dateRange"
                  value={option.value}
                  checked={selectedRange === option.value}
                  onChange={(e) => setSelectedRange(e.target.value)}
                  className="w-5 h-5 text-blue-600 border-2 border-gray-300 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-800 group-hover:text-blue-600 transition-colors">
                  {option.label}
                </span>
              </label>
            ))}
          </div>
          {selectedRange === "custom" && (
            <div className="mt-2 grid grid-cols-2 gap-3 pl-8">
              <div className="border-2 border-gray-300 rounded-xl p-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Dari
                </label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>
              <div className="border-2 border-gray-300 rounded-xl p-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Sampai
                </label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>
            </div>
          )}
        </div>
        <div className="p-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border-2 border-[#0984E3] text-[#0984E3] font-medium rounded-xl text-sm"
          >
            Batal
          </button>
          <button
            onClick={handleApply}
            className="flex-1 px-4 py-2 bg-[#0984E3] text-white font-medium rounded-xl text-sm"
          >
            Terapkan
          </button>
        </div>
      </div>
    </div>
  );
};

// Komponen: Pagination
const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  // Generate array nomor halaman yang akan ditampilkan
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(
          1,
          "...",
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages,
        );
      } else {
        pages.push(
          1,
          "...",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "...",
          totalPages,
        );
      }
    }
    return pages;
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 px-2">
      {/* Info jumlah data yang ditampilkan */}
      <div className="text-xs text-gray-600">
        Menampilkan{" "}
        <span className="font-semibold text-gray-800">{startItem}</span>-
        <span className="font-semibold text-gray-800">{endItem}</span> dari{" "}
        <span className="font-semibold text-gray-800">{totalItems}</span> data
      </div>

      {/* Navigasi halaman */}
      <div className="flex items-center gap-1">
        {/* Tombol Previous */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Halaman Sebelumnya"
        >
          <ChevronLeftIcon />
        </button>

        {/* Nomor halaman */}
        {getPageNumbers().map((page, idx) => {
          if (page === "...") {
            return (
              <span
                key={`ellipsis-${idx}`}
                className="px-2 text-gray-400 text-sm"
              >
                ...
              </span>
            );
          }
          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`min-w-[36px] h-9 rounded-lg text-sm font-medium transition-colors ${
                currentPage === page
                  ? "bg-[#0984E3] text-white shadow-sm"
                  : "border border-gray-300 text-gray-700 hover:bg-gray-100"
              }`}
            >
              {page}
            </button>
          );
        })}

        {/* Tombol Next */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Halaman Selanjutnya"
        >
          <ChevronRightIcon />
        </button>
      </div>
    </div>
  );
};

// Komponen Utama: Aktivitas
const Aktivitas = () => {
  const navigate = useNavigate();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionOptions, setActionOptions] = useState([]);

  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    action: "",
    search: "",
  });

  // State untuk pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 50; // 50 data per halaman

  const [showDateFilterModal, setShowDateFilterModal] = useState(false);
  const [dateRange, setDateRange] = useState("custom");
  const [exporting, setExporting] = useState(false);

  const searchTimeoutRef = useRef(null);

  // Ambil daftar opsi filter aktivitas
  const fetchActions = async () => {
    try {
      const response = await api.get("/logs/actions");
      if (response.data.status === "success") {
        setActionOptions(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching actions:", err);
    }
  };

  // Fetch log aktivitas dengan pagination
  const fetchLogs = async (customFilters = null, page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const currentFilters = customFilters || filters;

      const queryParams = new URLSearchParams();
      if (currentFilters.startDate)
        queryParams.append("startDate", currentFilters.startDate);
      if (currentFilters.endDate)
        queryParams.append("endDate", currentFilters.endDate);
      if (currentFilters.action)
        queryParams.append("action", currentFilters.action);
      if (currentFilters.search)
        queryParams.append("search", currentFilters.search);
      queryParams.append("page", page);
      queryParams.append("limit", itemsPerPage);

      const response = await api.get(`/logs?${queryParams.toString()}`);

      if (response.data.status === "success") {
        setLogs(response.data.data);
        setTotalItems(response.data.total || 0);
      } else {
        setError(response.data.message || "Gagal mengambil data aktivitas");
      }
    } catch (err) {
      console.error("Error fetching logs:", err);
      setError(err.response?.data?.message || "Terjadi kesalahan koneksi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
    fetchLogs(null, 1);
  }, []);

  // Fetch ulang saat filter berubah (reset ke halaman 1)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setCurrentPage(1); // Reset ke halaman 1 saat filter berubah
    fetchLogs(filters, 1);
  }, [filters]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  // Handle perubahan input filter dengan debounce untuk pencarian
  const handleFilterChange = (key, value) => {
    if (key === "search") {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = setTimeout(() => {
        setFilters((prev) => ({ ...prev, [key]: value }));
      }, 500);
    } else {
      setFilters((prev) => ({ ...prev, [key]: value }));
    }
  };

  // Handler ganti halaman
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    fetchLogs(filters, newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle penerapan filter tanggal dari modal
  const handleDateFilterApply = (dateData) => {
    setDateRange(dateData.range);
    let newStartDate = "";
    let newEndDate = "";

    if (dateData.range === "today") {
      const today = new Date().toISOString().split("T")[0];
      newStartDate = today;
      newEndDate = today;
    } else if (dateData.range === "7days") {
      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 6);
      newStartDate = sevenDaysAgo.toISOString().split("T")[0];
      newEndDate = today.toISOString().split("T")[0];
    } else if (dateData.range === "30days") {
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 29);
      newStartDate = thirtyDaysAgo.toISOString().split("T")[0];
      newEndDate = today.toISOString().split("T")[0];
    } else {
      newStartDate = dateData.startDate || "";
      newEndDate = dateData.endDate || "";
    }

    setFilters((prev) => ({
      ...prev,
      startDate: newStartDate,
      endDate: newEndDate,
    }));
  };

  // Tampilkan label rentang tanggal yang sedang aktif
  const getDateFilterLabel = () => {
    if (dateRange === "today") return "Hari ini";
    if (dateRange === "7days") return "7 Hari terakhir";
    if (dateRange === "30days") return "30 Hari terakhir";
    if (filters.startDate && filters.endDate) {
      return `${formatDateDisplay(filters.startDate)} - ${formatDateDisplay(filters.endDate)}`;
    }
    return "Pilih Rentang Waktu";
  };

  // Format tanggal untuk tampilan
  const formatDateDisplay = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Reset semua filter ke default
  const handleReset = () => {
    setFilters({ startDate: "", endDate: "", action: "", search: "" });
    setDateRange("custom");
    setCurrentPage(1);
    toast.success("Filter berhasil direset");
  };

  // Fungsi: Export Excel (dengan tanggal cetak)
  const handleExport = async () => {
    if (totalItems === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    try {
      setExporting(true);

      const queryParams = new URLSearchParams();
      if (filters.startDate) queryParams.append("startDate", filters.startDate);
      if (filters.endDate) queryParams.append("endDate", filters.endDate);
      if (filters.action) queryParams.append("action", filters.action);
      if (filters.search) queryParams.append("search", filters.search);
      queryParams.append("limit", "10000"); // Ambil semua data untuk ekspor

      const exportResponse = await api.get(`/logs?${queryParams.toString()}`);
      const exportLogs =
        exportResponse.data.status === "success"
          ? exportResponse.data.data
          : logs;

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Log Aktivitas");

      const totalColumns = 6;

      // Header Baris 1: Judul
      sheet.mergeCells(1, 1, 1, totalColumns);
      sheet.getCell("A1").value = "LAPORAN LOG AKTIVITAS SISTEM";
      sheet.getCell("A1").font = { bold: true, size: 16 };
      sheet.getCell("A1").alignment = {
        horizontal: "center",
        vertical: "middle",
      };

      // Header Baris 2: Periode / Info Filter
      let subtitleText = "SEMUA WAKTU";
      if (filters.startDate && filters.endDate) {
        subtitleText = `${formatDateDisplay(filters.startDate)} - ${formatDateDisplay(filters.endDate)}`;
      } else if (dateRange === "today") subtitleText = "HARI INI";
      else if (dateRange === "7days") subtitleText = "7 HARI TERAKHIR";
      else if (dateRange === "30days") subtitleText = "30 HARI TERAKHIR";

      let actionText = "";
      if (filters.action) {
        const actionLabel =
          actionOptions.find((a) => a.value === filters.action)?.label ||
          filters.action;
        actionText = ` | AKTIVITAS: ${actionLabel.toUpperCase()}`;
      }

      sheet.mergeCells(2, 1, 2, totalColumns);
      sheet.getCell("A2").value = `PERIODE: ${subtitleText}${actionText}`;
      sheet.getCell("A2").font = { bold: true, size: 13 };
      sheet.getCell("A2").alignment = {
        horizontal: "center",
        vertical: "middle",
      };

      // Header Baris 3: Tanggal Cetak
      const exportDate = new Date().toLocaleString("id-ID", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      sheet.mergeCells(3, 1, 3, totalColumns);
      sheet.getCell("A3").value = `Dicetak pada: ${exportDate}`;
      sheet.getCell("A3").font = {
        italic: true,
        size: 10,
        color: { argb: "FF666666" },
      };
      sheet.getCell("A3").alignment = {
        horizontal: "center",
        vertical: "middle",
      };

      // Header Baris 4: Kolom Tabel
      const headerRow = [
        "No",
        "Waktu",
        "Admin",
        "Aktivitas",
        "Modul",
        "Deskripsi",
      ];
      sheet.addRow(headerRow);

      const header = sheet.getRow(4); // Baris 4 karena baris 3 adalah tanggal cetak
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

      // Data Rows
      exportLogs.forEach((log, index) => {
        const aktivitasLabel =
          actionOptions.find((a) => a.value === log.aktivitas)?.label ||
          log.aktivitas;

        const row = [
          index + 1,
          log.waktu,
          log.admin_nama || log.admin,
          aktivitasLabel,
          log.modul,
          log.deskripsi,
        ];

        const excelRow = sheet.addRow(row);
        excelRow.eachCell((cell, colNumber) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" },
            bottom: { style: "thin" },
          };

          if (
            colNumber === 1 ||
            colNumber === 2 ||
            colNumber === 4 ||
            colNumber === 5
          ) {
            cell.alignment = { horizontal: "center", vertical: "middle" };
          } else if (colNumber === 6) {
            cell.alignment = {
              horizontal: "left",
              vertical: "top",
              wrapText: true,
            };
          } else {
            cell.alignment = { horizontal: "left", vertical: "middle" };
          }
        });
      });

      // Set lebar kolom
      sheet.getColumn(1).width = 8;
      sheet.getColumn(2).width = 22;
      sheet.getColumn(3).width = 25;
      sheet.getColumn(4).width = 20;
      sheet.getColumn(5).width = 15;
      sheet.getColumn(6).width = 80;

      // Proteksi Sheet
      await sheet.protect("password_log_aktivitas");

      const buffer = await workbook.xlsx.writeBuffer();
      const filename = `Log_Aktivitas_${new Date().toISOString().split("T")[0]}.xlsx`;

      saveAs(
        new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        filename,
      );

      toast.success(`${exportLogs.length} log aktivitas berhasil diekspor`);
    } catch (err) {
      console.error("Error export log:", err);
      toast.error("Gagal mengekspor log: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  // Hitung total halaman
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
        <span className="ml-2 text-gray-600">Memuat data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
        <p className="font-medium">Gagal memuat data</p>
        <p className="text-sm mt-1">{error}</p>
        <button
          onClick={() => fetchLogs(filters, currentPage)}
          className="mt-3 text-xs px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Breadcrumb */}
      <div className="bg-white rounded-lg p-3 shadow-sm text-xs">
        <button
          onClick={() => navigate("/admin")}
          className="flex items-center gap-2 text-gray-800 hover:text-gray-600 transition-colors"
        >
          <BackIcon />
          <span className="font-medium">Aktivitas</span>
        </button>
      </div>

      {/* Konten Utama */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 border-b border-gray-200 pb-2">
            Aktivitas
          </h1>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-4 mt-5 text-sm">
          <div className="flex-1 relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Cari admin, aktivitas, atau detail..."
              defaultValue={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none text-sm"
            />
          </div>

          <div className="relative min-w-[220px]">
            <select
              value={filters.action}
              onChange={(e) => handleFilterChange("action", e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl appearance-none bg-white text-sm font-medium text-gray-800"
            >
              <option value="">Semua Aktivitas</option>
              {actionOptions.map((action) => (
                <option key={action.value} value={action.value}>
                  {action.label}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <ChevronDownIcon />
            </div>
          </div>

          <div className="relative min-w-[220px]">
            <button
              onClick={() => setShowDateFilterModal(true)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white text-sm font-medium text-gray-800 flex items-center justify-between"
            >
              <span className="truncate">{getDateFilterLabel()}</span>
              <CalendarIcon />
            </button>
          </div>

          <button
            onClick={handleReset}
            className="px-6 py-3 border-2 border-gray-300 rounded-xl text-sm font-medium text-gray-700 whitespace-nowrap"
          >
            Reset
          </button>

          <button
            onClick={handleExport}
            disabled={exporting || totalItems === 0}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-[#0984E3] text-white rounded-xl text-sm font-medium whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <DownloadIcon />
            {exporting ? "Mengekspor..." : "Ekspor Laporan"}
          </button>
        </div>

        {/* Tabel Data */}
        <div className="bg-white rounded shadow-lg overflow-hidden">
          <div className="max-h-[600px] overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-100 sticky top-0 z-10 shadow-sm h-12">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Waktu
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Admin
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Aktivitas
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Modul
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Deskripsi
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-800"></div>
                      </div>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-4 py-8 text-center text-gray-500 text-sm"
                    >
                      <div className="flex flex-col items-center text-xs gap-2">
                        <p>Tidak ada data aktivitas</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  logs.map((log, index) => (
                    <tr
                      key={log.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-xs text-gray-800">
                        {log.waktu}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-800 font-medium">
                        {log.admin_nama || log.admin}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${log.aktivitas}`}
                        >
                          {actionOptions.find((a) => a.value === log.aktivitas)
                            ?.label || log.aktivitas}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 text-center">
                        {log.modul}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {log.deskripsi}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
        />
      </div>

      <DateFilterModal
        isOpen={showDateFilterModal}
        onClose={() => setShowDateFilterModal(false)}
        onApply={handleDateFilterApply}
        currentRange={dateRange}
        currentStartDate={filters.startDate}
        currentEndDate={filters.endDate}
      />
    </div>
  );
};

export default Aktivitas;
