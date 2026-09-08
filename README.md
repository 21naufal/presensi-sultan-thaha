<table>
<tr>
<td width="50%" valign="top">

# Presensi Sultan Thaha

Sistem presensi karyawan berbasis web dengan verifikasi **Liveness Face Recognition** dan **Fake GPS Detection (validasi lokasi GPS)**, dilengkapi manajemen jadwal, shift, unit kerja, dan rekap kehadiran untuk Admin maupun Pegawai.

**Fitur Utama**
- Presensi dengan verifikasi wajah (face-api.js) + validasi lokasi GPS
- Manajemen jadwal kerja per periode (bulan) per unit
- Manajemen shift & pemetaan shift ke unit
- Manajemen unit kerja
- Rekap & riwayat presensi (matrix per unit, detail per pegawai)
- Log aktivitas/audit trail
- Ekspor data presensi ke Excel & PDF

**Teknologi :** `React (Vite)` `TailwindCSS` `face-api.js` `Node.js` `Express.js` `MySQL`

---

## Developer

- **Naufal Septrio Akbar** — Fullstack Developer
- **Asirman Jaya** — System Analyst & UI/UX Design

</td>
<td width="50%" valign="top">

### 🎥 Demo Aplikasi

<img width="662" height="327" alt="Image" src="https://github.com/user-attachments/assets/29a7da84-0807-49a6-b516-a7a869481c4e" />

<img width="491" height="325" alt="Image" src="https://github.com/user-attachments/assets/a9641667-08f6-4c49-b3e9-f208d78ff0ff" />

<img width="582" height="290" alt="Image" src="https://github.com/user-attachments/assets/5983675a-9892-4627-b690-bf1d8621edc5" />

<img width="583" height="577" alt="Image" src="https://github.com/user-attachments/assets/adbeacfa-e1f7-4c66-a4ee-ac648cd4467b" />

<img width="672" height="390" alt="Image" src="https://github.com/user-attachments/assets/a4d1a9ee-0619-499d-a1ec-7d9f9dfbc4b9" />

</td>
</tr>
</table>

---

## Instalasi Lokal

### 1. Clone repository

```bash
git clone https://github.com/21naufal/presensi-sultan-thaha.git
cd presensi-sultan-thaha
```

### 2. Setup Database

Buat database MySQL dengan mengimpor `databasesistem.sql` yang ada di root project:

```bash
mysql -u root -p < databasesistem.sql
```

Perintah ini otomatis membuat seluruh tabel yang dibutuhkan (`users`, `pegawai`, `unit`, `shift`, `jadwal`, `presensi`, `data_wajah`, `lokasi`, `log`, dan lainnya).

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

Server akan berjalan di `http://localhost:5000`.

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
```

Jalankan aplikasi:

```bash
npm run dev
```

Frontend akan berjalan di `https://localhost:5173` (HTTPS lokal otomatis dari `vite-plugin-mkcert`, dibutuhkan agar browser mengizinkan akses kamera untuk fitur face recognition). Saat pertama kali dijalankan, browser mungkin meminta izin instalasi sertifikat lokal — terima saja agar HTTPS berjalan normal.

Izinkan akses **kamera** dan **lokasi** saat diminta browser agar fitur presensi wajah & validasi GPS berfungsi.

## Lisensi

Proyek ini bebas digunakan untuk pembelajaran atau pengembangan lanjutan. Tidak untuk dikomersialisasikan tanpa izin.
