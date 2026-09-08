// Mendapatkan jumlah total hari dalam satu bulan
export const getDaysInMonth = (year, month) =>
  new Date(year, month, 0).getDate();

// Mendapatkan nama bulan dalam bahasa Indonesia (1 -> Januari)
export const getMonthName = (month) =>
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

// Format tanggal ke format standar YYYY-MM-DD
export const formatDate = (year, month, day) =>
  `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
