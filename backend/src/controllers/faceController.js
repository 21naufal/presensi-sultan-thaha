const db = require("../config/db");
const {
  calculateDistance,
  isSuspiciousPattern,
} = require("../utils/locationHelpers");
const { isMouthOpen } = require("../utils/challengeHelpers");
const { validateChallenge } = require("../utils/challengeValidator");

// const TARGET_COORD = { lat: -1.607748696498515, lng: 103.5238542092098 };
// const MAX_RADIUS = 100;

const getUnitLokasi = async (pegawaiId) => {
  const query = `
    SELECT 
      l.latitude,
      l.longitude,
      l.radius,
      l.nama_lokasi,
      u.nama_unit
    FROM pegawai p
    JOIN unit u ON p.unit_id = u.id_unit
    JOIN lokasi l ON u.lokasi_id = l.id_lokasi
    WHERE p.id_pegawai = ?
  `;

  const [rows] = await db.query(query, [pegawaiId]);

  if (rows.length === 0) {
    return null;
  }

  return {
    lat: parseFloat(rows[0].latitude),
    lng: parseFloat(rows[0].longitude),
    radius: parseInt(rows[0].radius),
    namaLokasi: rows[0].nama_lokasi,
    namaUnit: rows[0].nama_unit,
  };
};

exports.registerFace = async (req, res) => {
  const { pegawai_id, descriptor } = req.body;

  if (!pegawai_id || !Array.isArray(descriptor) || descriptor.length !== 128) {
    return res.status(400).json({
      message: "Descriptor tidak valid",
      received: {
        type: typeof descriptor,
        length: Array.isArray(descriptor) ? descriptor.length : "N/A",
      },
    });
  }

  try {
    const descriptorToSave =
      typeof descriptor === "string" ? descriptor : JSON.stringify(descriptor);
    await db.query(
      `INSERT INTO data_wajah (pegawai_id, descriptor, created_at) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE descriptor = VALUES(descriptor)`,
      [pegawai_id, descriptorToSave],
    );
    return res.json({ message: "Data wajah berhasil disimpan" });
  } catch (error) {
    console.error("Error menyimpan wajah:", error);
    return res.status(500).json({ message: "Gagal menyimpan data wajah" });
  }
};

exports.getFaceByUserId = async (req, res) => {
  const pegawai_id = req.user.pegawai_id;
  try {
    const [rows] = await db.query(
      `SELECT descriptor FROM data_wajah WHERE pegawai_id = ?`,
      [pegawai_id],
    );
    if (rows.length === 0)
      return res.status(404).json({ message: "Data wajah tidak ditemukan" });

    let descriptor = rows[0].descriptor;
    if (typeof descriptor === "string") {
      try {
        descriptor = JSON.parse(descriptor);
      } catch (parseError) {
        return res.status(500).json({
          message: "Format descriptor rusak",
          error: parseError.message,
        });
      }
    }

    if (!Array.isArray(descriptor) || descriptor.length !== 128) {
      return res.status(500).json({ message: "Descriptor tidak valid" });
    }
    return res.json({ descriptor });
  } catch (error) {
    console.error("Error mengambil wajah:", error);
    return res.status(500).json({ message: "Gagal mengambil data wajah" });
  }
};

exports.verifyFace = async (req, res) => {
  const {
    capturedDescriptor,
    landmarks,
    location,
    locationBuffer,
    challengeType,
    challengeProof,
  } = req.body;

  const pegawai_id = req.user.pegawai_id;

  // Validasi input dasar
  if (!Array.isArray(capturedDescriptor) || capturedDescriptor.length !== 128)
    return res.status(400).json({ message: "Descriptor tidak valid" });
  if (!Array.isArray(landmarks) || landmarks.length < 68)
    return res.status(400).json({ message: "Landmarks tidak valid" });
  if (
    !location ||
    typeof location.latitude !== "number" ||
    typeof location.longitude !== "number"
  )
    return res.status(400).json({ message: "Data lokasi tidak valid" });
  if (!Array.isArray(locationBuffer) || locationBuffer.length < 5)
    return res.status(400).json({ message: "Buffer lokasi belum cukup" });

  try {
    // AMBIL LOKASI UNIT KERJA PEGAWAI
    const unitLokasi = await getUnitLokasi(pegawai_id);

    if (!unitLokasi) {
      return res.status(400).json({
        verified: false,
        message: "Unit kerja atau lokasi tidak ditemukan untuk pegawai ini.",
      });
    }

    console.log(
      `[PRESENSI] Unit lokasi: ${unitLokasi.namaUnit} - ${unitLokasi.namaLokasi}`,
    );
    console.log(
      `[PRESENSI] Target: ${unitLokasi.lat}, ${unitLokasi.lng} (radius: ${unitLokasi.radius}m)`,
    );

    // Ambil data wajah
    const [rows] = await db.query(
      `SELECT descriptor FROM data_wajah WHERE pegawai_id = ?`,
      [pegawai_id],
    );
    if (rows.length === 0)
      return res.status(404).json({ message: "Data wajah tidak ditemukan" });

    let storedDescriptor = rows[0].descriptor;
    if (typeof storedDescriptor === "string")
      storedDescriptor = JSON.parse(storedDescriptor);

    // 1. Validasi Challenge
    const challengeResult = validateChallenge(
      challengeType,
      landmarks,
      challengeProof || {},
    );

    if (!challengeResult.valid) {
      return res.status(400).json({
        verified: false,
        message: challengeResult.message,
      });
    }

    // 2. Verifikasi Wajah
    const distance = storedDescriptor.reduce(
      (sum, val, i) => sum + Math.pow(val - capturedDescriptor[i], 2),
      0,
    );
    const euclideanDistance = Math.sqrt(distance);
    const isFaceMatch = euclideanDistance < 0.4;

    // 3. Verifikasi Lokasi (PAKAI LOKASI UNIT, BUKAN HARDCODE)
    const fakeGpsDetected = isSuspiciousPattern(locationBuffer, {
      maxSpeedKmh: 15,
      debug: false,
    });

    const distanceFromOffice = calculateDistance(
      location.latitude,
      location.longitude,
      unitLokasi.lat, // Pakai latitude unit
      unitLokasi.lng, // Pakai longitude unit
    );

    const outsideRadius = distanceFromOffice > unitLokasi.radius; // Pakai radius unit
    const isLocationValid = !fakeGpsDetected && !outsideRadius;

    // 4. Hasil Final
    const finalVerified = isFaceMatch && isLocationValid;
    let message = "Presensi berhasil";

    if (!isFaceMatch)
      message =
        "Wajah yang anda gunakan tidak cocok dengan wajah yang terdaftar.";
    else if (fakeGpsDetected)
      message = "Lokasi anda terdeteksi mencurigakan (kemungkinan fake GPS).";
    else if (outsideRadius)
      message = `Anda berada di luar area presensi ${unitLokasi.namaUnit} (${Math.round(distanceFromOffice)} meter dari lokasi, radius maksimum ${unitLokasi.radius} meter).`;

    console.log(
      `[PRESENSI] user=${pegawai_id} verified=${finalVerified} distance=${Math.round(distanceFromOffice)}m radius=${unitLokasi.radius}m reason=${message}`,
    );

    return res.json({
      verified: finalVerified,
      faceVerified: isFaceMatch,
      faceDistance: euclideanDistance.toFixed(4),
      locationVerified: isLocationValid,
      fakeGpsDetected,
      outsideRadius,
      distanceFromOffice: Math.round(distanceFromOffice),
      maxRadius: unitLokasi.radius,
      namaUnit: unitLokasi.namaUnit,
      namaLokasi: unitLokasi.namaLokasi,
      timestamp: new Date().toISOString(),
      message,
    });
  } catch (error) {
    console.error(`[ERROR] verifyFace user=${pegawai_id}:`, error.message);
    return res
      .status(500)
      .json({ message: "Gagal memverifikasi wajah dan lokasi" });
  }
};

exports.validateLocation = async (req, res) => {
  const { location, locationBuffer, options } = req.body;
  const pegawai_id = req.user.pegawai_id;

  if (
    !location ||
    typeof location.latitude !== "number" ||
    typeof location.longitude !== "number"
  ) {
    return res.status(400).json({ message: "Data lokasi tidak valid" });
  }
  if (!Array.isArray(locationBuffer) || locationBuffer.length < 5) {
    return res.status(400).json({ message: "Buffer lokasi belum cukup" });
  }

  try {
    // AMBIL LOKASI UNIT KERJA PEGAWAI
    const unitLokasi = await getUnitLokasi(pegawai_id);

    if (!unitLokasi) {
      return res.status(400).json({
        message: "Unit kerja atau lokasi tidak ditemukan",
      });
    }

    const fakeGpsDetected = isSuspiciousPattern(locationBuffer, {
      maxSpeedKmh: options?.maxSpeedKmh || 15,
      debug: options?.debug || false,
    });

    const distanceFromOffice = calculateDistance(
      location.latitude,
      location.longitude,
      unitLokasi.lat, // Pakai latitude unit
      unitLokasi.lng, // Pakai longitude unit
    );

    const outsideRadius = distanceFromOffice > unitLokasi.radius; // Pakai radius unit

    return res.json({
      valid: !fakeGpsDetected && !outsideRadius,
      fakeGpsDetected,
      outsideRadius,
      distanceFromOffice: Math.round(distanceFromOffice),
      maxRadius: unitLokasi.radius,
      namaUnit: unitLokasi.namaUnit,
    });
  } catch (error) {
    console.error("Error validasi lokasi:", error);
    return res.status(500).json({ message: "Gagal validasi lokasi" });
  }
};
