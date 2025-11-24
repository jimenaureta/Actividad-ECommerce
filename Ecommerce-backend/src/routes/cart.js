// src/routes/cart.js
const express = require("express");
const { pool } = require("../db");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

// POST /api/cart
router.post("/cart", authMiddleware, async (req, res) => {
  let connection;

  try {
    const { items, total } = req.body || {};

    // Validación básica del body
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ message: "El carrito está vacío o mal formado" });
    }

    const parsedTotal = Number(total);
    if (isNaN(parsedTotal)) {
      return res
        .status(400)
        .json({ message: "El total del carrito es inválido" });
    }

    // El usuario viene del token verificado por authMiddleware
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1) Insertar el carrito
    const [cartResult] = await connection.execute(
      "INSERT INTO carts (user_id, total) VALUES (?, ?)",
      [userId, parsedTotal]
    );

    const cartId = cartResult.insertId;

    // 2) Insertar los ítems del carrito
    for (const item of items) {
      const productId = item.id || item.productId;
      const name = item.name || "";
      const quantity = Number(item.count || item.quantity || 1);
      const unitCost = Number(item.unitCost || item.unit_cost || 0);
      const subtotal =
        Number(item.subtotal) || Number((unitCost * quantity).toFixed(2));

      if (!productId || !name) {
        console.warn("Item sin productId o name, se ignora:", item);
        continue;
      }

      await connection.execute(
        `INSERT INTO cart_items
         (cart_id, product_id, name, unit_cost, quantity, subtotal)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [cartId, productId, name, unitCost, quantity, subtotal]
      );
    }

    await connection.commit();

    return res.status(201).json({
      message: "Carrito guardado correctamente",
      cartId
    });
  } catch (error) {
    console.error("Error al guardar el carrito:", error);

    if (connection) {
      try {
        await connection.rollback();
      } catch (e) {
        console.error("Error en rollback:", e);
      }
    }

    return res
      .status(500)
      .json({ message: "Error al guardar el carrito", error: error.message });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;