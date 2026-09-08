const { success, error, serverError } = require("../utils/responseHelper");
const dashboardModel = require("../models/dashboardModel");
const { getWIBDate } = require("../utils/dateHelper");

// Ambil data presensi hari ini untuk dashboard admin
exports.getTodayDashboard = async (req, res) => {
  try {
    const today = getWIBDate();

    const [activities, summary, units] = await Promise.all([
      dashboardModel.getTodayAttendance(today),
      dashboardModel.getTodaySummary(today),
      dashboardModel.getUnitList(),
    ]);

    // Waktu sekarang untuk perhitungan noCheckout
    const now = new Date();
    const currentDateTime = now.getTime();

    const formattedActivities = activities.map((item) => {
      // Hitung noCheckout otomatis (1 jam sebelum shift besok)
      let showNoCheckout = false;

      if (item.jam_masuk && !item.jam_keluar && item.jam_masuk_besok) {
        const tanggalJadwal = new Date(today);
        const [besokHour, besokMin, besokSec = 0] = item.jam_masuk_besok
          .split(":")
          .map(Number);

        let batasHour = besokHour - 1;
        let batasTanggal = new Date(tanggalJadwal);

        if (batasHour < 0) {
          batasHour = 23;
        } else {
          batasTanggal.setDate(batasTanggal.getDate() + 1);
        }

        const waktuBatas = new Date(
          batasTanggal.getFullYear(),
          batasTanggal.getMonth(),
          batasTanggal.getDate(),
          batasHour,
          besokMin,
          besokSec,
        );

        if (currentDateTime >= waktuBatas.getTime()) {
          showNoCheckout = true;
        }
      } else if (item.jam_masuk && !item.jam_keluar && !item.jam_masuk_besok) {
        // Fallback: tidak ada shift besok → +12 jam dari jam_selesai
        if (item.jam_selesai) {
          const [endHour, endMin] = item.jam_selesai.split(":").map(Number);
          const tanggalJadwal = new Date(today);
          const isNightShift =
            endHour < parseInt(item.jam_mulai?.split(":")[0] || "0");
          const tanggalSelesai = new Date(tanggalJadwal);
          if (isNightShift)
            tanggalSelesai.setDate(tanggalSelesai.getDate() + 1);

          const waktuBatas = new Date(
            tanggalSelesai.getFullYear(),
            tanggalSelesai.getMonth(),
            tanggalSelesai.getDate(),
            endHour + 12,
            endMin,
            0,
          );

          if (currentDateTime >= waktuBatas.getTime()) {
            showNoCheckout = true;
          }
        }
      }

      const finalNoCheckout = showNoCheckout || item.no_checkout === 1;

      // Tentukan status display dengan logika lengkap
      let statusDisplay = "-";
      let statusType = "unknown";

      if (item.jadwal_status === "libur") {
        statusDisplay = "Libur";
        statusType = "libur";
      } else if (item.jadwal_status === "izin") {
        statusDisplay = "Izin";
        statusType = "izin";
      } else if (item.jadwal_status === "cuti") {
        statusDisplay = "Cuti";
        statusType = "cuti";
      } else if (item.jadwal_status === "shift") {
        // Cek status presensi
        if (!item.jam_masuk) {
          statusDisplay = "Belum Presensi";
          statusType = "absent";
        } else {
          // Status dasar berdasarkan check-in
          let statusDasar = "Hadir";
          if (item.status_presensi === "terlambat") {
            statusDasar = "Terlambat";
          }

          // Keterangan tambahan berdasarkan check-out
          let keteranganTambahan = "";

          if (item.is_overtime === 1 || item.keterangan_sistem === "+") {
            keteranganTambahan = "Lembur";
          } else if (item.keterangan_sistem === "!") {
            keteranganTambahan = "Melebihi Jam";
          } else if (item.keterangan_sistem === "-" || finalNoCheckout) {
            keteranganTambahan = "Tidak Presensi Pulang";
          }

          // Gabungkan status dasar + keterangan tambahan
          if (keteranganTambahan) {
            statusDisplay = `${statusDasar} | ${keteranganTambahan}`;
            statusType = statusDasar === "Terlambat" ? "late" : "ontime";
          } else {
            statusDisplay = statusDasar;
            statusType = statusDasar === "Terlambat" ? "late" : "ontime";
          }
        }
      }

      // Format jam
      const formatJam = (jam) => {
        if (!jam) return "-";
        return new Date(jam).toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
      };

      const formatJamShift = (jam) => {
        if (!jam) return "-";
        return jam.substring(0, 5);
      };

      return {
        id: item.id_pegawai,
        pegawaiId: item.id_pegawai,
        nama: item.nama,
        unit: item.nama_unit,
        jadwalStatus: item.jadwal_status,
        namaShift: item.nama_shift || "-",
        jamMulaiShift: formatJamShift(item.jam_mulai),
        jamSelesaiShift: formatJamShift(item.jam_selesai),
        waktuShift: item.jam_mulai
          ? `${formatJamShift(item.jam_mulai)} - ${formatJamShift(item.jam_selesai)}`
          : "-",
        statusDisplay,
        statusType,
        jamMasuk: formatJam(item.jam_masuk),
        jamPulang: formatJam(item.jam_keluar),
        fotoMasuk: item.foto_masuk || null,
        fotoKeluar: item.foto_keluar || null,
        fotoProfil: item.foto_profil || null,
        lokasi: item.nama_lokasi || "-",
        latitude: item.lokasi_masuk_latitude,
        longitude: item.lokasi_masuk_longitude,
        tanggal: new Date().toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }),
      };
    });

    const unitOptions = ["Semua Unit", ...units.map((u) => u.nama_unit)];

    return success(res, "Data dashboard hari ini berhasil diambil", {
      summary,
      activities: formattedActivities,
      units: unitOptions,
      tanggal: today,
    });
  } catch (err) {
    console.error("[getTodayDashboard] Error:", err);
    return serverError(res, err, "getTodayDashboard");
  }
};
