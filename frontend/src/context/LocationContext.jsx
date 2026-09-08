import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";

const LocationContext = createContext(null);

export const LocationProvider = ({ children }) => {
  const watchIdRef = useRef(null);
  const [location, setLocation] = useState(null);
  const [buffer, setBuffer] = useState([]);
  const [error, setError] = useState(null);
  const [isWatching, setIsWatching] = useState(false);

  // fungsi reset buffer (bisa dipanggil dari component manapun)
  const resetBuffer = useCallback(() => {
    setBuffer([]);
    console.log("Buffer lokasi direset");
  }, []);

  // fungsi mulai watchPosition
  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation tidak didukung browser ini");
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const coord = { latitude, longitude, accuracy, timestamp: Date.now() };

        setLocation(coord);
        setBuffer((prev) => {
          const newBuffer = [...prev, coord];
          return newBuffer.slice(-5); // simpan maksimal 5 titik terakhir
        });
        setError(null);
      },
      (err) => {
        console.error("Geolocation error:", err);
        setError(err.message || "Gagal mendapatkan lokasi");
      },
      {
        enableHighAccuracy: true, // prioritaskan akurasi
        timeout: 10000, // timeout 10 detik
        maximumAge: 0, // jangan pakai cache
      },
    );
    setIsWatching(true);
  }, []);

  // fungsi stop watchPosition
  const stopWatching = useCallback(() => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setIsWatching(false);
    }
  }, []);

  // effect start GPS saat app mount, cleanup saat unmount
  useEffect(() => {
    startWatching();
    return () => stopWatching();
  }, [startWatching, stopWatching]);

  // value yang disediakan ke component anak
  const value = {
    location, // koordinat terbaru
    buffer, // 5 titik terakhir
    error, // error message jika ada
    isWatching, // status apakah GPS sedang aktif
    resetBuffer, // reset buffer points
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

// custom hook untuk pakai context dengan mudah
export const useLocation = () => {
  const ctx = useContext(LocationContext);
  if (!ctx) {
    throw new Error(
      "useLocation() harus dipakai di dalam <LocationProvider>. " +
        "Pastikan Anda membungkus App dengan LocationProvider di main.jsx",
    );
  }
  return ctx;
};
