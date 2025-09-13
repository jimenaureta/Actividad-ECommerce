// js/init.js
import {
  initApp,
  // Bridge de compatibilidad:
  getJSONData, showSpinner, hideSpinner,
  CATEGORIES_URL, PUBLISH_PRODUCT_URL, PRODUCTS_BASE_URL,
  PRODUCT_INFO_URL, PRODUCT_INFO_COMMENTS_URL,
  CART_INFO_URL, CART_BUY_URL, EXT_TYPE
} from "./common.js";

// Protege todas las páginas privadas (todas menos login.html)
initApp({ requiereSesion: true, navbarBadgeSel: "#usuarioActual", btnSalirSel: "#btnSalir" });

// ---- BRIDGE GLOBAL para scripts legacy (no-module) ----
Object.assign(window, {
  getJSONData, showSpinner, hideSpinner,
  CATEGORIES_URL, PUBLISH_PRODUCT_URL,
  PRODUCTS_URL: PRODUCTS_BASE_URL, // alias clásico
  PRODUCT_INFO_URL, PRODUCT_INFO_COMMENTS_URL,
  CART_INFO_URL, CART_BUY_URL, EXT_TYPE
});
