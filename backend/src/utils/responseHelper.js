// response standar untuk semua endpoint
exports.success = (res, message, data = null, statusCode = 200) => {
  return res.status(statusCode).json({
    status: "success",
    message,
    data,
  });
};

exports.error = (res, message, statusCode = 400, errors = null) => {
  return res.status(statusCode).json({
    status: "error",
    message,
    errors,
  });
};

exports.serverError = (res, error, context = "Server") => {
  console.error(`[${context}] Error:`, error);
  return res.status(500).json({
    status: "error",
    message: "Terjadi kesalahan pada server",
  });
};
