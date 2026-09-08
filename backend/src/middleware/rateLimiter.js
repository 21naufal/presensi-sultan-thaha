const rateLimit = require("express-rate-limit");

const faceLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 menit
  max: 20, // maksimal 20 request
  message: {
    success: false,
    message: "Terlalu banyak request, coba lagi nanti.",
  },

  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  faceLimiter,
};
