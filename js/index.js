// URL del JSON (cat. 101)
export const PRODUCTS_101_URL =
  "https://japceibal.github.io/emercado-api/cats_products/101.json";

// Fetch JSON con manejo de error
export const getJSONData = (URL) =>
  fetch(URL).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  });

// Convierte "img/..." del JSON a URL absoluta del repo público
export const fullAsset = (path) => {
  const p = String(path || "").trim();
  if (/^https?:\/\//i.test(p)) return p;
  const clean = p.replace(/^(\.\/|\/)+/g, "");
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
  location.href = "index.html"; // volver al login
};

export const requerirSesion = () => {
  if (!sesionActiva()) location.href = "index.html";
};

// leer el email guardado (para pintarlo en la barra)
export const getUsuario = () => sessionStorage.getItem(U) || "";