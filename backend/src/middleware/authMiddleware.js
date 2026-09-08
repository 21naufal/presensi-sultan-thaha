const jwt = require("jsonwebtoken");

exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(403).json({ message: "Token tidak ada" });

  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: "Token tidak valid" });
    req.user = decoded;
    next();
  });
};

exports.adminOnly = (req, res, next) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ message: "Akses admin saja" });
  next();
};

exports.pegawaiOnly = (req, res, next) => {
  if (req.user.role !== "pegawai")
    return res.status(403).json({ message: "Akses pegawai saja" });
  next();
};
