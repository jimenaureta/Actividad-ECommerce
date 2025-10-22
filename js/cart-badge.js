// js/cart-badge.js (no module)
// Utilidades de carrito + actualización de badge en navbar.
(function () {
  const CART_KEY = "cartItems";
  function readCart() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }
  function writeCart(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items || []));
    window.dispatchEvent(new CustomEvent("cart:updated"));
  }
  function totalQty(items) {
    const list = items || readCart();
    return list.reduce((sum, it) => sum + (parseInt(it.quantity, 10) || 0), 0);
  }
  function renderCartBadge() {
    const el = document.getElementById("cartCountBadge");
    if (!el) return;
    const qty = totalQty();
    if (qty > 0) {
      el.classList.remove("d-none");
      el.textContent = String(qty);
      el.setAttribute("aria-label", `Hay ${qty} producto${qty===1?'':'s'} en el carrito`);
    } else {
      el.classList.add("d-none");
      el.textContent = "";
      el.removeAttribute("aria-label");
    }
  }
  // Exponer en window para otros scripts
  window.CART_KEY = CART_KEY;
  window.cartUtils = { readCart, writeCart, totalQty, renderCartBadge };

  document.addEventListener("DOMContentLoaded", renderCartBadge);
  window.addEventListener("cart:updated", renderCartBadge);
})();