// src/routes/api.js
const express = require("express");
const fs = require("fs");
const path = require("path");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

// Ruta base donde están los JSON del eMercado (carpeta data)
const dataDir = path.join(__dirname, "..", "..", "data");

// Helper para leer JSON desde data/
function readJson(relPath) {
  const filePath = path.join(dataDir, relPath);
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

/* ================================
   CATEGORÍAS
   GET /api/categories.json
   ================================ */
router.get("/categories.json", authMiddleware, (req, res) => {
  try {
    const data = readJson("cats/cat.json");
    res.json(data);
  } catch (err) {
    console.error("Error al leer categories:", err);
    res.status(500).json({ message: "Error al leer categorías" });
  }
});

/* ================================
   PRODUCTOS POR CATEGORÍA
   GET /api/cats_products/:catId.json
   ================================ */
router.get("/cats_products/:catId.json", authMiddleware, (req, res) => {
  const { catId } = req.params;
  try {
    const data = readJson(`cats_products/${catId}.json`);
    res.json(data);
  } catch (err) {
    console.error("Error al leer cats_products:", err);
    res.status(500).json({ message: "Error al leer productos de la categoría" });
  }
});

/* ================================
   INFO DE PRODUCTO
   GET /api/products/:prodId.json
   ================================ */
router.get("/products/:prodId.json", authMiddleware, (req, res) => {
  const { prodId } = req.params;
  try {
    const data = readJson(`products/${prodId}.json`);
    res.json(data);
  } catch (err) {
    console.error("Error al leer product:", err);
    res.status(500).json({ message: "Error al leer información del producto" });
  }
});

/* ================================
   COMENTARIOS DE PRODUCTO
   GET /api/products_comments/:prodId.json
   ================================ */
router.get("/products_comments/:prodId.json", authMiddleware, (req, res) => {
  const { prodId } = req.params;
  try {
    const data = readJson(`products_comments/${prodId}.json`);
    res.json(data);
  } catch (err) {
    console.error("Error al leer comments:", err);
    res
      .status(500)
      .json({ message: "Error al leer comentarios del producto" });
  }
});

/* ================================
   CARRITO DEL USUARIO (JSON)
   GET /api/user_cart/25801.json
   ================================ */
router.get("/user_cart/25801.json", authMiddleware, (req, res) => {
  try {
    const data = readJson("user_cart/25801.json");
    res.json(data);
  } catch (err) {
    console.error("Error al leer user_cart:", err);
    res.status(500).json({ message: "Error al leer carrito de usuario" });
  }
});

/* ================================
   BUY (Compra)
   GET /api/cart/buy.json
   ================================ */
router.get("/cart/buy.json", authMiddleware, (req, res) => {
  try {
    const data = readJson("cart/buy.json");
    res.json(data);
  } catch (err) {
    console.error("Error al leer buy:", err);
    res.status(500).json({ message: "Error al procesar compra" });
  }
});

module.exports = router;