// Menghitung estimasi durasi kerja untuk ditampilkan di UI (UX preview)
export const calculateDurationPreview = (start, end) => {
  // Kembalikan "-" jika waktu mulai atau selesai belum diisi
  if (!start || !end) return "-";

  // Pisah dan konversi format "HH:MM" menjadi angka jam dan menit
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);

  // Ubah total waktu menjadi satuan menit agar mudah dihitung
  let startMinutes = sh * 60 + sm;
  let endMinutes = eh * 60 + em;

  // Penanganan shift malam: jika waktu selesai <= waktu mulai, berarti melewati tengah malam
  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60;
  }

  // Hitung selisih menit, lalu konversi kembali ke format jam dan menit
  const diff = endMinutes - startMinutes;
  const hours = Math.floor(diff / 60);
  const minutes = diff % 60;

  return `${hours} jam ${minutes.toString().padStart(2, "0")} menit`;
};
