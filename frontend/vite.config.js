import { defineConfig } from "vite";

// vite plugins
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import mkcert from "vite-plugin-mkcert";

const backendURL = "http://localhost:5000";

export default defineConfig({
  plugins: [react(), mkcert(), tailwindcss()],
  server: {
    // port frontend
    port: 5173,

    // proxy request ke backend Express
    proxy: {
      "/api": {
        target: backendURL,
        changeOrigin: true,
      },
      "/uploads": {
        target: backendURL,
        changeOrigin: true,
      },
    },
  },
});
