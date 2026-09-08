// React
import { useState } from "react";
import { useNavigate } from "react-router-dom";

// Components
import {
  BackIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "../../components/icons/SystemIcons";

// section
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

// langkah langkah
const Step = ({ number, text }) => (
  <div className="flex items-start gap-3">
    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#0984E3] text-white text-xs flex items-center justify-center font-bold">
      {number}
    </span>
    <p className="text-sm text-gray-700 leading-relaxed">{text}</p>
  </div>
);

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

// kotak tips
const TipBox = ({ children }) => (
  <div className="bg-green-100 px-4 py-3 text-sm text-gray-700">{children}</div>
);

// sub heading
const SubHeading = ({ children }) => (
  <h3 className="font-semibold text-gray-800 text-sm mt-4 mb-2">{children}</h3>
);

const PanduanPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-[#0974c6] text-white p-3 shadow-lg">
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate("/pegawai/dashboard")}
            className="p-2 -ml-2 rounded-lg"
          >
            <BackIcon className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">Panduan Pengunaan</h1>
        </div>
      </div>

      {/* konten utama */}
      <div className="p-4 space-y-3">
        {/* Intro Card */}
        <div className="px-1">
          <p className="text-sm text-gray-700 mb-1">
            <span className="font-semibold">
              Selamat Datang di halaman panduan!
            </span>
          </p>
          <p className="text-xs text-gray-600 pb-5">
            Panduan ini akan membantu Anda memahami cara menggunakan aplikasi
            ini. Ketuk setiap bagian untuk melihat detail panduan.
          </p>
        </div>

        {/* masuk dan lupa kata sandi */}
        <Section title="1. Masuk & Lupa Kata Sandi">
          <SubHeading>Cara Masuk (Login)</SubHeading>
          <div className="space-y-3">
            <Step
              number="1"
              text="Buka aplikasi di browser. Halaman masuk / login akan tampil secara otomatis."
            />
            <Step
              number="2"
              text="Masukkan Nama Pengguna (username) atau Nomor HP pada kolom pertama."
            />
            <Step
              number="3"
              text="Masukkan Kata Sandi pada kolom kedua. Ketuk ikon mata untuk menampilkan atau menyembunyikan sandi."
            />
            <Step
              number="4"
              text="Ketuk tombol MASUK. Jika berhasil, Anda akan diarahkan ke halaman pendaftaran wajah (jika belum terdaftar) atau langsung ke Dashboard."
            />
          </div>
          <WarnBox>
            Jika muncul pesan kesalahan, periksa kembali username/No. HP dan
            kata sandi yang Anda masukkan.
          </WarnBox>

          <SubHeading>Lupa Kata Sandi</SubHeading>
          <div className="space-y-3">
            <Step
              number="1"
              text='Di halaman login, ketuk tautan "Lupa kata sandi?" di bawah kolom kata sandi.'
            />
            <Step
              number="2"
              text="Masukkan alamat Email yang terdaftar pada akun Anda, lalu ketuk Kirim OTP."
            />
            <Step
              number="3"
              text="Buka email Anda, salin kode OTP 6 digit yang dikirimkan, lalu masukkan ke kolom verifikasi."
            />
            <Step
              number="4"
              text="Setelah OTP terverifikasi, masukkan Kata Sandi Baru dan konfirmasinya."
            />
            <Step
              number="5"
              text="Ketuk Simpan. Kata sandi berhasil diperbarui, Anda dapat masuk / login menggunakan kata sandi baru."
            />
          </div>
          <InfoBox>
            Kode OTP hanya berlaku untuk sekali pakai dan memiliki batas waktu.
            Segera masukkan sebelum kedaluwarsa.
          </InfoBox>
        </Section>

        {/* pendaftaran wajah */}
        <Section title="2. Pendaftaran Wajah">
          <p className="text-gray-700">
            Saat pertama kali login, Anda{" "}
            <span className="font-semibold">wajib mendaftarkan wajah</span>{" "}
            sebelum dapat menggunakan aplikasi. Proses ini hanya dilakukan
            sekali diawal.
          </p>

          <SubHeading>Langkah Pendaftaran Wajah</SubHeading>
          <div className="space-y-3">
            <Step
              number="1"
              text='Pada halaman selamat datang pendaftaran wajah, ketuk tombol "Mulai Pendaftaran".'
            />
            <Step
              number="2"
              text="Baca instruksi yang ditampilkan: lepas masker, lepas kacamata, jangan menutup wajah, dan hadapkan wajah ke kamera."
            />
            <Step
              number="3"
              text='Ketuk tombol "Mulai Pemindaian" untuk mengaktifkan kamera.'
            />
            <Step
              number="4"
              text="Posisikan wajah Anda di tengah bingkai kamera dengan pencahayaan yang cukup. Sistem akan mengambil beberapa sampel wajah secara otomatis."
            />
            <Step
              number="5"
              text="Tunggu hingga proses penyimpanan selesai. Halaman sukses akan tampil jika pendaftaran berhasil."
            />
            <Step
              number="6"
              text='Ketuk "Ke Dashboard" untuk mulai menggunakan aplikasi.'
            />
          </div>

          <TipBox>
            <span className="font-semibold">
              Tips agar pendaftaran berhasil :
            </span>
            <ul className="mt-2 space-y-1 list-disc list-inside text-sm">
              <li>Gunakan pencahayaan yang terang dan merata</li>
              <li>Hadap lurus ke kamera, jangan miring</li>
              <li>Pastikan seluruh wajah terlihat, tidak terpotong</li>
              <li>Lepas masker dan kacamata</li>
            </ul>
          </TipBox>
        </Section>

        {/* dashboard dan presensi */}
        <Section title="3. Dashboard, Presensi Masuk & Pulang">
          <p className="text-gray-700">
            Dashboard adalah halaman utama aplikasi. Di sini Anda dapat
            melakukan presensi masuk dan pulang, serta melihat ringkasan
            kehadiran bulan ini.
          </p>

          <SubHeading>Informasi di Dashboard</SubHeading>
          <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
            <li>
              <span className="font-semibold">Jam & Tanggal</span> : menampilkan
              waktu saat ini secara realtime.
            </li>
            <li>
              <span className="font-semibold">Nama Shift</span> : jadwal shift
              Anda hari ini (jam mulai – jam selesai).
            </li>
            <li>
              <span className="font-semibold">Nama Lokasi</span> : lokasi
              presensi yang ditetapkan untuk shift Anda.
            </li>
            <li>
              <span className="font-semibold">Tombol Presensi</span> : tombol
              utama untuk melakukan presensi.
            </li>
            <li>
              <span className="font-semibold">Rekap Presensi Bulan Ini</span> :
              jumlah Hadir, Tanpa Keterangan, dan Terlambat.
            </li>
            <li>
              <span className="font-semibold">Riwayat Presensi Terbaru</span> :
              daftar catatan presensi terakhir Anda.
            </li>
          </ul>

          <SubHeading>Cara Presensi Masuk</SubHeading>
          <div className="space-y-3">
            <Step
              number="1"
              text="Pastikan Anda berada di area lokasi kerja yang telah ditetapkan."
            />
            <Step
              number="2"
              text="Pastikan GPS/Lokasi perangkat Anda aktif dan izin lokasi telah diberikan ke browser."
            />
            <Step
              number="3"
              text='Pada Dashboard, ketuk tombol biru "PRESENSI MASUK".'
            />
            <Step
              number="4"
              text="Kamera akan aktif. Posisikan wajah Anda di tengah bingkai."
            />
            <Step
              number="5"
              text="Ikuti tantangan gerakan wajah yang muncul : sistem akan meminta Anda untuk berkedip atau membuka mulut."
            />
            <Step
              number="6"
              text="Setelah wajah terverifikasi, sistem akan mengecek lokasi Anda secara otomatis."
            />
            <Step
              number="7"
              text="Hasil presensi akan ditampilkan, Tepat Waktu atau Terlambat."
            />
          </div>

          <SubHeading>Cara Presensi Pulang</SubHeading>
          <div className="space-y-3">
            <Step
              number="1"
              text="Presensi pulang hanya dapat dilakukan setelah jam pulang shift tiba."
            />
            <Step
              number="2"
              text='Ketuk tombol biru "PRESENSI PULANG" yang akan aktif tepat saat jam pulang.'
            />
            <Step
              number="3"
              text="Ulangi proses yang sama seperti presensi masuk, kamera aktif, liveness challenge, verifikasi lokasi."
            />
            <Step number="4" text="Hasil presensi pulang akan ditampilkan." />
          </div>

          <SubHeading>Kondisi Tombol Presensi</SubHeading>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-[#0984E3] text-white font-semibold">
                PRESENSI MASUK
              </span>
              <span className="text-gray-600">Jam masuk telah tiba.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-[#0984E3] text-white font-semibold">
                PRESENSI PULANG
              </span>
              <span className="text-gray-600">Jam pulang telah tiba.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-gray-400 text-white font-semibold">
                PRESENSI SELESAI
              </span>
              <span className="text-gray-600">
                Presensi masuk dan pulang sudah dilakukan hari ini.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-gray-400 text-white font-semibold">
                Tidak Ada Jadwal
              </span>
              <span className="text-gray-600">
                Anda tidak memiliki jadwal shift hari ini.
              </span>
            </div>
          </div>

          <WarnBox>
            <span className="font-semibold">Presensi akan ditolak jika:</span>
            <ul className="mt-2 space-y-1 list-disc list-inside text-sm">
              <li>
                Wajah tidak dikenali atau tidak sesuai (menggunakan wajah orang
                lain)
              </li>
              <li>Anda berada di luar area lokasi kerja</li>
              <li>Terdeteksi penggunaan GPS palsu (fake GPS)</li>
              <li>Tantangan gerakkan tidak berhasil diselesaikan</li>
            </ul>
          </WarnBox>

          <InfoBox>
            Presensi masuk dibuka 1 jam sebelum jam masuk shift. Presensi pulang
            dibuka tepat saat jam pulang shift.
          </InfoBox>
        </Section>

        {/* jadwal presensi */}
        <Section title="4. Jadwal Presensi">
          <p className="text-gray-700">
            Menu Jadwal menampilkan seluruh jadwal kerja Anda pada bulan yang
            sedang berjalan (bulan saat ini).
          </p>

          <SubHeading>Cara Melihat Jadwal</SubHeading>
          <div className="space-y-3">
            <Step number="1" text='Ketuk menu "Jadwal" pada navigasi bawah.' />
            <Step
              number="2"
              text="Jadwal bulan ini akan tampil secara otomatis dalam bentuk daftar harian."
            />
          </div>

          <SubHeading>Informasi yang Ditampilkan</SubHeading>
          <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
            <li>
              <span className="font-semibold">Tanggal & Hari</span> : tanggal
              lengkap beserta nama hari.
            </li>
            <li>
              <span className="font-semibold">Nama Shift</span> : nama shift
              yang dijadwalkan.
            </li>
            <li>
              <span className="font-semibold">Jam Kerja</span> : jam mulai dan
              jam selesai shift.
            </li>
            <li>
              <span className="font-semibold">Lokasi Presensi</span> : lokasi
              tempat presensi dilakukan.
            </li>
            <li>
              <span className="font-semibold">Status</span> : keterangan jadwal
              hari tersebut.
            </li>
          </ul>

          <SubHeading>Keterangan Warna Kartu Jadwal</SubHeading>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[#0984E3] text-white font-medium">
                Ada Jadwal Shift
              </span>
              <span className="text-gray-600">Anda memiliki jadwal shift.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-gray-400 text-white font-medium">
                Libur
              </span>
              <span className="text-gray-600">
                Hari libur, tidak perlu melakukan presensi.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-blue-400 text-white font-medium">
                Izin
              </span>
              <span className="text-gray-600">
                Anda sedang dalam status izin.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-green-400 text-white font-medium">
                Cuti
              </span>
              <span className="text-gray-600">
                Anda sedang dalam masa cuti.
              </span>
            </div>
          </div>

          <InfoBox>
            Jadwal disusun oleh Admin. Jika terdapat kesalahan jadwal, hubungi
            administrator sistem.
          </InfoBox>
        </Section>

        {/* riwayat presensi */}
        <Section title="5. Riwayat Presensi">
          <p className="text-gray-700">
            Menu Riwayat menampilkan catatan lengkap presensi masuk dan pulang
            Anda, dapat dipilih berdasarkan bulan dan tahun.
          </p>

          <SubHeading>Cara Melihat Riwayat</SubHeading>
          <div className="space-y-3">
            <Step number="1" text='Ketuk menu "Riwayat" pada navigasi bawah.' />
            <Step
              number="2"
              text="Gunakan filter Bulan dan Tahun di bagian atas untuk memilih periode yang ingin dilihat."
            />
            <Step
              number="3"
              text="Daftar riwayat presensi akan ditampilkan secara otomatis sesuai pilihan."
            />
          </div>

          <SubHeading>Informasi Kartu Riwayat</SubHeading>
          <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
            <li>
              <span className="font-semibold">Tanggal & Hari</span> : tanggal
              lengkap beserta nama hari.
            </li>
            <li>
              <span className="font-semibold">Jam Kerja</span> : jam masuk dan
              pulang shift
            </li>
            <li>
              <span className="font-semibold">Nama Shift</span> : nama shift
              yang dijadwalkan.
            </li>
            <li>
              <span className="font-semibold">Presensi Masuk</span> : jam masuk
              beserta status
            </li>
            <li>
              <span className="font-semibold">Presensi Pulang</span> : jam
              pulang beserta status
            </li>
            <li>
              <span className="font-semibold">Keterangan</span> : status
              kehadiran akhir (Hadir, Terlambat, Tanpa Keterangan, Izin, Cuti,
              Libur)
            </li>
          </ul>

          <SubHeading>Keterangan Warna Status</SubHeading>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-green-500 text-white">
                Tepat Waktu
              </span>
              <span className="text-gray-600">
                Presensi masuk sebelum atau tepat pada jam mulai shift.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-yellow-400 text-white">
                Terlambat
              </span>
              <span className="text-gray-600">
                Presensi masuk setelah jam mulai shift.
              </span>
            </div>
          </div>

          <InfoBox>
            Jika terdapat data riwayat yang tidak sesuai, hubungi administrator
            untuk dilakukan koreksi.
          </InfoBox>
        </Section>

        {/* profil dan ubah foto */}
        <Section title="6. Profil & Ubah Foto">
          <p className="text-gray-700">
            Menu Profil menampilkan informasi pribadi Anda dan memberikan opsi
            untuk memperbarui foto profil.
          </p>

          <SubHeading>Informasi yang Ditampilkan</SubHeading>
          <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
            <li>Nama Lengkap</li>
            <li>Unit Kerja</li>
            <li>No. HP</li>
            <li>Email</li>
            <li>Status Akun (Aktif / Nonaktif)</li>
          </ul>

          <SubHeading>Cara Mengubah Foto Profil</SubHeading>
          <div className="space-y-3">
            <Step number="1" text='Ketuk menu "Profil" pada navigasi bawah.' />
            <Step
              number="2"
              text='Ketuk teks "Ubah Foto" di bawah foto profil.'
            />
            <Step
              number="3"
              text="Kotak pilihan akan muncul. Pilih Galeri (memilih dari foto yang tersimpan) atau Kamera (mengambil foto langsung dari kamera)."
            />
            <Step number="4" text="Pilih atau ambil foto yang diinginkan." />
            <Step
              number="5"
              text="Foto akan otomatis diunggah dan diperbarui."
            />
          </div>

          <WarnBox>
            Foto profil harus berformat JPEG, JPG atau PNG dengan ukuran
            maksimal 5 MB.
          </WarnBox>
        </Section>

        {/* ubah kata sandi */}
        <Section title="7. Ubah Kata Sandi">
          <p className="text-gray-700">
            Fitur Ubah Kata Sandi memungkinkan Anda mengganti kata sandi akun
            kapan saja dari dalam aplikasi.
          </p>

          <SubHeading>Langkah Mengubah Kata Sandi</SubHeading>
          <div className="space-y-3">
            <Step
              number="1"
              text='Buka menu Profil, lalu ketuk tombol "Ubah Sandi".'
            />
            <Step
              number="2"
              text="Masukkan Kata Sandi Lama pada kolom pertama."
            />
            <Step
              number="3"
              text="Masukkan Kata Sandi Baru pada kolom kedua."
            />
            <Step
              number="4"
              text="Masukkan kembali Kata Sandi Baru pada kolom ketiga (konfirmasi)."
            />
            <Step
              number="5"
              text='Ketuk tombol "Simpan". Kata sandi berhasil diperbarui.'
            />
          </div>

          <TipBox>
            <span className="font-semibold">
              Tips membuat kata sandi yang kuat:
            </span>
            <ul className="mt-2 space-y-1 list-disc list-inside text-sm">
              <li>Gunakan minimal 8 karakter</li>
              <li>Kombinasikan huruf besar, huruf kecil, dan angka</li>
            </ul>
          </TipBox>
        </Section>

        {/* keluar akun */}
        <Section title="8. Keluar Akun">
          <p className="text-gray-700">
            Anda bisa keluar / logout dari akun setelah selesai menggunakan
            aplikasi, terutama jika menggunakan perangkat bersama.
          </p>

          <SubHeading>Cara Keluar</SubHeading>
          <div className="space-y-3">
            <Step number="1" text='Ketuk menu "Profil" pada navigasi bawah.' />
            <Step number="2" text='Ketuk tombol "Keluar" (berwarna merah).' />
            <Step
              number="3"
              text="Anda akan diarahkan kembali ke halaman login."
            />
          </div>

          <WarnBox>
            Pastikan presensi masuk dan pulang sudah tercatat sebelum keluar
            dari aplikasi.
          </WarnBox>
        </Section>
      </div>
      {/* Footer Card */}
      <div className="p-5 text-center">
        <p className="text-sm text-gray-700 mb-2">
          <span className="font-semibold">Butuh bantuan lebih lanjut?</span>
        </p>
        <p className="text-xs text-gray-600">
          Hubungi administrator sistem atau tim IT untuk mendapatkan bantuan
          teknis.
        </p>
      </div>
    </div>
  );
};

export default PanduanPage;
