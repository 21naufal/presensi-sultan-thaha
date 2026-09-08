import { useState, useMemo } from "react";
import {
  BackIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  SearchIcon,
} from "../../components/icons/SystemIcons";

// Komponen Accordion untuk setiap seksi panduan
const Section = ({ title, children }) => {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 ${
        !open ? "border-l-4 border-l-[#0984E3]" : ""
      }`}
    >
      {/* Header section */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <span className="font-semibold text-gray-800 text-sm">{title}</span>
        {open ? (
          <ChevronUpIcon className="w-4 h-4 text-gray-600" />
        ) : (
          <ChevronDownIcon className="w-4 h-4 text-gray-600" />
        )}
      </button>

      {/* Content */}
      {open && (
        <div className="px-4 py-4 text-sm text-gray-700 space-y-3 border-t border-gray-200">
          {children}
        </div>
      )}
    </div>
  );
};

// Sub-langkah bergaya numbered list
const Step = ({ number, text }) => (
  <div className="flex items-start gap-3">
    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#0984E3] text-white text-xs flex items-center justify-center font-bold">
      {number}
    </span>
    <p className="text-sm text-gray-700 leading-relaxed">{text}</p>
  </div>
);

// Badge keterangan status
const Badge = ({ color, label }) => {
  const colors = {
    green: "bg-green-200 text-green-800",
    yellow: "bg-yellow-400 text-yellow-900",
    red: "bg-red-500 text-white",
    gray: "bg-gray-300 text-gray-800",
    blue: "bg-blue-200 text-blue-800",
    emerald: "bg-emerald-200 text-emerald-800",
  };
  return (
    <span
      className={`inline-flex px-3 py-0.5 rounded-full text-xs font-medium ${colors[color]}`}
    >
      {label}
    </span>
  );
};

// kotak informasi
const InfoBox = ({ children }) => (
  <div className="bg-blue-100 px-4 py-3 text-sm text-gray-700">{children}</div>
);

// kotak peringatan
const WarnBox = ({ children }) => (
  <div className="bg-yellow-100 px-4 py-3 text-sm text-gray-700">
    {children}
  </div>
);

// sub heading
const SubHeading = ({ children }) => (
  <h3 className="font-semibold text-gray-800 text-sm mt-4 mb-2">{children}</h3>
);

const Panduan = () => {
  const [searchQuery, setSearchQuery] = useState("");

  // Data seksi panduan agar bisa difilter
  const sections = [
    {
      id: "login",
      title: "1. Masuk & Keluar Sistem",
      keywords: [
        "masuk",
        "keluar",
        "login",
        "logout",
        "username",
        "kata sandi",
        "password",
        "profil",
        "autentikasi",
        "akun",
        "sign in",
        "sign out",
      ],
      content: (
        <>
          <SubHeading>Cara Masuk (Login)</SubHeading>
          <div className="space-y-3">
            <Step
              number="1"
              text="Buka aplikasi di browser. Halaman login akan tampil secara otomatis."
            />
            <Step
              number="2"
              text="Masukkan Nama Pengguna (username) atau Nomor HP pada kolom pertama."
            />
            <Step
              number="3"
              text="Masukkan Kata Sandi pada kolom kedua. Klik ikon mata untuk menampilkan atau menyembunyikan sandi."
            />
            <Step
              number="4"
              text="Klik tombol MASUK. Jika berhasil, Anda akan diarahkan ke halaman Beranda admin."
            />
          </div>
          <WarnBox>
            Jika muncul pesan error, periksa kembali username/No. HP dan kata
            sandi yang dimasukkan.
          </WarnBox>

          <SubHeading>Cara Keluar (Logout)</SubHeading>
          <div className="space-y-3">
            <Step number="1" text="Klik menu Profil pada sidebar kiri." />
            <Step number="2" text="Klik tombol Keluar di halaman profil." />
            <Step
              number="3"
              text="Anda akan diarahkan kembali ke halaman login."
            />
          </div>
        </>
      ),
    },
    {
      id: "beranda",
      title: "2. Beranda (Dashboard)",
      keywords: [
        "beranda",
        "dashboard",
        "kehadiran",
        "real-time",
        "statistik",
        "terlambat",
        "tanpa keterangan",
        "alpa",
        "total karyawan",
        "filter",
        "pencarian",
        "foto presensi",
        "shift",
      ],
      content: (
        <>
          <p className="text-gray-700">
            Halaman Beranda menampilkan ringkasan kehadiran pegawai secara
            real-time untuk hari ini.
          </p>

          <SubHeading>Ringkasan Statistik</SubHeading>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            <li>
              <span className="font-semibold text-blue-700">
                Total Karyawan
              </span>{" "}
              — jumlah seluruh pegawai yang terdaftar di sistem.
            </li>
            <li>
              <span className="font-semibold text-yellow-700">
                Total Terlambat
              </span>{" "}
              — jumlah pegawai yang presensi masuk melebihi jam mulai shift hari
              ini.
            </li>
            <li>
              <span className="font-semibold text-red-700">
                Tanpa Keterangan
              </span>{" "}
              — jumlah pegawai yang tidak hadir tanpa keterangan (alpa) hari
              ini.
            </li>
          </ul>

          <SubHeading>Tabel Kehadiran Hari Ini</SubHeading>
          <p className="text-gray-700">
            Tabel menampilkan semua pegawai yang memiliki jadwal shift hari ini
            beserta kolom:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
            <li>Nama Pegawai &amp; Unit</li>
            <li>Jadwal Shift (jam mulai – jam selesai)</li>
            <li>Status kehadiran</li>
            <li>Jam Masuk &amp; Jam Pulang</li>
            <li>Foto presensi (klik untuk melihat detail)</li>
            <li>Lokasi presensi</li>
          </ul>

          <SubHeading>Keterangan Warna Status</SubHeading>
          <div className="flex flex-wrap gap-2 mt-1">
            <Badge color="green" label="Hadir (Tepat Waktu)" />
            <Badge color="yellow" label="Terlambat" />
            <Badge color="red" label="Tanpa Keterangan" />
            <Badge color="gray" label="Libur" />
            <Badge color="blue" label="Izin" />
            <Badge color="emerald" label="Cuti" />
          </div>

          <SubHeading>Filter &amp; Pencarian</SubHeading>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            <li>
              Gunakan kolom{" "}
              <span className="font-semibold">Cari nama pegawai...</span> untuk
              mencari pegawai tertentu.
            </li>
            <li>
              Gunakan dropdown <span className="font-semibold">Semua Unit</span>{" "}
              untuk menyaring tampilan berdasarkan unit kerja.
            </li>
          </ul>
          <InfoBox>
            Data dashboard diperbarui otomatis setiap 30 detik. Klik foto
            pegawai untuk melihat detail presensi lengkap.
          </InfoBox>
        </>
      ),
    },
    {
      id: "unit-kerja",
      title: "3. Unit Kerja",
      keywords: [
        "unit kerja",
        "divisi",
        "geofencing",
        "koordinat",
        "lokasi",
        "pin",
        "radius",
        "tambah",
        "edit",
        "hapus",
      ],
      content: (
        <>
          <p className="text-gray-700">
            Menu Unit Kerja digunakan untuk mengelola daftar unit/divisi yang
            ada di lingkungan kerja beserta lokasi presensinya (titik koordinat
            geofencing).
          </p>

          <SubHeading>Menambah Unit Kerja</SubHeading>
          <div className="space-y-3">
            <Step number="1" text="Klik menu Unit Kerja pada sidebar." />
            <Step
              number="2"
              text="Klik tombol + Tambah Unit Kerja di pojok kanan atas."
            />
            <Step number="3" text="Isi Nama Unit Kerja." />
            <Step
              number="4"
              text="Atur lokasi presensi menggunakan peta interaktif — geser pin ke posisi kantor/lokasi kerja."
            />
            <Step
              number="5"
              text="Tentukan radius area presensi (dalam meter)."
            />
            <Step number="6" text="Klik tombol Simpan." />
          </div>

          <SubHeading>Mengedit Unit Kerja</SubHeading>
          <div className="space-y-3">
            <Step
              number="1"
              text="Pada tabel Unit Kerja, klik ikon pensil (edit) di kolom Aksi pada baris unit yang ingin diubah."
            />
            <Step
              number="2"
              text="Ubah data yang diperlukan, lalu klik Simpan."
            />
          </div>

          <SubHeading>Menghapus Unit Kerja</SubHeading>
          <div className="space-y-3">
            <Step
              number="1"
              text="Klik ikon tempat sampah (hapus) di kolom Aksi."
            />
            <Step
              number="2"
              text="Konfirmasi penghapusan pada dialog yang muncul dengan mengklik Ya, Hapus."
            />
          </div>
          <WarnBox>
            Unit kerja yang dihapus tidak dapat dikembalikan. Pastikan tidak ada
            pegawai atau shift aktif yang terhubung sebelum menghapus.
          </WarnBox>

          <SubHeading>Pencarian</SubHeading>
          <p className="text-gray-700">
            Gunakan kolom pencarian di atas tabel untuk mencari unit berdasarkan
            nama atau lokasi.
          </p>
        </>
      ),
    },
    {
      id: "shift-unit",
      title: "4. Shift Unit",
      keywords: [
        "shift",
        "jam kerja",
        "shift pagi",
        "shift siang",
        "jadwal",
        "tambah shift",
        "edit shift",
        "hapus shift",
        "filter unit",
      ],
      content: (
        <>
          <p className="text-gray-700">
            Menu Shift Unit digunakan untuk mendefinisikan jam kerja (shift)
            yang berlaku di setiap unit kerja.
          </p>

          <SubHeading>Menambah Shift</SubHeading>
          <div className="space-y-3">
            <Step number="1" text="Klik menu Shift Unit pada sidebar." />
            <Step number="2" text="Klik tombol + Tambah Shift." />
            <Step
              number="3"
              text="Isi Nama Shift (contoh: Shift Pagi, Shift Siang)."
            />
            <Step number="4" text="Pilih Unit Kerja yang terkait." />
            <Step number="5" text="Isi Jam Mulai dan Jam Selesai." />
            <Step number="6" text="Klik Simpan." />
          </div>

          <SubHeading>Mengedit &amp; Menghapus Shift</SubHeading>
          <p className="text-gray-700">
            Sama seperti Unit Kerja — gunakan ikon pensil untuk edit dan ikon
            tempat sampah untuk hapus di kolom Aksi pada tabel.
          </p>

          <SubHeading>Filter per Unit</SubHeading>
          <p className="text-gray-700">
            Gunakan dropdown filter di atas tabel untuk menampilkan shift
            berdasarkan unit kerja tertentu.
          </p>
          <InfoBox>
            Setiap shift yang dibuat dapat digunakan kembali saat menyusun
            jadwal di menu Jadwal Unit.
          </InfoBox>
        </>
      ),
    },
    {
      id: "pegawai",
      title: "5. Pegawai",
      keywords: [
        "pegawai",
        "karyawan",
        "tambah pegawai",
        "edit pegawai",
        "username",
        "kata sandi",
        "aktif",
        "nonaktif",
        "face registration",
        "wajah",
        "status akun",
      ],
      content: (
        <>
          <p className="text-gray-700">
            Menu Pegawai digunakan untuk mengelola data seluruh pegawai yang
            menggunakan sistem presensi.
          </p>

          <SubHeading>Menambah Pegawai</SubHeading>
          <div className="space-y-3">
            <Step number="1" text="Klik menu Pegawai pada sidebar." />
            <Step number="2" text="Klik tombol + Tambah Pegawai." />
            <Step
              number="3"
              text="Isi formulir: Nama Lengkap, No. HP, Email, dan pilih Unit Kerja."
            />
            <Step
              number="4"
              text="Atur Username (digunakan untuk login) dan Kata Sandi awal."
            />
            <Step number="5" text="Klik Simpan." />
          </div>
          <InfoBox>
            Setelah ditambahkan, pegawai akan diminta mendaftarkan wajah (face
            registration) saat login pertama kali sebelum bisa melakukan
            presensi.
          </InfoBox>

          <SubHeading>Mengedit Data Pegawai</SubHeading>
          <div className="space-y-3">
            <Step
              number="1"
              text="Pada tabel Pegawai, klik ikon pensil (edit) pada baris pegawai yang ingin diubah."
            />
            <Step
              number="2"
              text="Perbarui data yang diperlukan, lalu klik Simpan."
            />
          </div>

          <SubHeading>Mengaktifkan / Menonaktifkan Pegawai</SubHeading>
          <p className="text-gray-700">
            Pada formulir edit pegawai, ubah Status akun menjadi{" "}
            <span className="font-semibold">Aktif</span> atau{" "}
            <span className="font-semibold">Nonaktif</span>. Pegawai nonaktif
            tidak dapat login ke sistem.
          </p>

          <SubHeading>Filter &amp; Pencarian</SubHeading>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            <li>Gunakan kolom pencarian untuk mencari berdasarkan nama.</li>
            <li>
              Gunakan dropdown unit untuk menyaring berdasarkan unit kerja.
            </li>
            <li>
              Gunakan dropdown status untuk menyaring pegawai Aktif / Nonaktif.
            </li>
          </ul>
        </>
      ),
    },
    {
      id: "jadwal-unit",
      title: "6. Jadwal Unit",
      keywords: [
        "jadwal",
        "shift",
        "jadwal unit",
        "periode",
        "bulan",
        "libur",
        "izin",
        "cuti",
        "import excel",
        "ekspor",
        "detail jadwal",
      ],
      content: (
        <>
          <p className="text-gray-700">
            Menu Jadwal Unit digunakan untuk menyusun jadwal kerja (shift)
            seluruh pegawai per bulan.
          </p>

          <SubHeading>Alur Penyusunan Jadwal</SubHeading>
          <div className="space-y-3">
            <Step number="1" text="Klik menu Jadwal Unit pada sidebar." />
            <Step
              number="2"
              text="Pilih periode bulan & tahun yang akan disusun jadwalnya, lalu klik Lanjut."
            />
            <Step
              number="3"
              text="Pilih Unit Kerja yang akan dijadwalkan dari daftar yang tersedia."
            />
            <Step
              number="4"
              text="Pada halaman input jadwal unit, isi jadwal harian untuk setiap tanggal: pilih Shift yang berlaku, atau tandai sebagai Libur / Izin / Cuti."
            />
            <Step
              number="5"
              text="Klik Simpan Jadwal setelah selesai mengisi."
            />
          </div>

          <SubHeading>Melihat Detail Jadwal Per Pegawai</SubHeading>
          <div className="space-y-3">
            <Step
              number="1"
              text="Setelah membuka jadwal unit, klik nama pegawai untuk melihat atau mengedit jadwal individunya."
            />
            <Step
              number="2"
              text="Pada halaman detail jadwal pegawai, Anda dapat mengubah shift per hari."
            />
          </div>

          <SubHeading>Mengimpor Jadwal dari Excel</SubHeading>
          <div className="space-y-3">
            <Step
              number="1"
              text="Pada halaman input jadwal unit, klik tombol Import Excel."
            />
            <Step
              number="2"
              text="Pilih file Excel (.xlsx) dengan format sesuai template."
            />
            <Step
              number="3"
              text="Pratinjau data impor akan ditampilkan — periksa kebenarannya."
            />
            <Step number="4" text="Klik Konfirmasi Import untuk menyimpan." />
          </div>
          <WarnBox>
            Pastikan format file Excel sesuai dengan template yang disediakan
            agar impor berjalan dengan benar.
          </WarnBox>
        </>
      ),
    },
    {
      id: "rekap-laporan",
      title: "7. Rekap Laporan",
      keywords: [
        "rekap",
        "laporan",
        "kehadiran",
        "download excel",
        "ekspor",
        "detail presensi",
        "koreksi",
        "riwayat perubahan",
        "hadir",
        "terlambat",
        "izin",
        "cuti",
        "alpa",
      ],
      content: (
        <>
          <p className="text-gray-700">
            Menu Rekap Laporan digunakan untuk melihat dan mengunduh laporan
            rekapitulasi kehadiran pegawai per periode.
          </p>

          <SubHeading>Melihat Rekap Kehadiran</SubHeading>
          <div className="space-y-3">
            <Step number="1" text="Klik menu Rekap Laporan pada sidebar." />
            <Step
              number="2"
              text="Pilih periode laporan (bulan & tahun), lalu klik Lanjut."
            />
            <Step
              number="3"
              text="Pilih Unit Kerja yang ingin dilihat laporannya."
            />
            <Step
              number="4"
              text="Halaman rekap kehadiran akan menampilkan tabel seluruh pegawai di unit tersebut beserta ringkasan: Hadir, Terlambat, Izin, Cuti, dan Tanpa Keterangan."
            />
          </div>

          <SubHeading>Melihat Detail Presensi Per Pegawai</SubHeading>
          <div className="space-y-3">
            <Step
              number="1"
              text="Pada tabel rekap, klik nama pegawai atau tombol detail untuk membuka riwayat presensi harian pegawai tersebut."
            />
            <Step
              number="2"
              text="Halaman detail menampilkan jam masuk, jam pulang, foto presensi, lokasi, dan status per hari."
            />
          </div>

          <SubHeading>Mengunduh Laporan Excel</SubHeading>
          <div className="space-y-3">
            <Step
              number="1"
              text="Pada halaman rekap kehadiran, klik tombol Download Excel / Ekspor."
            />
            <Step
              number="2"
              text="File Excel berisi data rekap seluruh pegawai pada periode dan unit yang dipilih akan otomatis diunduh."
            />
          </div>

          <SubHeading>Koreksi Data Presensi</SubHeading>
          <div className="space-y-3">
            <Step
              number="1"
              text="Pada halaman detail presensi pegawai, klik tombol Koreksi pada baris yang perlu diubah."
            />
            <Step
              number="2"
              text="Isi formulir koreksi: ubah jam, status, atau unggah bukti pendukung (foto/dokumen)."
            />
            <Step number="3" text="Klik Simpan Koreksi." />
          </div>
          <InfoBox>
            Riwayat semua perubahan data presensi (koreksi) tersimpan dan dapat
            dilihat kembali melalui tombol Riwayat Perubahan pada setiap baris
            data yang pernah dikoreksi.
          </InfoBox>
        </>
      ),
    },
    {
      id: "aktivitas-admin",
      title: "8. Aktivitas Admin",
      keywords: [
        "aktivitas",
        "admin",
        "log",
        "tindakan",
        "monitoring",
        "pencarian",
        "filter tanggal",
        "unduh log",
        "tambah",
        "ubah",
        "hapus",
      ],
      content: (
        <>
          <p className="text-gray-700">
            Menu Aktivitas mencatat seluruh tindakan yang dilakukan oleh admin
            di dalam sistem, mulai dari tambah/ubah/hapus data hingga unduhan
            laporan.
          </p>

          <SubHeading>Fitur Halaman Aktivitas</SubHeading>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            <li>
              <span className="font-semibold">Pencarian</span> — cari aktivitas
              berdasarkan kata kunci (nama admin atau deskripsi tindakan).
            </li>
            <li>
              <span className="font-semibold">Filter Tanggal</span> — filter
              berdasarkan rentang tanggal atau pilihan cepat (Hari ini, 7 Hari
              Terakhir, 30 Hari Terakhir, atau Kustom).
            </li>
            <li>
              <span className="font-semibold">Filter Tipe</span> — saring
              berdasarkan jenis aksi (Semua, Tambah, Ubah, Hapus, dll).
            </li>
            <li>
              <span className="font-semibold">Unduh Log</span> — klik tombol
              Download untuk mengunduh catatan aktivitas dalam format Excel.
            </li>
          </ul>

          <InfoBox>
            Log aktivitas juga tampil secara ringkas di bagian bawah sidebar
            kiri sebagai monitoring aktivitas terbaru (10 entri terakhir,
            diperbarui setiap 3 detik).
          </InfoBox>
        </>
      ),
    },
    {
      id: "profil-admin",
      title: "9. Profil Admin",
      keywords: [
        "profil",
        "admin",
        "administrator",
        "akun",
        "edit profil",
        "keluar",
        "logout",
        "username",
        "email",
        "no. hp",
        "status akun",
      ],
      content: (
        <>
          <p className="text-gray-700">
            Menu Profil menampilkan informasi akun administrator yang sedang
            aktif.
          </p>

          <SubHeading>Informasi yang Ditampilkan</SubHeading>
          <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
            <li>Nama &amp; Role (Administrator)</li>
            <li>Username</li>
            <li>Email</li>
            <li>No. HP</li>
            <li>Status Akun</li>
          </ul>

          <SubHeading>Mengedit Profil</SubHeading>
          <div className="space-y-3">
            <Step number="1" text="Klik tombol Edit Profil." />
            <Step
              number="2"
              text="Ubah data yang diperlukan (nama, email, No. HP, atau kata sandi)."
            />
            <Step number="3" text="Klik Simpan." />
          </div>

          <SubHeading>Keluar Sistem</SubHeading>
          <p className="text-gray-700">
            Klik tombol <span className="font-semibold">Keluar</span> untuk
            logout dari sistem.
          </p>
        </>
      ),
    },
  ];

  // Filter seksi berdasarkan query pencarian (cocok di title atau keywords)
  const filteredSections = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return sections;

    return sections.filter((section) => {
      // Cek kecocokan di judul
      const matchTitle = section.title.toLowerCase().includes(query);
      // Cek kecocokan di keywords
      const matchKeyword = section.keywords.some((kw) =>
        kw.toLowerCase().includes(query),
      );
      return matchTitle || matchKeyword;
    });
  }, [searchQuery, sections]);

  return (
    <div className="space-y-2">
      {/* breadcrumb */}
      <div className="bg-white rounded-lg p-3 shadow-sm text-xs">
        <button className="flex items-center gap-2 text-gray-800">
          <BackIcon />
          <span className="font-medium">Panduan</span>
        </button>
      </div>

      {/* konten utama */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        {/* header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800 border-b border-gray-200 pb-2">
            Panduan Penggunaan
          </h1>
        </div>

        {/* kolom pencarian */}
        <div className="flex flex-col md:flex-row gap-4 mb-4 text-sm mt-5">
          <div className="relative max-w-500">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Cari topik panduan"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#0984E3] transition-colors"
            />
          </div>
        </div>

        {/* Intro Card */}
        <div className="px-1 mt-1">
          <p className="text-xs text-gray-600 pb-5">
            Selamat datang di halaman Panduan! Halaman ini dirancang untuk
            membantu Anda memahami cara menggunakan setiap fitur yang tersedia
            pada sistem. Pilih atau ketuk setiap bagian panduan untuk melihat
            penjelasan yang lebih lengkap, sehingga Anda dapat mengoperasikan
            aplikasi dengan lebih mudah, cepat, dan sesuai dengan fungsinya.
          </p>
        </div>

        {/* info jumlah hasil pencarian */}
        {searchQuery && (
          <div className="mb-3 text-sm text-gray-500">
            Menampilkan{" "}
            <span className="font-semibold text-[#0984E3]">
              {filteredSections.length}
            </span>{" "}
            dari {sections.length} topik
          </div>
        )}

        {/* seksi panduan */}
        <div className="mt-2 space-y-3">
          {filteredSections.length > 0 ? (
            filteredSections.map((section) => (
              <Section key={section.id} title={section.title}>
                {section.content}
              </Section>
            ))
          ) : (
            <div className="text-center py-10 text-gray-400">
              <svg
                className="w-12 h-12 mx-auto mb-3 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm">
                Tidak ada topik yang cocok dengan "
                <span className="font-medium">{searchQuery}</span>"
              </p>
              <p className="text-xs mt-1">Coba gunakan kata kunci lain</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Panduan;
