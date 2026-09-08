import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

// item menu
const menuItems = [
  {
    path: "/admin/dashboard",
    label: "Beranda",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  },
  {
    path: "/admin/unit-kerja",
    label: "Unit Kerja",
    icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  },
  {
    path: "/admin/shift-unit",
    label: "Shift Unit",
    icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    path: "/admin/pegawai",
    label: "Pegawai",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
  },
  {
    path: "/admin/jadwal-unit",
    label: "Jadwal Unit",
    icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  },
  {
    path: "/admin/rekap-laporan",
    label: "Rekap Laporan",
    icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  },
  {
    path: "/admin/panduan",
    label: "Panduan",
    icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  },
  {
    path: "/admin/profil",
    label: "Profil",
    icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  },
  {
    path: "/admin/aktivitas",
    label: "Aktivitas",
    icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  },
];

// sidebar
const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [recentLogs, setRecentLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Fetch recent logs (10 terakhir) dengan parameter limit
  const fetchRecentLogs = async () => {
    try {
      setLoadingLogs(true);
      const response = await api.get("/logs?limit=10");
      if (response.data.status === "success") {
        const logs = response.data.data.slice(0, 10);
        setRecentLogs(logs);
      }
    } catch (err) {
      console.error("Error fetching recent logs:", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return "-";

    try {
      const now = new Date();
      const time = new Date(timestamp);

      if (isNaN(time.getTime())) {
        return "-";
      }

      const diffInSeconds = Math.floor((now - time) / 1000);

      if (diffInSeconds < 0) return "Baru saja";
      if (diffInSeconds < 60) {
        return `${diffInSeconds} detik lalu`;
      }

      const diffInMinutes = Math.floor(diffInSeconds / 60);
      if (diffInMinutes < 60) {
        return `${diffInMinutes} menit lalu`;
      }

      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) {
        return `${diffInHours} jam lalu`;
      }

      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} hari lalu`;
    } catch (err) {
      console.error("Error formatting time:", err);
      return "-";
    }
  };

  const extractActivityText = (log) => {
    return log.deskripsi || "melakukan aktivitas";
  };

  // Get display name (nama asli > username > fallback)
  const getDisplayName = (log) => {
    return log.admin_nama || log.admin || "Unknown";
  };

  useEffect(() => {
    fetchRecentLogs();
    const interval = setInterval(fetchRecentLogs, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="w-45 bg-white shadow-lg h-[calc(100vh-73px)] flex flex-col">
      {/* SECTION MENU */}
      <div className="flex-shrink-0">
        <nav>
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.path}>
                <button
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-6 py-2 text-xs transition-colors duration-200 ${
                    isActive(item.path)
                      ? "bg-[#0984E3] text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={item.icon}
                    />
                  </svg>

                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* SECTION LOG */}
      <div className="border-t border-gray-200 mt-1 flex-1 min-h-0">
        <div className="p-2 h-full flex flex-col">
          <h3 className="text-xs font-medium text-gray-700 mb-2 tracking-wide flex-shrink-0">
            AKTIVITAS
          </h3>

          {loadingLogs && recentLogs.length === 0 ? (
            <div className="flex justify-center py-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
            </div>
          ) : (
            <div
              className="flex-1 pl-2 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none]"
              style={{ scrollbarWidth: "none" }}
            >
              <ul className="space-y-2">
                {recentLogs.map((log, index) => {
                  const activityText = extractActivityText(log);
                  const firstLetter = activityText.charAt(0).toLowerCase();
                  const restText = activityText.slice(1);

                  return (
                    <li key={log.id || index}>
                      <p className="text-[10px]">
                        <span className="font-semibold">
                          {getDisplayName(log)}
                        </span>{" "}
                        {firstLetter}
                        {restText}
                      </p>

                      <p className="text-[10px] text-gray-500 mt-1">
                        {formatTimeAgo(log.waktuRaw)}
                      </p>

                      {index < recentLogs.length - 1 && (
                        <div className="border-b border-gray-200 mt-1"></div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
