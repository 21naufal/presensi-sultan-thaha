// rumus haversine untuk menghitung jarak antar 2 titik di peta
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  // radius bumi dalam meter
  const R = 6371e3;

  // ubah derajat ke radian
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  // selisih latitude & longitude
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  // rumus utama haversine
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  // hitung hasil lengkung bumi
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  // return jarak dalam meter
  return R * c;
};

// hitung bearing / hitung arah gerak
export const calculateBearing = (lat1, lon1, lat2, lon2) => {
  // ubah koordinat ke radian
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const λ1 = (lon1 * Math.PI) / 180;
  const λ2 = (lon2 * Math.PI) / 180;

  // rumus matematika arah perpindahan
  const y = Math.sin(λ2 - λ1) * Math.cos(φ2);

  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);

  // hitung sudut arah
  const θ = Math.atan2(y, x);
  // ubah hasil ke 0° - 360°
  return ((θ * 180) / Math.PI + 360) % 360;
};

// tambahkan history lokasi ke sliding window buffer (maks 5 titik)
export const addToLocationBuffer = (buffer, coord) => {
  // tambahkan timestamp otomatis agar bisa menghitung speed & waktu perpindahan
  const newCoord = {
    ...coord,
    timestamp: coord.timestamp || Date.now(),
  };

  // tambahkan titik baru ke buffer
  const newBuffer = [...buffer, newCoord];
  // ambil hanya 5 data terakhir
  return newBuffer.slice(-5);
};
