// ================== common.js ==================

// URL fija para la cat. 101 (Autos)
export const PRODUCTS_101_URL =
  "https://japceibal.github.io/emercado-api/cats_products/101.json";

// Fetch JSON simple con manejo de error
export const getJSONData = (URL) =>
  fetch(URL).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  });

// Convierte rutas relativas del JSON (p.ej. "img/xxx.jpg") a URL absoluta del repo público
export const fullAsset = (path) => {
  const p = String(path || "").trim();
  if (/^https?:\/\//i.test(p)) return p;           // ya es absoluta
  const clean = p.replace(/^(\.\/|\/)+/g, "");     // limpia "./" o "/"
  return `https://japceibal.github.io/emercado-api/${clean}`;
};

// ===== Sesión (sessionStorage) =====
const K = "sesionIniciada";
const U = "usuario";

export const sesionActiva = () => sessionStorage.getItem(K) === "true";

export const iniciarSesion = (user) => {
  sessionStorage.setItem(K, "true");
  sessionStorage.setItem(U, user || "");
};

export const cerrarSesion = () => {
  sessionStorage.removeItem(K);
  sessionStorage.removeItem(U);
  location.href = "index.html";
};

export const getUsuario = () => sessionStorage.getItem(U) || "";

// (Opcional) Guardia de sesión para páginas privadas
export const requerirSesion = () => {
  const activa = sessionStorage.getItem(K) === "true";
  const enLogin = /(^|\/)(login|index)\.html$/i.test(location.pathname);
  if (!activa && !enLogin) location.href = "login.html";
};
// ================== /common.js ==================