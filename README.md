# Presensi Sultan Thaha

Sistem presensi karyawan berbasis web dengan verifikasi **Face Recognition** dan **validasi lokasi (GPS)**, dilengkapi manajemen jadwal, shift, unit kerja, dan rekap kehadiran untuk Admin maupun Pegawai.

**Fitur Utama**

- Login dengan username/no. HP, lupa kata sandi via OTP email
- Presensi dengan verifikasi wajah (face-api.js) + validasi lokasi GPS
- Manajemen jadwal kerja per periode (bulan) per unit
- Manajemen shift & pemetaan shift ke unit
- Manajemen unit kerja
- Manajemen data & profil pegawai (foto profil, ganti password)
- Rekap & riwayat presensi (matrix per unit, detail per pegawai)
- Log aktivitas/audit trail
- Ekspor data presensi ke Excel & PDF

**Teknologi**

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![MUI](https://img.shields.io/badge/MUI-007FFF?style=for-the-badge&logo=mui&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-5FA04E?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

---

## Instalasi Lokal

### 1. Clone repository

```bash
git clone https://github.com/<username-kamu>/presensi-sultan-thaha.git
cd presensi-sultan-thaha
```

### 2. Setup Database

> ⚠️ Project ini belum menyertakan file skema database. Buat databasenya lebih dulu, lalu import `schema.sql` (export dari database lokal kamu) sebelum lanjut ke langkah berikut:
>
> ```bash
> mysqldump -u root -p --no-data nama_database_lokal_kamu > schema.sql
> mysql -u root -p -e "CREATE DATABASE presensi_sultan_thaha"
> mysql -u root -p presensi_sultan_thaha < schema.sql
> ```

### 3. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Isi `.env` dengan kredensial database, JWT secret, dan akun email (untuk fitur OTP lupa password) milikmu sendiri.

Jalankan server:

```bash
npm run dev
```

Server berjalan di `http://localhost:5000`.

### 4. Buat Akun Admin Pertama

Belum ada halaman registrasi publik. Generate hash password dengan script yang sudah tersedia:

```bash
node scripts/generateHash.js
```

Salin hash yang dihasilkan, lalu insert manual ke tabel `users` di database (sesuaikan dengan struktur tabel `users` & `pegawai` milikmu, termasuk `role = 'admin'`).

### 5. Frontend

```bash
cd ../frontend
npm install
cp .env.example .env
npm run dev
```

Frontend berjalan di `https://localhost:5173` (HTTPS lokal otomatis dari `vite-plugin-mkcert`, dibutuhkan agar browser mengizinkan akses kamera untuk fitur face recognition). Saat pertama kali dijalankan, browser mungkin meminta izin instalasi sertifikat lokal — terima saja agar HTTPS berjalan normal.

Izinkan akses **kamera** dan **lokasi** saat diminta browser agar fitur presensi wajah & validasi GPS berfungsi.

## Lisensi

Proyek ini bebas digunakan untuk pembelajaran atau pengembangan lanjutan. Tidak untuk dikomersialisasikan tanpa izin.

## Developer

<!-- Lengkapi dengan nama kamu / tim pengembang -->

**Naufal Septrio Akbar** — Fullstack Developer
