require("dotenv").config();
const bcrypt = require("bcrypt");

const plainPassword = "admin123"; // ganti dengan password yang ingin di hash
const saltRounds = 10; // sesuaikan dengan config backend

bcrypt.hash(plainPassword, saltRounds, (err, hash) => {
  if (err) {
    console.error("Error:", err);
    return;
  }
  console.log("\nHash bcrypt untuk password '" + plainPassword + "':");
  console.log(hash);
  console.log("\nCopy hash di atas untuk INSERT ke tabel users");
});
