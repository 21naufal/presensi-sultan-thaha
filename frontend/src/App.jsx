import { Navigate, Route, Routes } from "react-router-dom";

// Pages
import Login from "./pages/Login";

// Routes
import AdminRoutes from "./router/AdminRoutes";
import PegawaiRoutes from "./router/PegawaiRoutes";

function App() {
  return (
    <Routes>
      {/* Halaman Login */}
      <Route path="/" element={<Login />} />

      {/* Route Admin */}
      <Route path="/admin/*" element={<AdminRoutes />} />

      {/* Route Pegawai */}
      <Route path="/pegawai/*" element={<PegawaiRoutes />} />

      {/* Redirect jika URL tidak dikenal */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
