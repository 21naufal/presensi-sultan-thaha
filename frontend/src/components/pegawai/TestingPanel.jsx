import { useEffect, useRef, useState } from "react";
import { useLocation } from "../../context/LocationContext";
import {
  calculateDistance,
  calculateBearing,
} from "../FaceAttendance/utils/locationHelpers";
import api from "../../services/api";

// dummy target lokasi presensi
const TARGET_COORD = {
  lat: -1.607748696498515,
  lng: 103.5238542092098,
};
const MAX_RADIUS = 100;

const TestingPanel = ({ onClose }) => {
  // ambil data + fungsi lokasi dari context
  const { location, buffer, error, resetBuffer, isWatching } = useLocation();

  const debugOptionsRef = useRef({});

  // state untuk UI & deteksi
  const [status, setStatus] = useState("Menunggu data...");
  const [distance, setDistance] = useState(null);
  const [isFake, setIsFake] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const [showDebug, setShowDebug] = useState(false);
  const [serverResult, setServerResult] = useState(null);
  const validatingRef = useRef(false);

  // parameter deteksi (bisa diubah via debug panel)
  const [debugOptions, setDebugOptions] = useState({
    maxSpeedKmh: 10,
    debug: false,
  });

  useEffect(() => {
    if (serverResult?.distanceFromOffice !== undefined) {
      setDistance(serverResult.distanceFromOffice);
    }
  }, [serverResult]);

  // sync ref agar parameter update tidak trigger re-run effect
  useEffect(() => {
    debugOptionsRef.current = { ...debugOptions, debug: showDebug };
  }, [debugOptions, showDebug]);

  // jalankan deteksi setiap ada update buffer/lokasi
  useEffect(() => {
    // handle error dari context
    if (error) {
      setStatus(`Error: ${error}`);
      return;
    }

    // jika belum ada data lokasi tunggu
    if (!location) {
      setStatus(isWatching ? "Menunggu sinyal GPS..." : "GPS tidak aktif");
      return;
    }

    // deteksi fake GPS (butuh minimal 5 titik di buffer)
    if (buffer.length >= 5) {
      validateByBackend();
    } else {
      setStatus(`Mengumpulkan data... (${buffer.length}/5)`);
    }
  }, [buffer, location, error, isWatching]);

  // reset buffer + UI state (untuk testing ulang)
  const handleClearBuffer = () => {
    resetBuffer();
    setIsFake(false);
    setDebugInfo(null);
    setStatus("Buffer direset. Menunggu data baru...");
  };

  // update parameter deteksi
  const handleParamChange = (key, value) => {
    setDebugOptions((prev) => ({ ...prev, [key]: parseFloat(value) || 0 }));
  };

  const validateByBackend = async () => {
    if (validatingRef.current) return;

    try {
      validatingRef.current = true;

      if (!location || buffer.length < 5) {
        return;
      }

      const res = await api.post("/face/validate-location", {
        location,
        locationBuffer: buffer,
        options: debugOptionsRef.current,
      });

      setServerResult(res.data);

      if (res.data.fakeGpsDetected) {
        setStatus("Terdeteksi Fake GPS");
        setIsFake(true);
      } else if (res.data.outsideRadius) {
        setStatus("Di luar area");
        setIsFake(false);
      } else {
        setStatus("Lokasi valid");
        setIsFake(false);
      }
    } catch (error) {
      console.error(error);

      setStatus(error.response?.data?.message || "Gagal validasi lokasi");
    } finally {
      setTimeout(() => {
        validatingRef.current = false;
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100]">
      <div
        className="bg-gray-50 w-full h-full overflow-y-auto"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {/* header dengan padding top untuk safe area */}
        <div className="bg-gradient-to-r from-[#0974c6] to-[#0984E3] text-white p-5 shadow-lg pt-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-bold">Deteksi Fake GPS</h1>
              <p className="text-sm opacity-90 mt-1">
                Halaman Testing Sementara
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDebug(!showDebug)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  showDebug
                    ? "bg-white/20 text-white"
                    : "bg-white/10 text-white/80 hover:bg-white/20"
                }`}
              >
                {showDebug ? "Hide" : "Debug"}
              </button>
              <button
                onClick={onClose}
                className="px-3 py-1 bg-white/20 rounded-lg text-xs font-medium hover:bg-white/30 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4 pb-24">
          {/* status card */}
          <div
            className={`rounded-2xl shadow-md p-4 ${
              isFake
                ? "bg-red-50 border-red-500"
                : status.includes("valid")
                  ? "bg-green-50 border-green-500"
                  : status.includes("luar")
                    ? "bg-yellow-50 border-yellow-500"
                    : "bg-blue-50 border-blue-500"
            }`}
          >
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-gray-800">Status Deteksi</h2>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 rounded text-xs font-bold ${
                    isFake
                      ? "bg-red-200 text-red-800"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {isFake ? "FAKE" : "REAL"}
                </span>
                {/* indikator GPS aktif */}
                <span
                  className={`w-2 h-2 rounded-full ${isWatching ? "bg-green-500 animate-pulse" : "bg-gray-400"}`}
                  title={isWatching ? "GPS aktif" : "GPS tidak aktif"}
                />
              </div>
            </div>
            <p
              className={`text-lg font-semibold mt-2 ${
                isFake
                  ? "text-red-700"
                  : status.includes("valid")
                    ? "text-green-700"
                    : "text-gray-700"
              }`}
            >
              {status}
            </p>
          </div>

          {/* lokasi saat ini */}
          <div className="bg-white rounded-2xl shadow-md p-4">
            <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              Lokasi Saat Ini
              {location?.accuracy && (
                <span
                  className={`text-xs px-2 py-0.5 rounded ${
                    location.accuracy < 20
                      ? "bg-green-100 text-green-700"
                      : location.accuracy < 50
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                  }`}
                >
                  ±{Math.round(location.accuracy)}m
                </span>
              )}
            </h2>

            {location ? (
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-gray-500 text-xs">Latitude</p>
                    <p className="font-mono">{location.latitude.toFixed(7)}</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-gray-500 text-xs">Longitude</p>
                    <p className="font-mono">{location.longitude.toFixed(7)}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-gray-600">Jarak ke target:</span>
                  <span
                    className={`font-bold ${
                      distance <= MAX_RADIUS ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {distance !== null ? `${distance} m` : "-"}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-gray-400 text-center py-4">
                Menunggu sinyal GPS...
              </p>
            )}
          </div>

          {/* info target dan buttom */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl shadow-md p-4 border border-indigo-100">
            <h2 className="font-bold text-gray-800 mb-2">
              Target Lokasi Presensi
            </h2>
            <div className="space-y-1 text-sm">
              <p className="font-mono text-gray-700">
                {TARGET_COORD.lat.toFixed(7)}, {TARGET_COORD.lng.toFixed(7)}
              </p>
              <p className="text-gray-600">
                Radius valid:{" "}
                <span className="font-semibold">{MAX_RADIUS} meter</span>
              </p>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  distance <= MAX_RADIUS ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <span className="text-xs text-gray-600">
                {distance <= MAX_RADIUS ? "Dalam area" : "Luar area"}
              </span>
            </div>

            {/* action buttons */}
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleClearBuffer}
                className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 active:scale-[0.98] transition flex items-center justify-center gap-1"
              >
                Reset Buffer
              </button>
            </div>
          </div>

          {/* debug panel */}
          {showDebug && (
            <div className="bg-gray-900 text-gray-100 rounded-2xl shadow-md p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-bold">Debug Panel</h2>
                <span className="text-xs text-gray-400">
                  Buffer: {buffer.length}/5
                </span>
              </div>

              {/* parameter controls */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-gray-400 mb-1">
                    Max Speed (km/h)
                  </label>
                  <input
                    type="number"
                    value={debugOptions.maxSpeedKmh}
                    onChange={(e) =>
                      handleParamChange("maxSpeedKmh", e.target.value)
                    }
                    className="w-full bg-gray-800 rounded px-2 py-1 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* live debug info */}
              {debugInfo && (
                <div className="bg-gray-800 rounded-lg p-3 text-xs space-y-1 font-mono">
                  <p>
                    Buffer:{" "}
                    <span className="text-blue-300">
                      {debugInfo.bufferCount}/5
                    </span>
                  </p>
                  <p>
                    Bearing:{" "}
                    <span className="text-blue-300">
                      {debugInfo.lastBearing}°
                    </span>
                  </p>
                  <p>
                    Step:{" "}
                    <span className="text-blue-300">
                      {debugInfo.lastStep} m
                    </span>
                  </p>
                  <p>
                    Delta:{" "}
                    <span className="text-blue-300">{debugInfo.timeDiff}</span>
                  </p>
                  <p>
                    Speed:
                    <span
                      className={
                        parseFloat(debugInfo.lastSpeedKmh) >
                        debugOptions.maxSpeedKmh
                          ? "text-red-400 font-bold ml-1"
                          : "text-green-400 ml-1"
                      }
                    >
                      {debugInfo.lastSpeedKmh} km/h
                    </span>
                  </p>
                </div>
              )}

              {/* buffer points list */}
              <div>
                <h3 className="font-semibold mb-2">
                  Buffer Points (5 Terakhir)
                </h3>
                <div className="space-y-2 max-h-48 overflow-auto pr-1">
                  {buffer.length > 0 ? (
                    [...buffer].reverse().map((b, i) => (
                      <div
                        key={i}
                        className="bg-gray-800 rounded-lg p-2 text-xs font-mono border-l-2 border-blue-500"
                      >
                        <div className="flex justify-between text-gray-400 mb-1">
                          <span className="text-blue-300 font-bold">
                            #{buffer.length - i}
                          </span>
                          <span>
                            {new Date(b.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-gray-200">
                          {b.latitude.toFixed(6)}, {b.longitude.toFixed(6)}
                        </p>
                        <p className="text-gray-400">
                          Acc: {Math.round(b.accuracy)}m
                        </p>
                        {i < buffer.length - 1 &&
                          buffer[buffer.length - i - 2] && (
                            <p className="text-gray-500 text-[10px] mt-1">
                              {" "}
                              {calculateBearing(
                                buffer[buffer.length - i - 2].latitude,
                                buffer[buffer.length - i - 2].longitude,
                                b.latitude,
                                b.longitude,
                              ).toFixed(1)}
                              ° |
                              {calculateDistance(
                                buffer[buffer.length - i - 2].latitude,
                                buffer[buffer.length - i - 2].longitude,
                                b.latitude,
                                b.longitude,
                              ).toFixed(2)}
                              m
                            </p>
                          )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">
                      Buffer kosong...
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* visualisasi pergerakan */}
          <div className="bg-white rounded-2xl shadow-md p-4">
            <h2 className="font-bold text-gray-800 mb-3">
              Visualisasi Pergerakan
            </h2>
            <div className="h-32 bg-gradient-to-b from-gray-50 to-gray-100 rounded-lg relative overflow-hidden">
              {/* target marker */}
              <div
                className="absolute w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow animate-pulse"
                style={{
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                }}
                title="Target Absensi"
              />

              {/* user position dots */}
              {buffer.map((b, i) => {
                const dx = (b.longitude - TARGET_COORD.lng) * 8000;
                const dy = (b.latitude - TARGET_COORD.lat) * -8000;
                const x = Math.max(10, Math.min(90, 50 + dx));
                const y = Math.max(10, Math.min(90, 50 + dy));

                return (
                  <div
                    key={i}
                    className={`absolute w-3 h-3 rounded-full border-2 border-white shadow transition-all duration-300 ${
                      i === buffer.length - 1
                        ? "bg-blue-500 scale-125 ring-2 ring-blue-300"
                        : "bg-blue-300"
                    }`}
                    style={{ left: `${x}%`, top: `${y}%` }}
                    title={`Point #${i + 1}`}
                  />
                );
              })}

              {/* radius circle */}
              <div
                className="absolute border-2 border-dashed border-green-300 rounded-full pointer-events-none"
                style={{
                  left: "50%",
                  top: "50%",
                  width: `${(MAX_RADIUS / 10) * 2}%`,
                  height: `${(MAX_RADIUS / 10) * 2}%`,
                  transform: "translate(-50%, -50%)",
                }}
                title={`Radius ${MAX_RADIUS}m`}
              />

              {/* ket */}
              <div className="absolute bottom-2 left-2 flex gap-3 text-[10px] bg-white/80 px-2 py-1 rounded">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full" /> Target
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" /> Posisi
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 border border-dashed border-green-400 rounded-full" />{" "}
                  {MAX_RADIUS}m
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestingPanel;
