require("dotenv").config();
const mysql = require("mysql2");

// createPool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  timezone: "+07:00",
  waitForConnections: true,
  connectionLimit: 10, // maksimal koneksi
  queueLimit: 0,
});

// export pool sebagai promise wrapper
const db = pool.promise();

// test koneksi
db.getConnection()
  .then((connection) => {
    console.log("Database pool berhasil terkoneksi");
    connection.release();
  })
  .catch((err) => {
    console.error("Koneksi database error:", err);
  });

module.exports = db;
