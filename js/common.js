// ================== common.js ==================

// ---------- Spinner ----------
export const showSpinner = () => {
  const el = document.getElementById("spinner-wrapper");
  if (el) el.style.display = "block";
};
export const hideSpinner = () => {
  const el = document.getElementById("spinner-wrapper");
  if (el) el.style.display = "none";
};

// ---------- getJSONData compatible (devuelve {status, data}) ----------
export const getJSONData = (url) => {
  const result = {};
  showSpinner();
  return fetch(url)
    .then((r) => {
      if (!r.ok) throw new Error(r.statusText || `HTTP ${r.status}`);
      return r.json();
    })
    .then((json) => {
      result.status = "ok";
      result.data = json;
      hideSpinner();
      return result;
    })
    .catch((err) => {
      result.status = "error";
      result.data = err;
      hideSpinner();
      return result;
    });
};

// ---------- Constantes de API (clásicas del template) ----------
export const CATEGORIES_URL            = "https://japceibal.github.io/emercado-api/cats/cat.json";
export const PUBLISH_PRODUCT_URL       = "https://japceibal.github.io/emercado-api/sell/publish.json";
export const PRODUCTS_BASE_URL         = "https://japceibal.github.io/emercado-api/cats_products/";
export const PRODUCT_INFO_URL          = "https://japceibal.github.io/emercado-api/products/";
export const PRODUCT_INFO_COMMENTS_URL = "https://japceibal.github.io/emercado-api/products_comments/";
export const CART_INFO_URL             = "https://japceibal.github.io/emercado-api/user_cart/";
export const CART_BUY_URL              = "https://japceibal.github.io/emercado-api/cart/buy.json";
export const EXT_TYPE                  = ".json";

// ---------- Utilidades ----------
export const fullAsset = (path) => {
  const p = String(path || "").trim();
  if (/^https?:\/\//i.test(p)) return p;
  const clean = p.replace(/^(\.\/|\/)+/g, "");
  return `https://japceibal.github.io/emercado-api/${clean}`;
};

// ---------- Sesión ----------
const K = "sesionIniciada";
const U = "usuario";

export const sesionActiva        = () => sessionStorage.getItem(K) === "true";
export const getUsuario          = () => sessionStorage.getItem(U) || "";
export const iniciarSesion       = (user) => { sessionStorage.setItem(K, "true"); sessionStorage.setItem(U, user || ""); };
export const cerrarSesion        = () => { sessionStorage.removeItem(K); sessionStorage.removeItem(U); location.href = "index.html"; };
export const protegerRuta        = () => { const enLogin = /(^|\/)login\.html$/i.test(location.pathname); if (!sesionActiva() && !enLogin) location.href = "login.html"; };
export const redirigirSiLogueado = (to = "index.html") => { const enLogin = /(^|\/)login\.html$/i.test(location.pathname); if (enLogin && sesionActiva()) location.href = to; };

// ---------- Navbar ----------
export const pintarUsuarioNavbar = (selector = "#usuarioActual") => {
  const badge = document.querySelector(selector);
  if (badge) badge.textContent = getUsuario();
};
export const wireSalir = (selector = "#btnSalir") => {
  const btn = document.querySelector(selector);
  if (btn) btn.addEventListener("click", cerrarSesion);
};

// ---------- Bootstrap común ----------
export const initApp = ({ requiereSesion = true, navbarBadgeSel = "#usuarioActual", btnSalirSel = "#btnSalir" } = {}) => {
  if (requiereSesion) protegerRuta(); else redirigirSiLogueado();
  document.addEventListener("DOMContentLoaded", () => {
    pintarUsuarioNavbar(navbarBadgeSel);
    wireSalir(btnSalirSel);
  });
};
// ================== /common.js ==================