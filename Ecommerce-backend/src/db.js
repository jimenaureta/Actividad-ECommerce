// src/db.js
const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "ecommerce",
});

// (Opcional) Test rápido de conexión al iniciar
pool
  .getConnection()
  .then((conn) => {
    console.log("✅ Conexión a MySQL OK");
    conn.release();
  })
  .catch((err) => {
    console.error("❌ Error conectando a MySQL:", err.code, err.message);
  });

module.exports = { pool };