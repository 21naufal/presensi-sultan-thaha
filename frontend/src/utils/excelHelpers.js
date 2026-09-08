import ExcelJS from "exceljs";

// Helper: Mengubah nomor kolom menjadi huruf Excel (1 -> A, 27 -> AA)
const getColLetter = (colNum) => {
  let letter = "";
  while (colNum > 0) {
    const mod = (colNum - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    colNum = Math.floor((colNum - 1) / 26);
  }
  return letter;
};

// Generate template Excel untuk jadwal shift (Sheet Jadwal + Sheet Kode Shift)
export const generateScheduleTemplate = async ({
  pegawai,
  shifts,
  year,
  month,
  unitName,
}) => {
  const workbook = new ExcelJS.Workbook();
  const daysInMonth = new Date(year, month, 0).getDate();
  const monthName = [
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

  // SHEET 1: JADWAL UTAMA
  const wsSchedule = workbook.addWorksheet("Jadwal");
  const totalCols = daysInMonth + 2;

  // Header Judul
  wsSchedule.mergeCells(1, 1, 1, totalCols);
  wsSchedule.getCell("A1").value = `JADWAL SHIFT - ${unitName.toUpperCase()}`;
  wsSchedule.getCell("A1").font = { bold: true, size: 16 };
  wsSchedule.getCell("A1").alignment = {
    horizontal: "center",
    vertical: "middle",
  };

  // Header Periode
  wsSchedule.mergeCells(2, 1, 2, totalCols);
  wsSchedule.getCell("A2").value =
    `PERIODE: ${monthName.toUpperCase()} ${year}`;
  wsSchedule.getCell("A2").font = { bold: true, size: 13 };
  wsSchedule.getCell("A2").alignment = {
    horizontal: "center",
    vertical: "middle",
  };

  // Header Kolom (No, Nama, Tanggal)
  const headerValues = ["No", "Nama Pegawai"];
  for (let day = 1; day <= daysInMonth; day++) {
    headerValues.push(String(day).padStart(2, "0"));
  }

  const headerRow = wsSchedule.getRow(3);
  headerRow.values = headerValues;
  headerRow.eachCell((cell) => {
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

  // Data Pegawai dengan proteksi kolom
  pegawai.forEach((p, index) => {
    const rowValues = [index + 1, p.nama];
    for (let day = 1; day <= daysInMonth; day++) {
      rowValues.push("");
    }

    const row = wsSchedule.addRow(rowValues);

    row.eachCell((cell, colNumber) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
        bottom: { style: "thin" },
      };

      // Kunci kolom No & Nama, buka kolom Tanggal untuk diedit
      if (colNumber <= 2) {
        cell.protection = { locked: true };
        cell.alignment = {
          horizontal: colNumber === 1 ? "center" : "left",
          vertical: "middle",
        };
      } else {
        cell.protection = { locked: false };
        cell.alignment = { horizontal: "center", vertical: "middle" };
      }
    });
  });

  // Set lebar kolom
  wsSchedule.getColumn(1).width = 5;
  wsSchedule.getColumn(2).width = 30;
  for (let i = 3; i <= totalCols; i++) {
    wsSchedule.getColumn(i).width = 6;
  }

  // Tambahkan dropdown untuk validasi input kode shift
  const shiftCodes = [...shifts.map((s) => s.kode_shift), "L", "I", "C"];

  if (pegawai.length > 0 && daysInMonth > 0) {
    const startCell = `${getColLetter(3)}4`;
    const endCell = `${getColLetter(2 + daysInMonth)}${3 + pegawai.length}`;
    const range = `${startCell}:${endCell}`;

    wsSchedule.dataValidations.add(range, {
      type: "list",
      allowBlank: true,
      formulae: [`"${shiftCodes.join(",")}"`],
      showErrorMessage: true,
      errorTitle: "Kode Shift Tidak Valid",
      error: "Silakan pilih kode shift dari dropdown yang tersedia.",
      showInputMessage: true,
      promptTitle: "Pilih Shift",
      prompt: "Pilih kode shift dari daftar.",
    });
  }

  // Proteksi sheet jadwal
  await wsSchedule.protect("password_jadwal_123");

  // SHEET 2: REFERENSI KODE SHIFT
  const wsShiftRef = workbook.addWorksheet("Kode_Shift");

  // Header Sheet 2
  wsShiftRef.mergeCells("A1:D1");
  const titleCell = wsShiftRef.getCell("A1");
  titleCell.value = `Daftar Shift Unit ${unitName}`;
  titleCell.font = { bold: true, size: 16 };
  titleCell.alignment = { horizontal: "left", vertical: "middle" };

  wsShiftRef.mergeCells("A3:D3");
  const subtitleCell = wsShiftRef.getCell("A3");
  subtitleCell.value = `Berikut daftar Jadwal Shift yang tersedia untuk unit ${unitName}`;
  subtitleCell.font = { size: 11, italic: true };
  subtitleCell.alignment = { horizontal: "left", vertical: "middle" };

  // Tabel data shift
  const headerShiftRow = wsShiftRef.getRow(5);
  headerShiftRow.values = ["Kode", "Nama Shift", "Jam Mulai", "Jam Selesai"];
  headerShiftRow.font = { bold: true, size: 11 };
  headerShiftRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD9E2F3" },
    };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
      bottom: { style: "thin" },
    };
    cell.alignment = { horizontal: "center", vertical: "middle" };
  });

  // Data kode shift
  const shiftData = [
    ...shifts.map((s) => [
      s.kode_shift,
      s.nama_shift,
      s.jam_mulai || "-",
      s.jam_selesai || "-",
    ]),
    ["L", "Libur", "-", "-"],
    ["I", "Izin", "-", "-"],
    ["C", "Cuti", "-", "-"],
  ];

  shiftData.forEach((rowData, index) => {
    const r = wsShiftRef.getRow(6 + index);
    r.values = rowData;
    r.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
        bottom: { style: "thin" },
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });
  });

  // Set lebar kolom
  wsShiftRef.getColumn(1).width = 10;
  wsShiftRef.getColumn(2).width = 30;
  wsShiftRef.getColumn(3).width = 15;
  wsShiftRef.getColumn(4).width = 15;

  // Proteksi sheet kode shift
  await wsShiftRef.protect("password_jadwal_123");

  // Export ke format Blob
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
};

// Download file Excel di browser
export const downloadExcel = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Membaca dan memvalidasi file Excel yang di-upload user
export const parseScheduleExcel = async (
  file,
  pegawai,
  shifts,
  year,
  month,
) => {
  const daysInMonth = new Date(year, month, 0).getDate();

  const errors = [];
  const warnings = [];
  const parsedData = [];

  try {
    const buffer = await file.arrayBuffer();

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    // Cari sheet "Jadwal"
    let worksheet = workbook.getWorksheet("Jadwal");

    if (!worksheet) {
      worksheet = workbook.worksheets.find(
        (ws) => ws.name.toLowerCase() === "jadwal",
      );
    }

    if (!worksheet) {
      return {
        success: false,
        data: [],
        errors: [
          "Sheet 'Jadwal' tidak ditemukan. Pastikan menggunakan template yang benar.",
        ],
        warnings: [],
      };
    }

    // Cari baris header (No | Nama Pegawai)
    let headerRowNumber = -1;

    for (let i = 1; i <= Math.min(10, worksheet.rowCount); i++) {
      const row = worksheet.getRow(i);

      const col1 = row.getCell(1).text.trim().toLowerCase();
      const col2 = row.getCell(2).text.trim().toLowerCase();

      if (col1.includes("no") && col2.includes("nama")) {
        headerRowNumber = i;
        break;
      }
    }

    if (headerRowNumber === -1) {
      return {
        success: false,
        data: [],
        errors: [
          "Header tidak ditemukan. Pastikan template berasal dari sistem.",
        ],
        warnings: [],
      };
    }

    // Validasi jumlah kolom
    const expectedColumns = 2 + daysInMonth;
    const headerRow = worksheet.getRow(headerRowNumber);

    if (headerRow.cellCount < expectedColumns) {
      warnings.push(
        `Jumlah kolom tanggal tidak sesuai. Ditemukan ${headerRow.cellCount - 2} kolom tanggal, seharusnya ${daysInMonth}.`,
      );
    }

    // Mapping kode shift yang valid
    const validShiftCodes = new Set([
      ...shifts.map((s) => s.kode_shift.toUpperCase()),
      "L",
      "I",
      "C",
    ]);

    // Mapping data pegawai untuk pencarian cepat
    const pegawaiMap = new Map();

    pegawai.forEach((p) => {
      pegawaiMap.set(p.nama.trim().toLowerCase(), p);

      if (p.nip) {
        pegawaiMap.set(p.nip.toString().trim(), p);
      }

      pegawaiMap.set(String(p.id_pegawai), p);
    });

    // Parse data jadwal per pegawai
    for (
      let rowNumber = headerRowNumber + 1;
      rowNumber <= worksheet.rowCount;
      rowNumber++
    ) {
      const row = worksheet.getRow(rowNumber);
      const nama = row.getCell(2).text.trim();

      if (!nama) continue;

      const matchedPegawai = pegawaiMap.get(nama.toLowerCase());

      if (!matchedPegawai) {
        errors.push(
          `Baris ${rowNumber}: Pegawai "${nama}" tidak ditemukan di sistem.`,
        );
        continue;
      }

      const jadwalPerTanggal = [];

      // Baca jadwal per tanggal
      for (let day = 1; day <= daysInMonth; day++) {
        const cell = row.getCell(day + 2);
        let kodeShift = cell.text.trim().toUpperCase();

        if (!kodeShift) {
          jadwalPerTanggal.push({
            day,
            kodeShift: null,
            status: null,
            shiftId: null,
            isValid: false,
            error: "Kosong",
          });
          continue;
        }

        if (!validShiftCodes.has(kodeShift)) {
          errors.push(
            `${matchedPegawai.nama} tanggal ${String(day).padStart(2, "0")}: kode "${kodeShift}" tidak valid.`,
          );
          jadwalPerTanggal.push({
            day,
            kodeShift,
            status: null,
            shiftId: null,
            isValid: false,
            error: "Kode tidak valid",
          });
          continue;
        }

        let status = "shift";
        let shiftId = null;

        // Tentukan status atau cari ID shift
        switch (kodeShift) {
          case "L":
            status = "libur";
            break;
          case "I":
            status = "izin";
            break;
          case "C":
            status = "cuti";
            break;
          default: {
            const shift = shifts.find(
              (s) => s.kode_shift.toUpperCase() === kodeShift,
            );

            if (!shift) {
              errors.push(
                `${matchedPegawai.nama} tanggal ${String(day).padStart(2, "0")}: shift "${kodeShift}" tidak ditemukan.`,
              );
              jadwalPerTanggal.push({
                day,
                kodeShift,
                status: null,
                shiftId: null,
                isValid: false,
                error: "Shift tidak ditemukan",
              });
              continue;
            }

            shiftId = shift.id_shift;
          }
        }

        jadwalPerTanggal.push({
          day,
          kodeShift,
          status,
          shiftId,
          isValid: true,
        });
      }

      parsedData.push({
        pegawai: matchedPegawai,
        jadwal: jadwalPerTanggal,
      });
    }

    // Cek pegawai yang tidak ada di file Excel
    const importedIds = new Set(
      parsedData.map((item) => item.pegawai.id_pegawai),
    );

    pegawai.forEach((p) => {
      if (!importedIds.has(p.id_pegawai)) {
        warnings.push(`Pegawai "${p.nama}" tidak ditemukan pada file Excel.`);
      }
    });

    return {
      success: errors.length === 0,
      data: parsedData,
      errors,
      warnings,
    };
  } catch (err) {
    console.error("Error parsing Excel:", err);

    return {
      success: false,
      data: [],
      errors: [`Gagal membaca file: ${err.message}`],
      warnings: [],
    };
  }
};

// Konversi hasil parse ke format JSON untuk dikirim ke API
export const convertToPayload = (parsedData, year, month) => {
  const schedulesPayload = [];

  parsedData.forEach(({ pegawai, jadwal }) => {
    jadwal.forEach(({ day, shiftId, status, isValid }) => {
      if (!isValid || !status) return;

      const tanggal = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      schedulesPayload.push({
        pegawaiId: pegawai.id_pegawai,
        tanggal,
        shiftId: shiftId,
        status: status,
      });
    });
  });

  return schedulesPayload;
};
