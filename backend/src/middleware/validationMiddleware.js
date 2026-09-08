// validasi input untuk Unit Kerja
exports.validateUnitInput = (req, res, next) => {
  const { namaUnit, lokasiUnit, latitude, longitude, radius } = req.body;
  const errors = [];

  // validasi required fields
  if (!namaUnit?.trim()) errors.push("Nama unit wajib diisi");
  if (!lokasiUnit?.trim()) errors.push("Lokasi unit wajib diisi");
  if (!latitude || isNaN(parseFloat(latitude)))
    errors.push("Latitude harus angka valid");
  if (!longitude || isNaN(parseFloat(longitude)))
    errors.push("Longitude harus angka valid");
  if (!radius || isNaN(parseInt(radius)) || parseInt(radius) <= 0)
    errors.push("Radius harus angka positif");

  // validasi range koordinat (Indonesia)
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  if (lat < -11 || lat > 6) errors.push("Latitude di luar wilayah Indonesia");
  if (lng < 95 || lng > 141) errors.push("Longitude di luar wilayah Indonesia");

  if (errors.length > 0) {
    return res.status(400).json({
      status: "error",
      message: "Validasi gagal",
      errors,
    });
  }

  // sanitasi input (trim string)
  req.body.namaUnit = namaUnit.trim();
  req.body.lokasiUnit = lokasiUnit.trim();
  req.body.latitude = parseFloat(latitude).toFixed(8);
  req.body.longitude = parseFloat(longitude).toFixed(8);
  req.body.radius = parseInt(radius);

  next();
};
