import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="h-screen overflow-hidden bg-gray-200">
      {/* header */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Header />
      </div>

      {/* container untuk sidebar dan konten utama */}
      <div className="flex pt-[60px] h-full">
        {" "}
        {/* sidebar */}
        <div className="fixed left-0 top-[72px] bottom-0 z-40">
          <Sidebar />
        </div>
        {/* konten utama */}
        <main className="flex-1 ml-42 overflow-y-auto h-full">
          <div className="p-5">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
