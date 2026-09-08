import { NavLink } from "react-router-dom";

// import icon
import {
  HomeIcon,
  CalendarIconNav,
  ClockIconNav,
  UserIcon,
} from "../../components/icons/SystemIcons";

const BottomNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-md mx-auto flex justify-around items-center py-2">
        <NavLink
          to="/pegawai/dashboard"
          className={({ isActive }) =>
            `flex flex-col items-center px-4 py-2 transition-colors ${
              isActive ? "text-blue-600" : "text-gray-500"
            }`
          }
        >
          <HomeIcon />
          <span className="text-xs mt-1 font-medium">Dashboard</span>
        </NavLink>

        <NavLink
          to="/pegawai/jadwal"
          className={({ isActive }) =>
            `flex flex-col items-center px-4 py-2 transition-colors ${
              isActive ? "text-blue-600" : "text-gray-500"
            }`
          }
        >
          <CalendarIconNav />
          <span className="text-xs mt-1 font-medium">Jadwal</span>
        </NavLink>

        <NavLink
          to="/pegawai/riwayat"
          className={({ isActive }) =>
            `flex flex-col items-center px-4 py-2 transition-colors ${
              isActive ? "text-blue-600" : "text-gray-500"
            }`
          }
        >
          <ClockIconNav />
          <span className="text-xs mt-1 font-medium">Riwayat</span>
        </NavLink>

        <NavLink
          to="/pegawai/profil"
          className={({ isActive }) =>
            `flex flex-col items-center px-4 py-2 transition-colors ${
              isActive ? "text-blue-600" : "text-gray-500"
            }`
          }
        >
          <UserIcon />
          <span className="text-xs mt-1 font-medium">Profil</span>
        </NavLink>
      </div>
    </nav>
  );
};

export default BottomNav;
