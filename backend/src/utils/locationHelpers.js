// Menghitung jarak antara 2 koordinat GPS menggunakan rumus Haversine (dalam meter)
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Menghitung bearing atau arah pergerakan antara 2 titik koordinat
export const calculateBearing = (lat1, lon1, lat2, lon2) => {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const λ1 = (lon1 * Math.PI) / 180;
  const λ2 = (lon2 * Math.PI) / 180;

  const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);

  const θ = Math.atan2(y, x);
  return ((θ * 180) / Math.PI + 360) % 360;
};

// Menambahkan koordinat ke buffer sliding window (maksimal 5 titik terbaru)
export const addToLocationBuffer = (buffer, coord) => {
  const newCoord = {
    ...coord,
    timestamp: coord.timestamp || Date.now(),
  };
  return [...buffer, newCoord].slice(-5);
};

// Mendeteksi pola pergerakan mencurigakan (indikasi penggunaan Fake GPS)
export const isSuspiciousPattern = (buffer, options = {}) => {
  const { maxSpeedKmh = 15 } = options;

  // Validasi input minimal
  if (!Array.isArray(buffer) || buffer.length < 5) {
    return false;
  }

  const points = buffer.slice(-5);
  const lats = points.map((p) => p.latitude);
  const lngs = points.map((p) => p.longitude);

  // Cek 1: Koordinat identik (statis sempurna)
  const uniqueLng = [...new Set(lngs.map((lng) => lng.toFixed(6)))];
  if (uniqueLng.length === 1) return true;

  const uniqueLat = [...new Set(lats.map((lat) => lat.toFixed(6)))];
  if (uniqueLat.length === 1) return true;

  // Cek 2: Pergerakan linear sempurna (hanya ke satu arah)
  let northCount = 0,
    southCount = 0;
  for (let i = 1; i < lats.length; i++) {
    if (lats[i] < lats[i - 1]) northCount++;
    else if (lats[i] > lats[i - 1]) southCount++;
  }
  if (northCount === 4 || southCount === 4) return true;

  // Cek 3: Akurasi GPS terlalu stabil (tidak wajar untuk GPS asli)
  const accValues = points
    .map((p) => p.accuracy)
    .filter((v) => v != null && v > 0);
  if (accValues.length >= 4) {
    const uniqueAcc = [
      ...new Set(accValues.map((a) => Math.round(a * 10) / 10)),
    ];
    if (uniqueAcc.length === 1) return true;
  }

  // Cek 4: Kecepatan pergerakan tidak masuk akal (teleportasi)
  for (let i = 1; i < points.length; i++) {
    const dist = calculateDistance(
      points[i - 1].latitude,
      points[i - 1].longitude,
      points[i].latitude,
      points[i].longitude,
    );
    const timeDiff = (points[i].timestamp - points[i - 1].timestamp) / 1000;

    if (timeDiff > 0) {
      const speedKmh = (dist / timeDiff) * 3.6;
      if (speedKmh > maxSpeedKmh) return true;
    }
  }

  // Tidak ada pola mencurigakan yang terdeteksi
  return false;
};
