// React
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
// Library
import toast from "react-hot-toast";
// Context
import { useAuth } from "../../context/AuthContext";
// Components
import BottomNav from "../../components/layout/BottomNav";
import { CameraIcon } from "../../components/icons/SystemIcons";
import PhotoUploadModal from "../../components/pegawai/PhotoUploadModal";
// Services
import api from "../../services/api";

const ProfilPage = () => {
  // Hooks
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // State halaman profil
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  // Fetch data profil pegawai dari server
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get("/pegawai/profile");
      if (response.data.status === "success") {
        setProfileData(response.data.data);
      }
    } catch (error) {
      console.error("Gagal mengambil data profil.", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Handle ubah kata sandi
  const handleUbahSandi = () => {
    navigate("/pegawai/ubah-sandi");
  };

  // Handle ubah foto profil
  const handleUbahFoto = () => {
    setShowPhotoModal(true);
  };

  // Handle tutup modal foto
  const handleClosePhotoModal = () => {
    setShowPhotoModal(false);
  };

  // Handle pilih galeri
  const handleGaleri = () => {
    setShowPhotoModal(false);

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        await uploadPhoto(file);
      }
    };
    input.click();
  };

  // Handle pilih kamera
  const handleKamera = () => {
    setShowPhotoModal(false);

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "user";

    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (file) {
        await uploadPhoto(file);
      }
    };

    input.click();
  };

  // validasi upload photo
  const uploadPhoto = async (file) => {
    // validasi format file
    const validTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!validTypes.includes(file.type)) {
      toast.error("Hanya menerima file JPEG, JPG atau PNG.");
      return;
    }

    // validasi ukuran file (maksimal 5 MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      toast.error(`Ukuran file terlalu besar (${sizeMB} MB). Maksimal 5 MB.`);
      return;
    }

    // validasi file tidak kosong
    if (file.size === 0) {
      toast.error("File kosong/rusak. Silakan pilih foto lain.");
      return;
    }

    // proses upload ke server
    try {
      const formData = new FormData();
      formData.append("foto", file);

      const response = await api.post("/pegawai/upload-photo", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.status === "success") {
        await fetchProfile();
        toast.success("Foto berhasil diperbarui");
      }
    } catch (error) {
      console.error("Gagal mengunggah foto profil.", error);

      const serverMsg = error.response?.data?.message;
      if (serverMsg) {
        toast.error(serverMsg);
      } else {
        toast.error("Gagal upload foto profil");
      }
    }
  };

  // UI loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0984E3]"></div>
      </div>
    );
  }

  // UI Tampilan halaman utama
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-[#0974c6] text-white p-3 pl-5 shadow-lg">
        <h1 className="text-lg font-semibold">Profil Pegawai</h1>
        <p className="text-xs">Kelola profil Anda</p>
      </div>

      {/* konten utama */}
      <div className="p-4">
        {/* Card Profile */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          {/* Foto Profil */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden mb-2">
              {profileData?.fotoProfil ? (
                <img
                  src={profileData.fotoProfil}
                  alt={profileData.nama}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <CameraIcon />
                </div>
              )}
            </div>
            <button
              onClick={handleUbahFoto}
              className="text-sm text-gray-800 font-semibold hover:underline"
            >
              Ubah Foto
            </button>
          </div>

          {/* Info Profil */}
          <div className="space-y-4">
            {/* nama lengkap */}
            <div>
              <p className="text-xs text-gray-500 mb-1">Nama Lengkap</p>
              <p className="text-sm font-medium text-gray-800">
                {profileData?.nama}
              </p>
            </div>

            {/* Unit Kerja */}
            <div>
              <p className="text-xs text-gray-500 mb-1">Unit Kerja</p>
              <p className="text-sm font-medium text-gray-800">
                {profileData?.unit?.nama}
              </p>
            </div>

            {/* No. HP */}
            <div>
              <p className="text-xs text-gray-500 mb-1">No. HP</p>
              <p className="text-sm font-medium text-gray-800">
                {profileData?.noHp}
              </p>
            </div>

            {/* Email */}
            <div>
              <p className="text-xs text-gray-500 mb-1">Email</p>
              <p className="text-sm font-medium text-gray-800">
                {profileData?.email}
              </p>
            </div>

            {/* Status Aktif/Nonaktif */}
            <div>
              <p className="text-xs text-gray-500 mb-1">Status</p>
              <span
                className={`inline-flex px-5 py-1 rounded-full text-xs font-medium ${
                  profileData?.status === "aktif"
                    ? "bg-green-200 text-green-800"
                    : "bg-red-200 text-red-800"
                }`}
              >
                {profileData?.status === "aktif" ? "Aktif" : "Nonaktif"}
              </span>
            </div>
          </div>

          {/* Buttons */}
          <div className="mt-10 space-y-2 text-sm">
            <button
              onClick={handleUbahSandi}
              className="w-full py-3 bg-[#0984E3] text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
            >
              Ubah Sandi
            </button>
            <button
              onClick={handleLogout}
              className="w-full py-3 text-white bg-red-500 font-semibold rounded-xl hover:bg-red-50 transition-colors"
            >
              Keluar
            </button>
          </div>
        </div>
      </div>

      {/* Modal upload foto */}
      <PhotoUploadModal
        open={showPhotoModal}
        onClose={handleClosePhotoModal}
        onGaleri={handleGaleri}
        onKamera={handleKamera}
      />

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default ProfilPage;
