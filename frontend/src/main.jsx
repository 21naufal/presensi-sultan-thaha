// React
import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Styles
import "./index.css";
import "leaflet/dist/leaflet.css";

// Components
import App from "./App.jsx";

// Context
import { AuthProvider } from "./context/AuthContext";
import { LocationProvider } from "./context/LocationContext";

// Utils
import { loadFaceModels } from "./utils/loadModels";
import { registerServiceWorker } from "./utils/registerServiceWorker";

// memuat model face-api saat aplikasi pertama kali dijalankan
const ModelPreloader = () => {
  useEffect(() => {
    loadFaceModels().catch((err) => {
      console.warn(
        "Gagal memuat model wajah. Model akan dicoba dimuat kembali saat diperlukan:",
        err,
      );
    });
  }, []);

  return null;
};

// mendaftarkan Service Worker
registerServiceWorker();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <LocationProvider>
          <ModelPreloader />
          <App />
          <Toaster
            position="top-right"
            reverseOrder={false}
            gutter={12}
            toastOptions={{
              duration: 3000,

              style: {
                borderRadius: "10px",
                fontSize: "14px",
                fontWeight: "500",
                boxShadow: "0 8px 24px rgba(0,0,0,.15)",
              },

              success: {
                style: {
                  background: "#16a34a",
                  color: "#fff",
                },
                iconTheme: {
                  primary: "#fff",
                  secondary: "#16a34a",
                },
              },

              error: {
                style: {
                  background: "#dc2626",
                  color: "#fff",
                },
                iconTheme: {
                  primary: "#fff",
                  secondary: "#dc2626",
                },
              },
            }}
          />
        </LocationProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
