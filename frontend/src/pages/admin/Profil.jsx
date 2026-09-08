import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import { BackIcon, UserIcon } from "../../components/icons/SystemIcons";

const Profil = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // State untuk menyimpan data profil dan status loading
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Ambil data profil admin dari API
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get("/employees/profile");
      if (response.data.status === "success") {
        setProfileData(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      toast.error("Gagal memuat data profil");
    } finally {
      setLoading(false);
    }
  };

  // Muat data profil saat komponen pertama kali dirender
  useEffect(() => {
    fetchProfile();
  }, []);

  // Proses logout dan redirect ke halaman login
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Navigasi ke halaman edit profil
  const handleEditProfile = () => {
    navigate("/admin/profil/edit");
  };

  // Tampilan saat data sedang dimuat
  if (loading) {
    return (
      <div className="space-y-2">
        <div className="bg-white rounded-lg p-3 shadow-sm text-xs">
          <button className="flex items-center gap-2 text-gray-800">
            <BackIcon />
            <span className="font-medium">Profil</span>
          </button>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
          <span className="ml-2 text-gray-600">Memuat data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Breadcrumb navigasi */}
      <div className="bg-white rounded-lg p-3 shadow-sm text-xs">
        <button className="flex items-center gap-2 text-gray-800">
          <BackIcon />
          <span className="font-medium">Profil</span>
        </button>
      </div>

      {/* Konten utama halaman */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        {/* Header halaman */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800 border-b border-gray-200 pb-2">
            Profil Admin
          </h1>
        </div>

        {/* Kartu profil dan tombol aksi */}
        <div className="mt-5 bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {/* Informasi dasar profil */}
            <div className="flex items-center gap-4">
              {/* Ikon avatar user */}
              <div className="bg-gray-100 rounded-full p-3">
                <UserIcon />
              </div>

              {/* Nama dan role pengguna */}
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  {profileData?.nama || user?.nama || "-"}
                </h2>
                <p className="text-sm text-gray-600">
                  {profileData?.role === "admin" ? "Administrator" : "Pegawai"}
                </p>
              </div>
            </div>

            {/* Tombol aksi (Keluar dan Edit) */}
            <div className="flex gap-3">
              <button
                onClick={handleLogout}
                className="px-6 py-2 border-2 border-[#0984E3] text-[#0984E3] font-semibold rounded-xl hover:bg-blue-50 transition-colors text-sm"
              >
                Keluar
              </button>
              <button
                onClick={handleEditProfile}
                className="px-6 py-2 bg-[#0984E3] text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors text-sm"
              >
                Edit Profil
              </button>
            </div>
          </div>

          {/* Detail informasi akun */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">
              Informasi Akun
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 text-xs mb-1">
                  Username atau Nama Pengguna
                </p>
                <p className="font-medium text-gray-800">
                  {profileData?.username || "-"}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">Email</p>
                <p className="font-medium text-gray-800">
                  {profileData?.email || "-"}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">No. HP</p>
                <p className="font-medium text-gray-800">
                  {profileData?.noHp
                    ? `+62 ${profileData.noHp.replace(/^0/, "")}`
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">Status Akun</p>
                <span
                  className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                    profileData?.status === "aktif"
                      ? "bg-green-200 text-green-800"
                      : "bg-red-200 text-red-800"
                  }`}
                >
                  {profileData?.status === "aktif" ? "Aktif" : "Nonaktif"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profil;
