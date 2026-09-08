const getWIBDate = (date = new Date()) => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
  }).format(date);
};

// Dapatkan waktu WIB dalam format HH:MM:SS
const getWIBTime = (date = new Date()) => {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
};

// Dapatkan datetime WIB lengkap (untuk logging)
const getWIBDateTime = (date = new Date()) => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
};

module.exports = {
  getWIBDate,
  getWIBTime,
  getWIBDateTime,
};
