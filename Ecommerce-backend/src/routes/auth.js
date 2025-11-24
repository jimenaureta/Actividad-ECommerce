// routes/auth.js (o auth.js según tu estructura)
const express = require("express");
const jwt = require("jsonwebtoken");
const { pool } = require("../db");

const router = express.Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // Validación básica de entrada
  if (!email || !password) {
    return res.status(400).json({ message: "Faltan datos" });
  }

  try {
    // Consulta a la tabla users (tal como la creaste en ecommerce.sql)
    const [rows] = await pool.execute(
      "SELECT * FROM users WHERE email = ? AND password = ?",
      [email, password]
    );

    // Si no hay filas → credenciales incorrectas
    if (rows.length === 0) {
      return res.status(401).json({ message: "Credenciales incorrectas" });
    }

    const user = rows[0];

    // Generar token con JWT_SECRET de tu .env
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || "secretito",
      { expiresIn: "2h" }
    );

    return res.json({ message: "Login exitoso", token });
  } catch (e) {
    console.error("❌ Error en /login:", e.code, e.message);
    // Si es un error típico de MySQL, lo aclaramos
    if (e.code) {
      return res.status(500).json({
        message: "Error en servidor (Base de Datos)",
        code: e.code
      });
    }
    return res.status(500).json({ message: "Error en servidor" });
  }
});

module.exports = router;