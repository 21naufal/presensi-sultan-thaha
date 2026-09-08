import { useState, useEffect } from "react";

// Format waktu digital (HH:MM:SS) zona WIB
export const formatTime = (date = new Date()) => {
  return date.toLocaleTimeString("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

// Format tanggal lengkap (Hari, DD Bulan YYYY) zona WIB
export const formatDate = (date = new Date()) => {
  const options = {
    timeZone: "Asia/Jakarta",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return date.toLocaleDateString("id-ID", options);
};

// Format bulan dan tahun (contoh: "Januari 2026")
export const formatMonthYear = (date = new Date()) => {
  return date.toLocaleDateString("id-ID", {
    timeZone: "Asia/Jakarta",
    month: "long",
    year: "numeric",
  });
};

// Format tanggal khusus untuk tampilan riwayat/history
export const formatDateForHistory = (date = new Date()) => {
  const options = {
    timeZone: "Asia/Jakarta",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return date.toLocaleDateString("id-ID", options);
};

// Mendapatkan nama bulan saja (contoh: "Januari")
export const getMonthName = (date = new Date()) => {
  return date.toLocaleDateString("id-ID", {
    timeZone: "Asia/Jakarta",
    month: "long",
  });
};

// Hook untuk mendapatkan waktu real-time (update setiap 1 detik)
export const useCurrentTime = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return currentTime;
};

// Menentukan sapaan dinamis (Pagi/Siang/Sore/Malam) berdasarkan jam WIB
export const getGreeting = (date = new Date()) => {
  const hour = parseInt(
    date.toLocaleTimeString("id-ID", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      hour12: false,
    }),
  );

  if (hour >= 4 && hour < 12) return "Selamat Pagi ☀️";
  if (hour >= 12 && hour < 15) return "Selamat Siang 🌤️";
  if (hour >= 15 && hour < 19) return "Selamat Sore 🌅";
  return "Selamat Malam 🌙";
};

// Konversi Date/ISO ke format YYYY-MM-DD (wajib untuk <input type="date">)
export const formatDateForInput = (dateValue) => {
  if (!dateValue) return "";
  if (typeof dateValue === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return dateValue;
  }

  const date = new Date(dateValue);
  if (isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// Konversi format YYYY-MM-DD ke ISO String (untuk dikirim ke backend)
export const formatDateForAPI = (dateString) => {
  if (!dateString) return null;
  return `${dateString}T00:00:00.000Z`;
};

// Mendapatkan objek Date saat ini yang sudah disesuaikan ke zona waktu WIB
export const getWIBDate = () => {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }),
  );
};
