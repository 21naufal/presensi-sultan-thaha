import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../services/api";
import EditJadwalModal from "../../components/admin/EditJadwalModal";
import ImportPreviewModal from "../../components/admin/ImportPreviewModal";
import ModalConfirm from "../../components/admin/ModalConfirm";
import {
  generateScheduleTemplate,
  downloadExcel,
  parseScheduleExcel,
  convertToPayload,
} from "../../utils/excelHelpers";

// import icon
import {
  BackIcon,
  SearchIcon,
  DownloadIcon,
  UploadIcon,
  ArrowRightIcon,
} from "../../components/icons/SystemIcons";

// Helper functions
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
const formatDate = (year, month, day) =>
  `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

const JadwalUnitDetail = () => {
  const navigate = useNavigate();
  const { year, month, unitId } = useParams();
  const location = useLocation();

  const periodeName =
    location.state?.periode || `${getMonthName(parseInt(month))} ${year}`;
  const unitName = location.state?.namaUnit || `Unit ${unitId}`;

  const currentYear = parseInt(year);
  const currentMonth = parseInt(month);
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);

  const [searchTerm, setSearchTerm] = useState("");
  const [pegawai, setPegawai] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [schedules, setSchedules] = useState({});
  const [draftSchedules, setDraftSchedules] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);

  // State untuk import Excel
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  // State untuk Modal Konfirmasi
  const [showAutoFillModal, setShowAutoFillModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showEmptyWarningModal, setShowEmptyWarningModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const modalEntry = selectedCell
    ? (draftSchedules[selectedCell?.pegawai?.id_pegawai]?.[selectedCell?.day] ??
      schedules[selectedCell?.pegawai?.id_pegawai]?.[selectedCell?.day])
    : null;

  // Fetch matrix jadwal dari API
  const fetchScheduleMatrix = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(
        `/schedules/units/${unitId}/${currentYear}/${currentMonth}`,
      );

      if (response.data.status === "success") {
        const data = response.data.data;
        setPegawai(data.pegawai);
        setShifts(data.shifts);
        setSchedules(data.schedules);
        setDraftSchedules({});
      } else {
        setError(response.data.message || "Gagal mengambil data jadwal");
      }
    } catch (err) {
      console.error("Error fetch schedule matrix:", err);
      setError(err.response?.data?.message || "Terjadi kesalahan koneksi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduleMatrix();
  }, [unitId, currentYear, currentMonth]);

  // Handle perubahan dropdown
  const handleJadwalChange = (pegawaiId, day, value) => {
    const [shiftIdStr, status] = value.split(":");
    const shiftId = shiftIdStr === "null" ? null : parseInt(shiftIdStr);

    setDraftSchedules((prev) => ({
      ...prev,
      [pegawaiId]: {
        ...prev[pegawaiId],
        [day]: { shiftId, status },
      },
    }));
  };

  // Handle Auto Fill (Trigger Modal)
  const handleAutoFill = () => {
    if (!singleShift) return;
    setShowAutoFillModal(true);
  };

  // Eksekusi Auto Fill
  const confirmAutoFill = () => {
    setShowAutoFillModal(false);
    const autoFilled = {};
    pegawai.forEach((p) => {
      autoFilled[p.id_pegawai] = {};
      for (let day = 1; day <= daysInMonth; day++) {
        autoFilled[p.id_pegawai][day] = {
          shiftId: singleShift.id_shift,
          status: "shift",
        };
      }
    });
    setDraftSchedules((prev) => ({ ...prev, ...autoFilled }));
    toast.success(
      `Jadwal berhasil diisi otomatis dengan shift ${singleShift.kode_shift}`,
    );
  };

  // Handle Simpan (Trigger Modal)
  const handleSimpan = () => {
    let adaKosong = false;
    pegawai.forEach((p) => {
      for (let day = 1; day <= daysInMonth; day++) {
        const entry =
          draftSchedules[p.id_pegawai]?.[day] ?? schedules[p.id_pegawai]?.[day];
        if (!entry || !entry.status || entry.status === "belum_diisi") {
          adaKosong = true;
          break;
        }
      }
    });

    if (adaKosong) {
      setShowEmptyWarningModal(true);
    } else {
      setShowSaveModal(true);
    }
  };

  // Lanjut simpan setelah warning kosong
  const confirmSaveEmpty = () => {
    setShowEmptyWarningModal(false);
    setShowSaveModal(true);
  };

  // Eksekusi Simpan ke API
  const confirmSaveSchedule = async () => {
    setShowSaveModal(false);
    const schedulesPayload = [];
    pegawai.forEach((p) => {
      for (let day = 1; day <= daysInMonth; day++) {
        const entry =
          draftSchedules[p.id_pegawai]?.[day] ?? schedules[p.id_pegawai]?.[day];
        if (entry && entry.status && entry.status !== "belum_diisi") {
          schedulesPayload.push({
            pegawaiId: p.id_pegawai,
            tanggal: formatDate(currentYear, currentMonth, day),
            shiftId: entry.shiftId,
            status: entry.status,
          });
        }
      }
    });

    try {
      setSaving(true);
      setError(null);
      const response = await api.post(
        `/schedules/units/${unitId}/${currentYear}/${currentMonth}`,
        { schedules: schedulesPayload },
      );

      if (response.data.status === "success") {
        setDraftSchedules({});
        toast.success("✅ Jadwal berhasil disimpan!");
        navigate(`/admin/jadwal-unit/${currentYear}/${currentMonth}/units`);
      }
    } catch (err) {
      console.error("Error save schedule:", err);
      setError(err.response?.data?.message || "Gagal menyimpan jadwal");
      toast.error(
        "❌ " + (err.response?.data?.message || "Gagal menyimpan jadwal"),
      );
    } finally {
      setSaving(false);
    }
  };

  // Handle Batal (Trigger Modal jika ada perubahan)
  const handleBatal = () => {
    const hasChanges = Object.keys(draftSchedules).length > 0;
    if (hasChanges) {
      setShowCancelModal(true);
    } else {
      navigate(`/admin/jadwal-unit/${currentYear}/${currentMonth}/units`);
    }
  };

  // Eksekusi Batal
  const confirmCancel = () => {
    setShowCancelModal(false);
    navigate(`/admin/jadwal-unit/${currentYear}/${currentMonth}/units`);
  };

  // Filter pegawai berdasarkan pencarian
  const filteredPegawai = pegawai.filter((p) =>
    p.nama.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Gabungkan shift options
  const generalShifts = [
    { value: "null:libur", label: "L - Libur" },
    { value: "null:izin", label: "I - Izin" },
    { value: "null:cuti", label: "C - Cuti" },
  ];

  const allShifts = [
    ...shifts.map((s) => ({
      value: `${s.id_shift}:shift`,
      label: `${s.kode_shift} - ${s.nama_shift}`,
    })),
    ...generalShifts,
  ];

  const hasSingleShift = shifts.length === 1;
  const singleShift = hasSingleShift ? shifts[0] : null;

  const handleDownloadTemplate = async () => {
    try {
      const monthName = getMonthName(currentMonth);
      const filename = `Template_Jadwal_${unitName.replace(/\s+/g, "_")}_${monthName}_${currentYear}.xlsx`;
      const blob = await generateScheduleTemplate({
        pegawai,
        shifts,
        year: currentYear,
        month: currentMonth,
        unitName,
      });
      downloadExcel(blob, filename);
      toast.success("✅ Template berhasil diunduh!");
    } catch (err) {
      console.error("Error download template:", err);
      toast.error("❌ Gagal mengunduh template: " + err.message);
    }
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    if (!validTypes.includes(file.type) && !file.name.endsWith(".xlsx")) {
      toast.error("❌ Format file tidak valid. Gunakan file .xlsx");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("❌ Ukuran file terlalu besar. Maksimal 5MB");
      return;
    }
    try {
      setImporting(true);
      const result = await parseScheduleExcel(
        file,
        pegawai,
        shifts,
        currentYear,
        currentMonth,
      );
      setImportResult(result);
      setShowImportPreview(true);
    } catch (err) {
      console.error("Error parsing file:", err);
      toast.error("❌ Gagal membaca file: " + err.message);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleConfirmImport = () => {
    if (!importResult || !importResult.success) {
      toast.error(
        "❌ Tidak dapat mengimpor karena ada error. Silakan perbaiki file Excel.",
      );
      return;
    }
    try {
      const schedulesPayload = convertToPayload(
        importResult.data,
        currentYear,
        currentMonth,
      );
      setDraftSchedules((prev) => {
        const newDrafts = { ...prev };
        schedulesPayload.forEach((item) => {
          const { pegawaiId, tanggal, shiftId, status } = item;
          const day = new Date(tanggal).getDate();
          if (!newDrafts[pegawaiId]) newDrafts[pegawaiId] = {};
          newDrafts[pegawaiId][day] = { shiftId, status };
        });
        return newDrafts;
      });
      toast.success(
        `✅ Berhasil memuat ${schedulesPayload.length} data jadwal! Silakan periksa kembali dan klik tombol "Simpan".`,
      );
      setShowImportPreview(false);
      setImportResult(null);
    } catch (err) {
      console.error("Error mapping import to draft:", err);
      toast.error("❌ Gagal memuat data impor: " + err.message);
    }
  };

  // UI: Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
        <span className="ml-2 text-gray-600">Memuat data...</span>
      </div>
    );
  }

  // UI: Error
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
        <p className="font-medium">⚠️ Gagal memuat data</p>
        <p className="text-sm mt-1">{error}</p>
        <button
          onClick={fetchScheduleMatrix}
          className="mt-3 text-xs px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Coba Lagi
        </button>
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
              `/admin/jadwal-unit/${currentYear}/${currentMonth}/units`,
              { state: { periode: periodeName } },
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
        </button>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 border-b border-gray-200 pb-2">
            Jadwal Unit
          </h1>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-5 mt-5 text-sm">
          <div className="flex-1 relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <SearchIcon className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Cari nama pegawai..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none transition-colors"
            />
          </div>
          <div className="relative min-w-[200px]">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx,.xls"
              className="hidden"
            />
            <div className="flex gap-3 flex-wrap">
              {hasSingleShift && (
                <button
                  type="button"
                  onClick={handleAutoFill}
                  disabled={loading || saving}
                  className="flex items-center gap-2 px-4 py-3 bg-[#0984E3] text-white font-medium rounded-xl disabled:opacity-50"
                  title="Isi otomatis seluruh jadwal menggunakan shift yang tersedia"
                >
                  Isi Otomatis
                </button>
              )}
              <button
                onClick={handleDownloadTemplate}
                disabled={loading || pegawai.length === 0}
                className="flex items-center gap-2 px-4 py-3 border-2 border-[#0984E3] text-[#0984E3] font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <DownloadIcon />
                Unduh Template
              </button>
              <button
                onClick={handleImportClick}
                disabled={importing || saving}
                className="flex items-center gap-2 px-4 py-3 bg-[#0984E3] text-white font-medium rounded-xl disabled:opacity-50"
              >
                <UploadIcon />
                {importing ? "Memproses..." : "Impor Jadwal"}
              </button>
            </div>
          </div>
        </div>

        {/* tabel */}
        <div className="bg-white rounded shadow-lg overflow-hidden">
          <div className="max-h-[600px] overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-100 sticky top-0 z-10 shadow-sm h-12">
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
                        className="px-5 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[40px]"
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
                      {index + 1}.
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-800 font-medium">
                      <div className="flex justify-between items-center gap-2">
                        <span className="truncate">{pegawai.nama}</span>
                        <button
                          onClick={() =>
                            navigate(
                              `/admin/jadwal-unit/${currentYear}/${currentMonth}/units/${unitId}/pegawai/${pegawai.id_pegawai}/detail`,
                              {
                                state: {
                                  periode: periodeName,
                                  namaUnit: unitName,
                                  pegawai,
                                  year: currentYear,
                                  month: currentMonth,
                                },
                              },
                            )
                          }
                          className="p-1 bg-blue-500 rounded-full hover:bg-blue-600 transition-colors"
                          title="Lihat Detail Jadwal"
                        >
                          <ArrowRightIcon className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    </td>
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(
                      (day) => {
                        const source =
                          draftSchedules[pegawai.id_pegawai]?.[day] ??
                          schedules[pegawai.id_pegawai]?.[day];
                        const value =
                          source?.shiftId != null
                            ? `${source.shiftId}:${source.status}`
                            : `null:${source?.status ?? ""}`;
                        const schedule = schedules[pegawai.id_pegawai]?.[day];
                        const isSavedSchedule =
                          !draftSchedules[pegawai.id_pegawai]?.[day] &&
                          schedule &&
                          schedule.status &&
                          schedule.status !== "belum_diisi";

                        return (
                          <td key={day} className="px-1 py-1">
                            {isSavedSchedule ? (
                              <div
                                onClick={() => {
                                  setSelectedCell({
                                    pegawai,
                                    day,
                                    entry: source,
                                  });
                                  setShowModal(true);
                                }}
                                className="w-full py-1 text-xs border border-gray-200 rounded text-center cursor-pointer bg-gray-50 hover:bg-gray-100"
                              >
                                {source?.isEdited && (
                                  <span className="text-red-600 font-bold mr-1">
                                    *
                                  </span>
                                )}
                                {source?.kodeShift || source?.status || "-"}
                              </div>
                            ) : (
                              <select
                                value={value}
                                onChange={(e) =>
                                  handleJadwalChange(
                                    pegawai.id_pegawai,
                                    day,
                                    e.target.value,
                                  )
                                }
                                className="w-full py-1 text-xs border border-gray-200 rounded focus:outline-none cursor-pointer bg-white text-center"
                              >
                                <option value="">-</option>
                                {allShifts.map((shift) => (
                                  <option key={shift.value} value={shift.value}>
                                    {shift.label.split(" - ")[0]}
                                  </option>
                                ))}
                              </select>
                            )}
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

        {/* buttons */}
        <div className="flex justify-end gap-3 mt-5">
          <button
            type="button"
            onClick={handleBatal}
            disabled={saving}
            className="text-xs px-8 py-2 border-2 border-[#0984E3] text-[#0984E3] font-medium rounded-xl shadow-lg disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSimpan}
            disabled={saving}
            className="text-xs px-8 py-2 bg-[#0984E3] text-white font-medium rounded-xl shadow-lg disabled:opacity-50 flex items-center gap-2"
          >
            {saving && (
              <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></span>
            )}
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>

        {/* keterangan kode shift */}
        <div className="mb-5 p-4">
          <h3 className="font-medium text-gray-800 mb-3 text-xs">
            Keterangan :
          </h3>
          <div className="flex flex-col gap-2">
            {shifts.map((shift) => (
              <div key={shift.id_shift} className="flex items-center">
                <span className="w-10 px-2 py-1 bg-[#0984E3] text-white rounded font-semibold text-xs text-center">
                  {shift.kode_shift}
                </span>
                <span className="w-6 text-center text-sm text-gray-700">=</span>
                <span className="text-sm text-gray-700">
                  {shift.nama_shift}
                </span>
              </div>
            ))}
            {generalShifts.map((shift) => (
              <div key={shift.value} className="flex items-center">
                <span className="w-10 px-2 py-1 bg-gray-200 text-gray-800 rounded font-semibold text-xs text-center">
                  {shift.label.split(" - ")[0]}
                </span>
                <span className="w-6 text-center text-sm text-gray-700">=</span>
                <span className="text-sm text-gray-700">
                  {shift.label.split(" - ")[1]}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-800 mt-3">
            <span className="text-base text-red-600">*</span> = Dikoreksi (akan
            muncul jika ada perubahan data jadwal)
          </p>
        </div>
      </div>

      {/* Modal Preview Import */}
      {importResult && (
        <ImportPreviewModal
          open={showImportPreview}
          onClose={() => {
            setShowImportPreview(false);
            setImportResult(null);
          }}
          onConfirm={handleConfirmImport}
          parsedData={importResult.data}
          errors={importResult.errors}
          warnings={importResult.warnings}
          year={currentYear}
          month={currentMonth}
        />
      )}

      {/* modal pop up */}
      <EditJadwalModal
        open={showModal}
        pegawai={selectedCell?.pegawai}
        tanggal={`${String(selectedCell?.day).padStart(2, "0")} ${getMonthName(currentMonth)} ${currentYear}`}
        jadwalSaatIni={
          modalEntry?.kodeShift
            ? `${modalEntry.kodeShift} - ${modalEntry.namaShift || modalEntry.status}`
            : modalEntry?.status || "-"
        }
        shifts={allShifts}
        onClose={() => setShowModal(false)}
        onSave={async (data) => {
          const [shiftIdStr, status] = data.selected.split(":");
          const formData = new FormData();
          formData.append("jadwalId", selectedCell.entry.jadwalId);
          formData.append(
            "shiftId",
            shiftIdStr === "null" ? null : Number(shiftIdStr),
          );
          formData.append("status", status);
          formData.append("alasan", data.alasan);
          if (data.file) formData.append("buktiFile", data.file);
          try {
            await api.put("/schedules/edit", formData, {
              headers: { "Content-Type": "multipart/form-data" },
            });
            setShowModal(false);
            fetchScheduleMatrix();
            toast.success("✅ Jadwal berhasil diubah!");
          } catch (err) {
            console.error("Error:", err);
            toast.error("❌ Gagal mengubah jadwal");
          }
        }}
      />

      {/* Modal Konfirmasi */}
      <ModalConfirm
        isOpen={showAutoFillModal}
        onClose={() => setShowAutoFillModal(false)}
        onConfirm={confirmAutoFill}
        title="Isi Otomatis Jadwal?"
        message={`Seluruh jadwal akan diisi menggunakan shift ${singleShift?.kode_shift}.`}
        type="save"
        confirmText="Ya, Isi Otomatis"
      />
      <ModalConfirm
        isOpen={showEmptyWarningModal}
        onClose={() => setShowEmptyWarningModal(false)}
        onConfirm={confirmSaveEmpty}
        title="Masih Ada Tanggal Kosong"
        message="⚠️ Masih ada tanggal yang belum diisi. Apakah Anda yakin ingin tetap menyimpan?"
        type="cancel"
        confirmText="Tetap Simpan"
      />
      <ModalConfirm
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onConfirm={confirmSaveSchedule}
        title="Simpan Jadwal?"
        message="Apakah Anda yakin ingin menyimpan jadwal ini ke database?"
        type="save"
        confirmText="Ya, Simpan"
      />
      <ModalConfirm
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={confirmCancel}
        title="Batalkan Perubahan?"
        message="Perubahan yang sudah dibuat tidak akan disimpan."
        type="cancel"
        confirmText="Ya, Batalkan"
      />
    </div>
  );
};

export default JadwalUnitDetail;
