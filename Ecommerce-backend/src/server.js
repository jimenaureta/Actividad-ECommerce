// src/server.js (ajusta la ruta según tu proyecto)
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { pool } = require("./db");
const authRoutes = require("./routes/auth"); // Asegúrate de que el archivo está en /routes/auth.js

// 👉 AGREGADO (NO REEMPLAZA NADA)
const apiRoutes = require("./routes/api"); // rutas del eMercado

const app = express();

app.use(cors());
app.use(express.json());

// Log para ver qué llega
app.use((req, res, next) => {
  console.log("Llega petición:", req.method, req.url);
  next();
});

// Montar rutas de autenticación → POST /api/login
app.use("/api", authRoutes);

// 👉 AGREGADO (NO BORRA NADA):
// Rutas del eMercado: categorías, productos, comentarios, carrito estático, etc.
app.use("/api", apiRoutes);

// Ruta de prueba de carrito (sin BD, sólo para testear)
app.post("/api/cart", async (req, res) => {
  try {
    console.log("Body recibido en /api/cart:", req.body);

    const { items, total } = req.body || {};

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ message: "El carrito está vacío o mal formado" });
    }

    if (total == null) {
      return res.status(400).json({ message: "Falta el total del carrito" });
    }

    return res.status(201).json({
      message: "Ruta /api/cart alcanzada correctamente (TEST)",
      received: { items, total }
    });
  } catch (error) {
    console.error("Error en POST /api/cart:", error);
    return res
      .status(500)
      .json({ message: "Error interno en /api/cart", error: error.message });
  }
});

// Ruta básica
app.get("/", (req, res) => {
  res.send("API de eCommerce funcionando ✅ (modo TEST)");
});

// 404 al final
app.use((req, res) => {
  res.status(404).json({ message: "Ruta no encontrada" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
})