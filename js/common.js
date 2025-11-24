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

// ---------- getJSONData (incluye el token SIEMPRE) ----------
export const getJSONData = (url) => {
  const result = {};
  showSpinner();

  const token = localStorage.getItem("token");

  // ARMAMOS HEADERS
  const headers = {
    "Content-Type": "application/json"
  };

  // SI HAY TOKEN → LO AGREGAMOS
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return fetch(url, { headers })
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

// ---------- Constantes de API ----------
export const API_BASE_URL = "http://localhost:3000/api";

// ❗❗❗ CORRECCIÓN REALIZADA AQUÍ ❗❗❗
// ANTES:  `${API_BASE_URL}/cats/cat.json`   → daba 404
// AHORA:  `${API_BASE_URL}/categories.json` → ruta correcta del backend
export const CATEGORIES_URL            = `${API_BASE_URL}/categories.json`;

export const PUBLISH_PRODUCT_URL       = "https://japceibal.github.io/emercado-api/sell/publish.json";
export const PRODUCTS_BASE_URL         = `${API_BASE_URL}/cats_products/`;
export const PRODUCT_INFO_URL          = `${API_BASE_URL}/products/`;
export const PRODUCT_INFO_COMMENTS_URL = `${API_BASE_URL}/products_comments/`;
export const CART_INFO_URL             = `${API_BASE_URL}/user_cart/`;
export const CART_BUY_URL              = `${API_BASE_URL}/cart/buy.json`;
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
export const iniciarSesion       = (user) => {
  sessionStorage.setItem(K, "true");
  sessionStorage.setItem(U, user || "");
};
export const cerrarSesion        = () => {
  sessionStorage.removeItem(K);
  sessionStorage.removeItem(U);
  localStorage.removeItem("token"); // ← AHORA TAMBIÉN LIMPIA TOKEN
  location.href = "index.html";
};
export const protegerRuta        = () => {
  const enLogin = /(^|\/)login\.html$/i.test(location.pathname);

  // Si NO está logueado → login
  if (!sesionActiva() && !enLogin) location.href = "login.html";
};
export const redirigirSiLogueado = (to = "index.html") => {
  const enLogin = /(^|\/)login\.html$/i.test(location.pathname);
  if (enLogin && sesionActiva()) location.href = to;
};

// ---------- Navbar ----------
export const pintarUsuarioNavbar = (selector = "#usuarioActual") => {
  const badge = document.querySelector(selector);
  if (badge) badge.textContent = getUsuario();
};
export const wireSalir = (selector = "#btnSalir") => {
  const btn = document.querySelector(selector);
  if (btn) btn.addEventListener("click", cerrarSesion);
};

// ---------- Inicialización ----------
export const initApp = ({ requiereSesion = true, navbarBadgeSel = "#usuarioActual", btnSalirSel = "#btnSalir" } = {}) => {
  if (requiereSesion) protegerRuta();
  else redirigirSiLogueado();

  document.addEventListener("DOMContentLoaded", () => {
    pintarUsuarioNavbar(navbarBadgeSel);
    wireSalir(btnSalirSel);
  });
};
// ================== /common.js ==================