import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

// import icon
import { UserIcon } from "../../components/icons/SystemIcons";

const Header = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get("/employees/profile");

        if (response.data.status === "success") {
          setProfileData(response.data.data);
        }
      } catch (error) {
        console.error("Gagal mengambil profil:", error);
      }
    };

    fetchProfile();
  }, []);

  return (
    <header className="bg-[#0B6BB3] text-white px-6 py-4 flex justify-between items-center shadow-md w-full">
      <div className="flex items-center gap-3">
        <img
          src="/sultanthahalogo.png"
          alt="Sultan Thaha Airport"
          className="h-10 w-auto pl-5"
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">
          {profileData?.nama || "Memuat..."}
        </span>

        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
          <UserIcon />
        </div>
      </div>
    </header>
  );
};

export default Header;
