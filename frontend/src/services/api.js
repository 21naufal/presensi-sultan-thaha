import axios from "axios";

// Konfigurasi instance Axios untuk koneksi ke Backend API
const api = axios.create({
  baseURL: "/api",
});

// Interceptor: Menambahkan Token JWT ke header setiap request secara otomatis
api.interceptors.request.use(
  (config) => {
    // Ambil token dari localStorage (hasil login)
    const token = localStorage.getItem("token");

    // Jika token ada, sisipkan ke header Authorization
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

export default api;
